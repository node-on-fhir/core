// packages/smart-web-messaging/server/methods/activityMethods.js

import { get } from 'lodash';

// Define the Activity Log collection
const ActivityLogs = globalThis.ActivityLogs = new Mongo.Collection('smartWebMessagingActivityLogs');

// Add indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    await ActivityLogs.createIndexAsync({ messagingHandle: 1 });
    await ActivityLogs.createIndexAsync({ userId: 1 });
    await ActivityLogs.createIndexAsync({ activityType: 1 });
    await ActivityLogs.createIndexAsync({ createdAt: 1 });
  });
}

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). These methods are NOT DDP-session authed — their auth is the SMART
// messaging handle + scope (validateMessagingHandle / checkScope), so
// requireAuth stays false (setting it true would break the SMART Web Messaging
// flow, where an embedded app calls with a handle, not a logged-in session).
// The per-call handle/scope guards are preserved verbatim. Names keep the
// pre-existing dotted `SmartWebMessaging.activity.*` namespace. phi:true — the
// launch parameters/results carry patient-scoped clinical context. `mcContext`
// is the SMART handle context (distinct from the RPC `context`).
Meteor.ServerMethods.define('SmartWebMessaging.activity.log', {
  description: 'Log a SMART Web Messaging activity launch for a messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'activityType', 'parameters', 'result'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      activityType: { type: 'string' },
      parameters: { type: 'object' },
      result: { type: 'object' }
    },
    required: ['messagingHandle', 'activityType', 'result']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const activityType = get(params, 'activityType');
  const parameters = get(params, 'parameters');
  const result = get(params, 'result');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.UI_LAUNCH_ACTIVITY);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/ui.launchActivity');
  }

  // Validate activity type
  if (!Activities.isValid(activityType)) {
    throw new Meteor.Error('invalid-activity', `Invalid activity type: ${activityType}`);
  }

  // Create log entry
  const logEntry = {
    _id: Random.id(),
    messagingHandle: messagingHandle,
    userId: mcContext.userId,
    clientId: mcContext.clientId,
    activityType: activityType,
    parameters: parameters || {},
    result: result,
    status: get(result, 'status', LaunchStatusCodes.SUCCESS),
    createdAt: new Date()
  };

  await ActivityLogs.insertAsync(logEntry);

  console.log(`Logged activity launch: ${activityType} for handle ${messagingHandle}`);

  return logEntry._id;
});

Meteor.ServerMethods.define('SmartWebMessaging.activity.history', {
  description: 'Return activity-launch history for a SMART Web Messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      options: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          activityType: { type: 'string' },
          startDate: {},
          endDate: {}
        }
      }
    },
    required: ['messagingHandle']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const options = get(params, 'options', {}) || {};

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Build query
  const query = {
    userId: mcContext.userId
  };

  if (options.activityType) {
    query.activityType = options.activityType;
  }

  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) {
      query.createdAt.$gte = options.startDate;
    }
    if (options.endDate) {
      query.createdAt.$lte = options.endDate;
    }
  }

  // Find logs
  const logs = await ActivityLogs.find(query, {
    sort: { createdAt: -1 },
    limit: options.limit || 100
  }).fetchAsync();

  return logs.map(log => ({
    id: log._id,
    activityType: log.activityType,
    status: log.status,
    createdAt: log.createdAt,
    parameters: log.parameters,
    result: log.result
  }));
});

Meteor.ServerMethods.define('SmartWebMessaging.activity.stats', {
  description: 'Aggregate activity-launch statistics for a SMART Web Messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle'],
  schemaObject: {
    type: 'object',
    properties: { messagingHandle: { type: 'string' } },
    required: ['messagingHandle']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Aggregate statistics
  const pipeline = [
    { $match: { userId: mcContext.userId } },
      {
        $group: {
          _id: {
            activityType: '$activityType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.activityType',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ];
    
    const stats = await ActivityLogs.rawCollection().aggregate(pipeline).toArray();
    
    // Format results
    const result = {};
    stats.forEach(stat => {
      result[stat._id] = {
        total: stat.total,
        byStatus: {}
      };
      stat.statuses.forEach(s => {
        result[stat._id].byStatus[s.status] = s.count;
      });
    });
    
    return result;
});

Meteor.ServerMethods.define('SmartWebMessaging.activity.validate', {
  description: 'Validate activity parameters/resources against a SMART activity definition',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'activityType', 'parameters'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      activityType: { type: 'string' },
      parameters: { type: 'object' }
    },
    required: ['messagingHandle', 'activityType', 'parameters']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const activityType = get(params, 'activityType');
  const parameters = get(params, 'parameters');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Validate activity type
  if (!Activities.isValid(activityType)) {
    throw new Meteor.Error('invalid-activity', `Invalid activity type: ${activityType}`);
  }

  // Get activity definition
  const definition = Activities.getDefinition(activityType);
  if (!definition) {
    throw new Meteor.Error('invalid-activity', 'Activity definition not found');
  }

  // Validate resources if provided
  const resources = get(parameters, 'resources', []);
  const errors = [];

  resources.forEach((resource, index) => {
    if (!Activities.acceptsResource(activityType, resource)) {
      errors.push({
        index: index,
        error: 'Resource does not match activity requirements',
        resource: resource
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
});
// packages/smart-web-messaging/server/methods/activityMethods.js

import { get } from 'lodash';

// Define the Activity Log collection
ActivityLogs = new Mongo.Collection('smartWebMessagingActivityLogs');

// Add indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    await ActivityLogs.createIndexAsync({ messagingHandle: 1 });
    await ActivityLogs.createIndexAsync({ userId: 1 });
    await ActivityLogs.createIndexAsync({ activityType: 1 });
    await ActivityLogs.createIndexAsync({ createdAt: 1 });
  });
}

// Define methods
Meteor.methods({
  /**
   * Log an activity launch
   */
  'SmartWebMessaging.activity.log': async function(messagingHandle, activityType, parameters, result) {
    check(messagingHandle, String);
    check(activityType, String);
    check(parameters, Match.Optional(Object));
    check(result, Object);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
      userId: context.userId,
      clientId: context.clientId,
      activityType: activityType,
      parameters: parameters || {},
      result: result,
      status: get(result, 'status', LaunchStatusCodes.SUCCESS),
      createdAt: new Date()
    };
    
    await ActivityLogs.insertAsync(logEntry);
    
    console.log(`Logged activity launch: ${activityType} for handle ${messagingHandle}`);
    
    return logEntry._id;
  },
  
  /**
   * Get activity history for a user
   */
  'SmartWebMessaging.activity.history': async function(messagingHandle, options = {}) {
    check(messagingHandle, String);
    check(options, {
      limit: Match.Optional(Number),
      activityType: Match.Optional(String),
      startDate: Match.Optional(Date),
      endDate: Match.Optional(Date)
    });
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
      throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
    }
    
    // Build query
    const query = {
      userId: context.userId
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
  },
  
  /**
   * Get activity statistics
   */
  'SmartWebMessaging.activity.stats': async function(messagingHandle) {
    check(messagingHandle, String);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
      throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
    }
    
    // Aggregate statistics
    const pipeline = [
      { $match: { userId: context.userId } },
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
  },
  
  /**
   * Validate activity parameters
   */
  'SmartWebMessaging.activity.validate': async function(messagingHandle, activityType, parameters) {
    check(messagingHandle, String);
    check(activityType, String);
    check(parameters, Object);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  }
});
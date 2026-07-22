// packages/smart-web-messaging/server/methods/scratchpadMethods.js

import { get } from 'lodash';

// Define the Scratchpad collection
const ScratchpadItems = globalThis.ScratchpadItems = new Mongo.Collection('smartWebMessagingScratchpad');

// Add indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    await ScratchpadItems.createIndexAsync({ messagingHandle: 1 });
    await ScratchpadItems.createIndexAsync({ userId: 1 });
    await ScratchpadItems.createIndexAsync({ createdAt: 1 });
  });
}

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). Auth is the SMART messaging handle + scope (validateMessagingHandle
// / checkScope), NOT the DDP session — requireAuth stays false to preserve the
// SMART Web Messaging flow; the handle/scope guards are kept verbatim. Names
// keep the pre-existing `SmartWebMessaging.scratchpad.*` namespace. phi:true —
// scratchpad items hold patient-scoped FHIR resources. `mcContext` is the SMART
// handle context (distinct from the RPC `context`).
Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.create', {
  description: 'Create a scratchpad item (FHIR resource) for a SMART messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'resource'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      resource: { type: 'object' }
    },
    required: ['messagingHandle', 'resource']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const resource = get(params, 'resource');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_WRITE);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.write');
  }

  // Validate resource has resourceType
  if (!resource.resourceType) {
    throw new Meteor.Error('invalid-resource', 'Resource must have resourceType');
  }

  // Create item
  const itemId = Random.id();
  const item = {
    _id: itemId,
    messagingHandle: messagingHandle,
    userId: mcContext.userId,
    clientId: mcContext.clientId,
    resourceType: resource.resourceType,
    resource: { ...resource, id: itemId },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await ScratchpadItems.insertAsync(item);

  console.log(`Created scratchpad item ${itemId} for handle ${messagingHandle}`);

  return {
    id: itemId,
    resource: item.resource
  };
});

Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.read', {
  description: 'Read a scratchpad item for a SMART messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'itemId'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      itemId: { type: 'string' }
    },
    required: ['messagingHandle', 'itemId']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const itemId = get(params, 'itemId');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_READ);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.read');
  }

  // Find item
  const item = await ScratchpadItems.findOneAsync({
    _id: itemId,
    messagingHandle: messagingHandle
  });

  if (!item) {
    return null;
  }

  return {
    id: item._id,
    resource: item.resource
  };
});

Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.update', {
  description: 'Update a scratchpad item for a SMART messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'itemId', 'resource'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      itemId: { type: 'string' },
      resource: { type: 'object' }
    },
    required: ['messagingHandle', 'itemId', 'resource']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const itemId = get(params, 'itemId');
  const resource = get(params, 'resource');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_WRITE);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.write');
  }

  // Update item
  const result = await ScratchpadItems.updateAsync(
    {
      _id: itemId,
      messagingHandle: messagingHandle
    },
    {
      $set: {
        resource: { ...resource, id: itemId },
        resourceType: resource.resourceType || get(resource, 'resourceType'),
        updatedAt: new Date()
      }
    }
  );

  if (result === 0) {
    throw new Meteor.Error('not-found', 'Scratchpad item not found');
  }

  console.log(`Updated scratchpad item ${itemId} for handle ${messagingHandle}`);

  return {
    id: itemId,
    resource: { ...resource, id: itemId }
  };
});

Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.delete', {
  description: 'Delete a scratchpad item for a SMART messaging handle',
  phi: true,
  requireAuth: false,
  positionalParams: ['messagingHandle', 'itemId'],
  schemaObject: {
    type: 'object',
    properties: {
      messagingHandle: { type: 'string' },
      itemId: { type: 'string' }
    },
    required: ['messagingHandle', 'itemId']
  }
}, async function(params, context){
  const messagingHandle = get(params, 'messagingHandle');
  const itemId = get(params, 'itemId');

  // Validate messaging handle
  const mcContext = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!mcContext) {
    throw new Meteor.Error('unauthorized', 'Invalid messaging handle');
  }

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_WRITE);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.write');
  }

  // Delete item
  const result = await ScratchpadItems.removeAsync({
    _id: itemId,
    messagingHandle: messagingHandle
  });

  console.log(`Deleted scratchpad item ${itemId} for handle ${messagingHandle}`);

  return result > 0;
});

Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.list', {
  description: 'List all scratchpad items for a SMART messaging handle',
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

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_READ);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.read');
  }

  // Find items
  const items = await ScratchpadItems.find({
    messagingHandle: messagingHandle
  }).fetchAsync();

  return items.map(item => ({
    id: item._id,
    resourceType: item.resourceType,
    resource: item.resource,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
});

Meteor.ServerMethods.define('SmartWebMessaging.scratchpad.clear', {
  description: 'Clear all scratchpad items for a SMART messaging handle',
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

  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_WRITE);
  if (!hasScope) {
    throw new Meteor.Error('forbidden', 'Missing required scope: messaging/scratchpad.write');
  }

  // Delete all items
  const result = await ScratchpadItems.removeAsync({
    messagingHandle: messagingHandle
  });

  console.log(`Cleared ${result} scratchpad items for handle ${messagingHandle}`);

  return result;
});
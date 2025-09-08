// packages/smart-web-messaging/server/methods/scratchpadMethods.js

import { get } from 'lodash';

// Define the Scratchpad collection
ScratchpadItems = new Mongo.Collection('smartWebMessagingScratchpad');

// Add indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    await ScratchpadItems.createIndexAsync({ messagingHandle: 1 });
    await ScratchpadItems.createIndexAsync({ userId: 1 });
    await ScratchpadItems.createIndexAsync({ createdAt: 1 });
  });
}

// Define methods
Meteor.methods({
  /**
   * Create a scratchpad item
   */
  'SmartWebMessaging.scratchpad.create': async function(messagingHandle, resource) {
    check(messagingHandle, String);
    check(resource, Object);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
      userId: context.userId,
      clientId: context.clientId,
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
  },
  
  /**
   * Read a scratchpad item
   */
  'SmartWebMessaging.scratchpad.read': async function(messagingHandle, itemId) {
    check(messagingHandle, String);
    check(itemId, String);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  },
  
  /**
   * Update a scratchpad item
   */
  'SmartWebMessaging.scratchpad.update': async function(messagingHandle, itemId, resource) {
    check(messagingHandle, String);
    check(itemId, String);
    check(resource, Object);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  },
  
  /**
   * Delete a scratchpad item
   */
  'SmartWebMessaging.scratchpad.delete': async function(messagingHandle, itemId) {
    check(messagingHandle, String);
    check(itemId, String);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  },
  
  /**
   * List all scratchpad items for a messaging handle
   */
  'SmartWebMessaging.scratchpad.list': async function(messagingHandle) {
    check(messagingHandle, String);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  },
  
  /**
   * Clear all scratchpad items for a messaging handle
   */
  'SmartWebMessaging.scratchpad.clear': async function(messagingHandle) {
    check(messagingHandle, String);
    
    // Validate messaging handle
    const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
    if (!context) {
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
  }
});
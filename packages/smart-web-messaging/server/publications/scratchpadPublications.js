// packages/smart-web-messaging/server/publications/scratchpadPublications.js

/**
 * Publications for SMART Web Messaging scratchpad data
 */

// Publish scratchpad items for a messaging handle
Meteor.publish('smartWebMessaging.scratchpad.items', async function(messagingHandle) {
  check(messagingHandle, String);
  
  // Validate messaging handle
  const context = await SmartMessagingServer.validateMessagingHandle(messagingHandle);
  if (!context) {
    this.ready();
    return;
  }
  
  // Check scope
  const hasScope = await SmartMessagingServer.checkScope(messagingHandle, MessagingScopes.SCOPES.SCRATCHPAD_READ);
  if (!hasScope) {
    this.ready();
    return;
  }
  
  console.log(`Publishing scratchpad items for handle ${messagingHandle}`);
  
  // Return cursor
  return ScratchpadItems.find({
    messagingHandle: messagingHandle
  }, {
    fields: {
      _id: 1,
      resourceType: 1,
      resource: 1,
      createdAt: 1,
      updatedAt: 1
    }
  });
});

// Publish scratchpad items for current user
Meteor.publish('smartWebMessaging.scratchpad.user', function() {
  if (!this.userId) {
    this.ready();
    return;
  }
  
  console.log(`Publishing scratchpad items for user ${this.userId}`);
  
  // Return cursor
  return ScratchpadItems.find({
    userId: this.userId
  }, {
    fields: {
      _id: 1,
      resourceType: 1,
      resource: 1,
      createdAt: 1,
      updatedAt: 1,
      messagingHandle: 1,
      clientId: 1
    }
  });
});

// Publish activity logs for current user
Meteor.publish('smartWebMessaging.activity.logs', function(options = {}) {
  check(options, {
    limit: Match.Optional(Number),
    activityType: Match.Optional(String)
  });
  
  if (!this.userId) {
    this.ready();
    return;
  }
  
  const query = {
    userId: this.userId
  };
  
  if (options.activityType) {
    query.activityType = options.activityType;
  }
  
  console.log(`Publishing activity logs for user ${this.userId}`);
  
  return ActivityLogs.find(query, {
    sort: { createdAt: -1 },
    limit: options.limit || 50,
    fields: {
      _id: 1,
      activityType: 1,
      status: 1,
      createdAt: 1,
      parameters: 1,
      result: 1,
      clientId: 1
    }
  });
});

// Publish messaging contexts for current user
Meteor.publish('smartWebMessaging.contexts', function() {
  if (!this.userId) {
    this.ready();
    return;
  }
  
  console.log(`Publishing messaging contexts for user ${this.userId}`);
  
  return MessagingContexts.find({
    userId: this.userId,
    active: true
  }, {
    fields: {
      _id: 1,
      clientId: 1,
      createdAt: 1,
      expiresAt: 1,
      origin: 1,
      scopes: 1,
      active: 1
    }
  });
});
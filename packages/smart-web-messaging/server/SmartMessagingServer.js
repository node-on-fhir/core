// packages/smart-web-messaging/server/SmartMessagingServer.js

import { get } from 'lodash';

/**
 * Server-side SMART Web Messaging support
 * Handles OAuth integration and server-side operations
 */
SmartMessagingServer = {
  /**
   * Generate messaging context for SMART launch
   * @param {String} userId - User ID
   * @param {String} clientId - OAuth client ID
   * @param {Object} options - Additional options
   * @returns {Object} - Messaging context
   */
  generateMessagingContext: function(userId, clientId, options = {}) {
    check(userId, String);
    check(clientId, String);
    
    // Generate unique messaging handle
    const messagingHandle = OriginChecker.generateMessagingHandle();
    
    // Store in database for validation
    const context = {
      _id: messagingHandle,
      userId: userId,
      clientId: clientId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (options.ttl || 3600000)), // 1 hour default
      origin: options.origin,
      scopes: options.scopes || [],
      active: true
    };
    
    // Store in MessagingContexts collection
    MessagingContexts.insertAsync(context);
    
    return {
      smart_web_messaging_handle: messagingHandle,
      smart_web_messaging_origin: options.origin
    };
  },
  
  /**
   * Validate messaging handle
   * @param {String} messagingHandle - Handle to validate
   * @returns {Object|null} - Context if valid, null otherwise
   */
  validateMessagingHandle: async function(messagingHandle) {
    check(messagingHandle, String);
    
    const context = await MessagingContexts.findOneAsync({
      _id: messagingHandle,
      active: true
    });
    
    if (!context) {
      return null;
    }
    
    // Check expiration
    if (context.expiresAt < new Date()) {
      // Mark as inactive
      await MessagingContexts.updateAsync(
        { _id: messagingHandle },
        { $set: { active: false } }
      );
      return null;
    }
    
    return context;
  },
  
  /**
   * Check if scope is authorized for messaging handle
   * @param {String} messagingHandle - Handle to check
   * @param {String} scope - Required scope
   * @returns {Boolean} - True if authorized
   */
  checkScope: async function(messagingHandle, scope) {
    const context = await this.validateMessagingHandle(messagingHandle);
    if (!context) {
      return false;
    }
    
    // Check if scope is in authorized scopes
    const scopes = get(context, 'scopes', []);
    
    // Check exact match
    if (scopes.includes(scope)) {
      return true;
    }
    
    // Check wildcard scopes (e.g., messaging/* matches messaging/scratchpad.write)
    return scopes.some(authorizedScope => {
      if (authorizedScope.endsWith('/*')) {
        const prefix = authorizedScope.slice(0, -2);
        return scope.startsWith(prefix + '/');
      }
      return false;
    });
  },
  
  /**
   * Invalidate messaging handle
   * @param {String} messagingHandle - Handle to invalidate
   */
  invalidateHandle: async function(messagingHandle) {
    check(messagingHandle, String);
    
    await MessagingContexts.updateAsync(
      { _id: messagingHandle },
      { $set: { active: false } }
    );
  },
  
  /**
   * Get active messaging contexts for user
   * @param {String} userId - User ID
   * @returns {Array} - Active contexts
   */
  getUserContexts: async function(userId) {
    check(userId, String);
    
    return await MessagingContexts.find({
      userId: userId,
      active: true,
      expiresAt: { $gt: new Date() }
    }).fetchAsync();
  },
  
  /**
   * Clean up expired contexts
   */
  cleanupExpiredContexts: async function() {
    const result = await MessagingContexts.removeAsync({
      expiresAt: { $lt: new Date() }
    });
    
    if (result > 0) {
      console.log(`SmartMessagingServer: Cleaned up ${result} expired contexts`);
    }
  },
  
  /**
   * Initialize server
   */
  initialize: function() {
    // Schedule cleanup job
    Meteor.setInterval(() => {
      this.cleanupExpiredContexts();
    }, 3600000); // Every hour
    
    console.log('SmartMessagingServer initialized');
  }
};

// Define the MessagingContexts collection
MessagingContexts = new Mongo.Collection('smartWebMessagingContexts');

// Add indexes
if (Meteor.isServer) {
  Meteor.startup(async function() {
    // Create indexes
    await MessagingContexts.createIndexAsync({ userId: 1, active: 1 });
    await MessagingContexts.createIndexAsync({ clientId: 1, active: 1 });
    await MessagingContexts.createIndexAsync({ expiresAt: 1 });
    
    // Initialize server
    SmartMessagingServer.initialize();
  });
}
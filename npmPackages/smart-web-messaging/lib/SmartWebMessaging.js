// packages/smart-web-messaging/lib/SmartWebMessaging.js

// lodash `get` was a global under Atmosphere; import it explicitly. (This makes
// the file a strict ES module, so the namespace global is published via
// globalThis below — matching the other migrated strict files.)
import { get } from 'lodash';

/**
 * SmartWebMessaging namespace
 * Main export object for the SMART Web Messaging package
 */
const SmartWebMessaging = globalThis.SmartWebMessaging = {
  // Version
  version: '0.0.1',
  
  // Configuration
  config: {
    debug: false,
    allowedOrigins: [],
    defaultTimeout: 30000, // 30 seconds
    maxPayloadSize: 5 * 1024 * 1024, // 5MB
    enableScratchpad: true,
    enableFhirProxy: true
  },
  
  // Initialize configuration from settings
  initialize: function(options = {}) {
    // Load from Meteor settings
    const settingsConfig = get(Meteor, 'settings.public.smartWebMessaging', {});
    
    // Merge with provided options
    this.config = Object.assign({}, this.config, settingsConfig, options);
    
    // Initialize allowed origins
    this.config.allowedOrigins = OriginChecker.getAllowedOrigins();
    
    if (this.config.debug) {
      console.log('SmartWebMessaging: Initialized with config', this.config);
    }
    
    return this;
  },
  
  // Utility methods exposed
  Utils: {
    MessageValidator,
    OriginChecker
  },
  
  // Constants exposed
  Constants: {
    MessageTypes,
    Activities,
    LaunchStatusCodes
  },
  
  // Schema definitions exposed
  Schemas: {
    Message: MessageSchemas,
    Activity: ActivitySchemas
  },
  
  /**
   * Create a message object with proper structure
   * @param {String} messageType - Type of message
   * @param {Object} payload - Message payload
   * @param {String} messagingHandle - Messaging handle
   * @returns {Object} - Formatted message
   */
  createMessage: function(messageType, payload, messagingHandle) {
    const message = {
      messagingHandle: messagingHandle || OriginChecker.generateMessagingHandle(),
      messageId: Random.id(),
      messageType: messageType
    };
    
    if (payload) {
      message.payload = payload;
    }
    
    // Validate before returning
    const validation = MessageValidator.validateMessage(message);
    if (!validation.valid) {
      throw new Error(`Invalid message: ${validation.error}`);
    }
    
    return message;
  },
  
  /**
   * Create a response message
   * @param {String} originalMessageId - ID of message being responded to
   * @param {Object} payload - Response payload
   * @param {Boolean} additionalResponsesExpected - Whether more responses will follow
   * @returns {Object} - Formatted response
   */
  createResponse: function(originalMessageId, payload, additionalResponsesExpected = false) {
    const response = {
      messageId: Random.id(),
      responseToMessageId: originalMessageId
    };
    
    if (payload) {
      response.payload = payload;
    }
    
    if (additionalResponsesExpected) {
      response.additionalResponsesExpected = true;
    }
    
    // Validate before returning
    const validation = MessageValidator.validateResponse(response);
    if (!validation.valid) {
      throw new Error(`Invalid response: ${validation.error}`);
    }
    
    return response;
  },
  
  /**
   * Create an error response
   * @param {String} originalMessageId - ID of message that caused error
   * @param {String} error - Error message
   * @param {String} code - Error code
   * @returns {Object} - Error response
   */
  createErrorResponse: function(originalMessageId, error, code = 'error') {
    return this.createResponse(originalMessageId, {
      error: {
        code: code,
        message: error
      }
    });
  },
  
  /**
   * Log debug message if debug mode is enabled
   * @param {...any} args - Arguments to log
   */
  debug: function(...args) {
    if (this.config.debug) {
      console.log('SmartWebMessaging:', ...args);
    }
  }
};

// Auto-initialize on startup
Meteor.startup(function() {
  SmartWebMessaging.initialize();
});
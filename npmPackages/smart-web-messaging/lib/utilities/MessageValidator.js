// packages/smart-web-messaging/lib/utilities/MessageValidator.js

import { check, Match } from 'meteor/check';
import { get } from 'lodash';

/**
 * Message validation utilities for SMART Web Messaging
 */
const MessageValidator = globalThis.MessageValidator = {
  /**
   * Validate a message structure
   * @param {Object} message - The message to validate
   * @returns {Object} - { valid: Boolean, error: String }
   */
  validateMessage: function(message) {
    try {
      // Basic structure validation
      check(message, {
        messagingHandle: String,
        messageId: String,
        messageType: String,
        payload: Match.Optional(Object)
      });
      
      // Validate message type
      if (!MessageTypes.isValid(message.messageType)) {
        return {
          valid: false,
          error: `Invalid message type: ${message.messageType}`
        };
      }
      
      // Validate payload based on message type
      const payloadValidation = this.validatePayload(message.messageType, message.payload);
      if (!payloadValidation.valid) {
        return payloadValidation;
      }
      
      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },
  
  /**
   * Validate a response message structure
   * @param {Object} response - The response to validate
   * @returns {Object} - { valid: Boolean, error: String }
   */
  validateResponse: function(response) {
    try {
      check(response, {
        messageId: String,
        responseToMessageId: String,
        payload: Match.Optional(Object),
        additionalResponsesExpected: Match.Optional(Boolean)
      });
      
      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },
  
  /**
   * Validate payload based on message type
   * @param {String} messageType - The message type
   * @param {Object} payload - The payload to validate
   * @returns {Object} - { valid: Boolean, error: String }
   */
  validatePayload: function(messageType, payload) {
    const category = MessageTypes.getCategory(messageType);
    const action = MessageTypes.getAction(messageType);
    
    try {
      switch (category) {
        case 'status':
          if (action === 'handshake' && payload) {
            check(payload, {
              smart_web_messaging_handle: String,
              smart_web_messaging_origin: String
            });
          }
          break;
          
        case 'ui':
          if (action === 'launchActivity') {
            check(payload, {
              activityType: String,
              activityParameters: Match.Optional(Object),
              launchContext: Match.Optional(Object)
            });
            
            if (!Activities.isValid(payload.activityType)) {
              return {
                valid: false,
                error: `Invalid activity type: ${payload.activityType}`
              };
            }
          }
          break;
          
        case 'scratchpad':
          if (['create', 'update'].includes(action)) {
            check(payload, {
              resource: Object,
              id: Match.Optional(String)
            });
            
            // Validate FHIR resource has resourceType
            if (!get(payload, 'resource.resourceType')) {
              return {
                valid: false,
                error: 'Scratchpad resource must have resourceType'
              };
            }
          } else if (action === 'read' || action === 'delete') {
            check(payload, {
              id: String
            });
          }
          break;
          
        case 'fhir':
          if (action === 'http') {
            check(payload, {
              method: Match.OneOf('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
              url: String,
              headers: Match.Optional(Object),
              body: Match.Optional(Object)
            });
          }
          break;
      }
      
      return { valid: true };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  },
  
  /**
   * Sanitize message for safe processing
   * @param {Object} message - The message to sanitize
   * @returns {Object} - Sanitized message
   */
  sanitizeMessage: function(message) {
    // Create a clean copy
    const sanitized = {
      messagingHandle: String(get(message, 'messagingHandle', '')).substring(0, 200),
      messageId: String(get(message, 'messageId', '')).substring(0, 200),
      messageType: String(get(message, 'messageType', ''))
    };
    
    // Only include payload if present
    if (message.payload) {
      sanitized.payload = message.payload;
    }
    
    return sanitized;
  }
};
// packages/smart-web-messaging/client/handlers/StatusHandlers.js

import { get } from 'lodash';

/**
 * Handlers for status.* messages
 */
const StatusHandlers = globalThis.StatusHandlers = {
  /**
   * Main handler router
   * @param {Object} message - Message to handle
   * @param {MessageEvent} event - Original event
   */
  handle: function(message, event) {
    const action = MessageTypes.getAction(message.messageType);
    
    switch (action) {
      case 'handshake':
        this.handleHandshake(message, event);
        break;
      case 'ready':
        this.handleReady(message, event);
        break;
      case 'response':
        this.handleResponse(message, event);
        break;
      default:
        console.warn('StatusHandlers: Unknown action', action);
        MessageHandler.sendErrorResponse(
          event.source, 
          event.origin, 
          message.messageId, 
          'Unknown status action'
        );
    }
  },
  
  /**
   * Handle status.handshake message
   * @param {Object} message - Handshake message
   * @param {MessageEvent} event - Original event
   */
  handleHandshake: function(message, event) {
    SmartWebMessaging.debug('Received handshake', message);
    
    // Validate payload
    const handle = get(message, 'payload.smart_web_messaging_handle');
    const origin = get(message, 'payload.smart_web_messaging_origin');
    
    if (!handle || !origin) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing required handshake parameters'
      );
      return;
    }
    
    // Validate origin matches
    if (!OriginChecker.validateAuthorizedOrigin(event.origin, origin)) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Origin mismatch'
      );
      return;
    }
    
    // Store handshake info
    Session.set('parentMessagingHandle', handle);
    Session.set('parentOrigin', origin);
    
    // Send ready response
    MessageHandler.sendResponse(
      event.source,
      event.origin,
      message.messageId,
      {
        status: 'ready',
        version: SmartWebMessaging.version,
        capabilities: {
          scratchpad: SmartWebMessaging.config.enableScratchpad,
          fhirProxy: SmartWebMessaging.config.enableFhirProxy,
          activities: Object.keys(Activities.DEFINITIONS)
        }
      }
    );
  },
  
  /**
   * Handle status.ready message
   * @param {Object} message - Ready message
   * @param {MessageEvent} event - Original event
   */
  handleReady: function(message, event) {
    SmartWebMessaging.debug('Received ready status', message);
    
    // Store capabilities if provided
    const capabilities = get(message, 'payload.capabilities');
    if (capabilities) {
      Session.set('parentCapabilities', capabilities);
    }
    
    // Trigger ready event
    $(document).trigger('smart:messaging:ready', {
      message: message,
      origin: event.origin
    });
  },
  
  /**
   * Handle status.response message
   * @param {Object} message - Status response
   * @param {MessageEvent} event - Original event
   */
  handleResponse: function(message, event) {
    SmartWebMessaging.debug('Received status response', message);
    
    // Generic status response handler
    const status = get(message, 'payload.status');
    const error = get(message, 'payload.error');
    
    if (error) {
      console.error('Status error:', error);
      $(document).trigger('smart:messaging:error', {
        error: error,
        message: message,
        origin: event.origin
      });
    } else if (status) {
      $(document).trigger('smart:messaging:status', {
        status: status,
        message: message,
        origin: event.origin
      });
    }
  }
};
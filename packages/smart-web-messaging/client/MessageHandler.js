// packages/smart-web-messaging/client/MessageHandler.js

import { get } from 'lodash';

/**
 * Main client-side message handler for SMART Web Messaging
 * Manages window.postMessage event handling
 */
MessageHandler = {
  // State
  isListening: false,
  messageHandlers: new Map(),
  pendingRequests: new Map(),
  messagingHandle: null,
  authorizedOrigin: null,
  
  /**
   * Initialize the message handler
   * @param {Object} options - Configuration options
   */
  initialize: function(options = {}) {
    this.messagingHandle = get(options, 'messagingHandle') || OriginChecker.generateMessagingHandle();
    this.authorizedOrigin = get(options, 'origin');
    
    // Get messaging context from SMART launch if available
    if (Session.get('smartWebMessagingHandle')) {
      this.messagingHandle = Session.get('smartWebMessagingHandle');
    }
    if (Session.get('smartWebMessagingOrigin')) {
      this.authorizedOrigin = Session.get('smartWebMessagingOrigin');
    }
    
    SmartWebMessaging.debug('MessageHandler initialized', {
      messagingHandle: this.messagingHandle,
      authorizedOrigin: this.authorizedOrigin
    });
    
    return this;
  },
  
  /**
   * Start listening for messages
   */
  startListening: function() {
    if (this.isListening) {
      console.warn('MessageHandler: Already listening for messages');
      return;
    }
    
    // Bind message handler
    this.boundMessageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.boundMessageHandler);
    this.isListening = true;
    
    SmartWebMessaging.debug('Started listening for messages');
  },
  
  /**
   * Stop listening for messages
   */
  stopListening: function() {
    if (!this.isListening) {
      return;
    }
    
    window.removeEventListener('message', this.boundMessageHandler);
    this.isListening = false;
    this.messageHandlers.clear();
    this.pendingRequests.clear();
    
    SmartWebMessaging.debug('Stopped listening for messages');
  },
  
  /**
   * Main message handler
   * @param {MessageEvent} event - Window message event
   */
  handleMessage: function(event) {
    // Security check: Verify origin if configured
    if (this.authorizedOrigin && !OriginChecker.validateAuthorizedOrigin(event.origin, this.authorizedOrigin)) {
      console.warn('MessageHandler: Rejected message from unauthorized origin', event.origin);
      return;
    }
    
    // Check allowed origins from config
    const allowedOrigins = SmartWebMessaging.config.allowedOrigins;
    if (allowedOrigins.length > 0 && !OriginChecker.isOriginAllowed(event.origin, allowedOrigins)) {
      console.warn('MessageHandler: Origin not in allowed list', event.origin);
      return;
    }
    
    const message = event.data;
    
    // Validate message structure
    const validation = MessageValidator.validateMessage(message);
    if (!validation.valid) {
      SmartWebMessaging.debug('Invalid message received', validation.error, message);
      return;
    }
    
    // Check messaging handle
    if (message.messagingHandle !== this.messagingHandle) {
      SmartWebMessaging.debug('Message for different handle', message.messagingHandle);
      return;
    }
    
    SmartWebMessaging.debug('Received message', message);
    
    // Route to appropriate handler
    this.routeMessage(message, event);
  },
  
  /**
   * Route message to appropriate handler
   * @param {Object} message - Validated message
   * @param {MessageEvent} event - Original event
   */
  routeMessage: function(message, event) {
    const messageType = message.messageType;
    
    // Check for registered handler
    if (this.messageHandlers.has(messageType)) {
      const handler = this.messageHandlers.get(messageType);
      try {
        handler(message, event);
      } catch (error) {
        console.error('MessageHandler: Error in message handler', error);
        this.sendErrorResponse(event.source, event.origin, message.messageId, error.message);
      }
      return;
    }
    
    // Check if this is a response to a pending request
    if (message.responseToMessageId && this.pendingRequests.has(message.responseToMessageId)) {
      const pending = this.pendingRequests.get(message.responseToMessageId);
      pending.resolve(message);
      
      // Clean up if no additional responses expected
      if (!message.additionalResponsesExpected) {
        this.pendingRequests.delete(message.responseToMessageId);
      }
      return;
    }
    
    // Default routing by category
    const category = MessageTypes.getCategory(messageType);
    switch (category) {
      case 'status':
        StatusHandlers.handle(message, event);
        break;
      case 'ui':
        UIHandlers.handle(message, event);
        break;
      case 'scratchpad':
        ScratchpadHandlers.handle(message, event);
        break;
      case 'fhir':
        FhirHandlers.handle(message, event);
        break;
      default:
        console.warn('MessageHandler: No handler for message type', messageType);
        this.sendErrorResponse(event.source, event.origin, message.messageId, 'Unknown message type');
    }
  },
  
  /**
   * Register a custom handler for a message type
   * @param {String} messageType - Message type to handle
   * @param {Function} handler - Handler function
   */
  registerHandler: function(messageType, handler) {
    if (!MessageTypes.isValid(messageType)) {
      throw new Error(`Invalid message type: ${messageType}`);
    }
    
    this.messageHandlers.set(messageType, handler);
    SmartWebMessaging.debug('Registered handler for', messageType);
  },
  
  /**
   * Send a message to the parent window
   * @param {Object} message - Message to send
   * @param {Window} target - Target window (default: parent)
   * @param {String} targetOrigin - Target origin
   * @returns {Promise} - Resolves with response
   */
  sendMessage: function(message, target = window.parent, targetOrigin = '*') {
    return new Promise((resolve, reject) => {
      // Add to pending if expecting response
      const hasResponseHandlers = ['scratchpad.create', 'scratchpad.read', 'fhir.http', 'ui.launchActivity'].includes(message.messageType);
      
      if (hasResponseHandlers) {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(message.messageId);
          reject(new Error('Message timeout'));
        }, SmartWebMessaging.config.defaultTimeout);
        
        this.pendingRequests.set(message.messageId, {
          resolve: (response) => {
            clearTimeout(timeout);
            resolve(response);
          },
          reject,
          timeout
        });
      }
      
      // Send message
      try {
        target.postMessage(message, targetOrigin);
        SmartWebMessaging.debug('Sent message', message);
        
        // Resolve immediately if no response expected
        if (!hasResponseHandlers) {
          resolve();
        }
      } catch (error) {
        if (hasResponseHandlers) {
          this.pendingRequests.delete(message.messageId);
        }
        reject(error);
      }
    });
  },
  
  /**
   * Send a response message
   * @param {Window} target - Target window
   * @param {String} targetOrigin - Target origin
   * @param {String} responseToId - Original message ID
   * @param {Object} payload - Response payload
   * @param {Boolean} additionalResponsesExpected - More responses coming
   */
  sendResponse: function(target, targetOrigin, responseToId, payload, additionalResponsesExpected = false) {
    const response = SmartWebMessaging.createResponse(responseToId, payload, additionalResponsesExpected);
    
    try {
      target.postMessage(response, targetOrigin);
      SmartWebMessaging.debug('Sent response', response);
    } catch (error) {
      console.error('MessageHandler: Failed to send response', error);
    }
  },
  
  /**
   * Send an error response
   * @param {Window} target - Target window
   * @param {String} targetOrigin - Target origin
   * @param {String} responseToId - Original message ID
   * @param {String} error - Error message
   */
  sendErrorResponse: function(target, targetOrigin, responseToId, error) {
    const response = SmartWebMessaging.createErrorResponse(responseToId, error);
    this.sendResponse(target, targetOrigin, responseToId, response.payload);
  }
};
// packages/smart-web-messaging/client/services/MessageDispatcher.js

import { get } from 'lodash';

/**
 * Message dispatching and queuing service
 * Handles message routing, retries, and batching
 */
MessageDispatcher = {
  // Message queue for batching
  messageQueue: [],
  batchTimer: null,
  
  // Configuration
  config: {
    batchDelay: 10, // ms to wait before sending batch
    maxBatchSize: 10,
    maxRetries: 3,
    retryDelay: 1000 // ms
  },
  
  /**
   * Initialize the dispatcher
   * @param {Object} options - Configuration options
   */
  initialize: function(options = {}) {
    Object.assign(this.config, options);
    this.messageQueue = [];
    
    SmartWebMessaging.debug('MessageDispatcher initialized');
  },
  
  /**
   * Queue a message for sending
   * @param {Object} message - Message to send
   * @param {Object} options - Send options
   * @returns {Promise} - Resolves when message is sent
   */
  queueMessage: function(message, options = {}) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        message,
        options,
        resolve,
        reject,
        retries: 0
      };
      
      this.messageQueue.push(queueItem);
      
      // Start batch timer if not running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.batchDelay);
      }
      
      // Process immediately if batch is full
      if (this.messageQueue.length >= this.config.maxBatchSize) {
        clearTimeout(this.batchTimer);
        this.processBatch();
      }
    });
  },
  
  /**
   * Process queued messages
   */
  processBatch: function() {
    this.batchTimer = null;
    
    if (this.messageQueue.length === 0) {
      return;
    }
    
    // Take messages from queue
    const batch = this.messageQueue.splice(0, this.config.maxBatchSize);
    
    SmartWebMessaging.debug(`Processing batch of ${batch.length} messages`);
    
    // Process each message
    batch.forEach(item => {
      this.sendMessage(item);
    });
  },
  
  /**
   * Send a single message
   * @param {Object} queueItem - Queue item with message and metadata
   */
  sendMessage: function(queueItem) {
    const { message, options, resolve, reject, retries } = queueItem;
    
    MessageHandler.sendMessage(
      message,
      options.target || window.parent,
      options.targetOrigin || '*'
    )
    .then(response => {
      resolve(response);
    })
    .catch(error => {
      // Check if we should retry
      if (retries < this.config.maxRetries) {
        SmartWebMessaging.debug(`Retrying message (attempt ${retries + 1})`, message.messageType);
        
        // Schedule retry
        setTimeout(() => {
          queueItem.retries++;
          this.sendMessage(queueItem);
        }, this.config.retryDelay * (retries + 1));
      } else {
        // Max retries exceeded
        reject(new Error(`Message failed after ${this.config.maxRetries} retries: ${error.message}`));
      }
    });
  },
  
  /**
   * Send high priority message immediately
   * @param {Object} message - Message to send
   * @param {Object} options - Send options
   * @returns {Promise} - Resolves when sent
   */
  sendImmediate: function(message, options = {}) {
    return MessageHandler.sendMessage(
      message,
      options.target || window.parent,
      options.targetOrigin || '*'
    );
  },
  
  /**
   * Create and dispatch an event message
   * @param {String} eventType - Event type
   * @param {Object} eventData - Event data
   */
  dispatchEvent: function(eventType, eventData) {
    // Create custom message type for events
    const message = SmartWebMessaging.createMessage(
      `event.${eventType}`,
      eventData,
      MessageHandler.messagingHandle
    );
    
    // Send without expecting response
    this.sendImmediate(message).catch(error => {
      console.warn('Failed to dispatch event:', eventType, error);
    });
  },
  
  /**
   * Subscribe to response patterns
   * @param {String} pattern - Message type pattern (can include wildcards)
   * @param {Function} handler - Handler function
   * @returns {Function} - Unsubscribe function
   */
  subscribe: function(pattern, handler) {
    // Convert pattern to regex
    const regex = this.patternToRegex(pattern);
    
    // Create wrapper handler
    const wrappedHandler = (message, event) => {
      if (regex.test(message.messageType)) {
        handler(message, event);
      }
    };
    
    // Register with MessageHandler
    MessageHandler.registerHandler(pattern, wrappedHandler);
    
    // Return unsubscribe function
    return () => {
      MessageHandler.messageHandlers.delete(pattern);
    };
  },
  
  /**
   * Convert pattern with wildcards to regex
   * @param {String} pattern - Pattern string (e.g., "status.*")
   * @returns {RegExp} - Regular expression
   */
  patternToRegex: function(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp('^' + regex + '$');
  },
  
  /**
   * Clear message queue
   */
  clearQueue: function() {
    // Reject all pending messages
    this.messageQueue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    
    this.messageQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  },
  
  /**
   * Get queue statistics
   * @returns {Object} - Queue stats
   */
  getQueueStats: function() {
    return {
      queueLength: this.messageQueue.length,
      batchPending: !!this.batchTimer,
      config: this.config
    };
  }
};
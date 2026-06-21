// packages/smart-web-messaging/client/SmartMessagingClient.js

import { get } from 'lodash';

/**
 * High-level client API for SMART Web Messaging
 * Provides a simple interface for common messaging operations
 */
const SmartMessagingClient = globalThis.SmartMessagingClient = {
  // State
  initialized: false,
  ready: false,
  
  /**
   * Initialize the SMART Messaging client
   * @param {Object} options - Configuration options
   * @returns {Promise} - Resolves when handshake is complete
   */
  async initialize(options = {}) {
    if (this.initialized) {
      console.warn('SmartMessagingClient: Already initialized');
      return;
    }
    
    // Initialize the message handler
    MessageHandler.initialize(options);
    MessageHandler.startListening();
    
    // Initialize services
    ScratchpadService.initialize();
    ActivityLauncher.initialize();
    
    this.initialized = true;
    
    // Perform handshake if in iframe
    if (window.parent !== window) {
      try {
        await this.performHandshake();
        this.ready = true;
      } catch (error) {
        console.error('SmartMessagingClient: Handshake failed', error);
        throw error;
      }
    } else {
      this.ready = true;
    }
    
    SmartWebMessaging.debug('Client initialized and ready');
  },
  
  /**
   * Perform status handshake with parent
   * @returns {Promise} - Resolves when handshake complete
   */
  async performHandshake() {
    const message = SmartWebMessaging.createMessage(
      MessageTypes.STATUS.HANDSHAKE,
      {
        smart_web_messaging_handle: MessageHandler.messagingHandle,
        smart_web_messaging_origin: window.location.origin
      },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    if (get(response, 'payload.status') !== 'ready') {
      throw new Error('Handshake failed: Parent not ready');
    }
    
    SmartWebMessaging.debug('Handshake complete');
    return response;
  },
  
  /**
   * Signal that the app is done
   * @param {Object} result - Result data to send
   * @returns {Promise}
   */
  async done(result = {}) {
    this.ensureReady();
    
    const message = SmartWebMessaging.createMessage(
      MessageTypes.UI.DONE,
      result,
      MessageHandler.messagingHandle
    );
    
    return MessageHandler.sendMessage(message);
  },
  
  /**
   * Launch an activity
   * @param {String} activityType - Type of activity to launch
   * @param {Object} parameters - Activity parameters
   * @param {Object} context - Launch context
   * @returns {Promise} - Resolves with launch result
   */
  async launchActivity(activityType, parameters = {}, context = {}) {
    this.ensureReady();
    
    // Validate activity type
    if (!Activities.isValid(activityType)) {
      throw new Error(`Invalid activity type: ${activityType}`);
    }
    
    return ActivityLauncher.launch(activityType, parameters, context);
  },
  
  /**
   * Scratchpad operations
   */
  scratchpad: {
    /**
     * Create a scratchpad resource
     * @param {Object} resource - FHIR resource to create
     * @returns {Promise<Object>} - Created resource with ID
     */
    async create(resource) {
      SmartMessagingClient.ensureReady();
      return ScratchpadService.create(resource);
    },
    
    /**
     * Read a scratchpad resource
     * @param {String} id - Resource ID
     * @returns {Promise<Object>} - Resource data
     */
    async read(id) {
      SmartMessagingClient.ensureReady();
      return ScratchpadService.read(id);
    },
    
    /**
     * Update a scratchpad resource
     * @param {String} id - Resource ID
     * @param {Object} resource - Updated resource
     * @returns {Promise<Object>} - Updated resource
     */
    async update(id, resource) {
      SmartMessagingClient.ensureReady();
      return ScratchpadService.update(id, resource);
    },
    
    /**
     * Delete a scratchpad resource
     * @param {String} id - Resource ID
     * @returns {Promise}
     */
    async delete(id) {
      SmartMessagingClient.ensureReady();
      return ScratchpadService.delete(id);
    },
    
    /**
     * List all scratchpad resources
     * @returns {Promise<Array>} - Array of resources
     */
    async list() {
      SmartMessagingClient.ensureReady();
      return ScratchpadService.list();
    }
  },
  
  /**
   * FHIR proxy operations
   */
  fhir: {
    /**
     * Make a FHIR HTTP request through messaging
     * @param {String} method - HTTP method
     * @param {String} url - FHIR endpoint URL
     * @param {Object} options - Request options
     * @returns {Promise<Object>} - FHIR response
     */
    async request(method, url, options = {}) {
      SmartMessagingClient.ensureReady();
      
      const message = SmartWebMessaging.createMessage(
        MessageTypes.FHIR.HTTP,
        {
          method: method.toUpperCase(),
          url: url,
          headers: get(options, 'headers', {}),
          body: get(options, 'body')
        },
        MessageHandler.messagingHandle
      );
      
      const response = await MessageHandler.sendMessage(message);
      
      // Check for errors
      if (get(response, 'payload.error')) {
        throw new Error(get(response, 'payload.error.message', 'FHIR request failed'));
      }
      
      return get(response, 'payload.response', {});
    },
    
    // Convenience methods
    async get(url, options = {}) {
      return this.request('GET', url, options);
    },
    
    async post(url, body, options = {}) {
      return this.request('POST', url, { ...options, body });
    },
    
    async put(url, body, options = {}) {
      return this.request('PUT', url, { ...options, body });
    },
    
    async delete(url, options = {}) {
      return this.request('DELETE', url, options);
    }
  },
  
  /**
   * Register a custom message handler
   * @param {String} messageType - Message type to handle
   * @param {Function} handler - Handler function
   */
  onMessage(messageType, handler) {
    this.ensureReady();
    MessageHandler.registerHandler(messageType, handler);
  },
  
  /**
   * Ensure client is ready
   * @throws {Error} - If not ready
   */
  ensureReady() {
    if (!this.ready) {
      throw new Error('SmartMessagingClient not ready. Call initialize() first.');
    }
  },
  
  /**
   * Cleanup and shutdown
   */
  shutdown() {
    MessageHandler.stopListening();
    this.initialized = false;
    this.ready = false;
    SmartWebMessaging.debug('Client shutdown');
  }
};
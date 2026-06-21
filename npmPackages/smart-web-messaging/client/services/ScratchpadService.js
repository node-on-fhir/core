// packages/smart-web-messaging/client/services/ScratchpadService.js

import { get, set } from 'lodash';
import { ReactiveVar } from 'meteor/reactive-var';

/**
 * Client-side service for managing scratchpad resources
 * Provides both local storage and message-based operations
 */
const ScratchpadService = globalThis.ScratchpadService = {
  // Local storage for scratchpad items
  items: new ReactiveVar(new Map()),
  
  /**
   * Initialize the service
   */
  initialize: function() {
    // Clear any previous items
    this.items.set(new Map());
    
    SmartWebMessaging.debug('ScratchpadService initialized');
  },
  
  /**
   * Create a scratchpad resource (via messaging)
   * @param {Object} resource - FHIR resource to create
   * @returns {Promise<Object>} - Created resource with ID
   */
  async create(resource) {
    if (!resource || !resource.resourceType) {
      throw new Error('Resource must have resourceType');
    }
    
    const message = SmartWebMessaging.createMessage(
      MessageTypes.SCRATCHPAD.CREATE,
      { resource },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    if (get(response, 'payload.error')) {
      throw new Error(get(response, 'payload.error.message', 'Create failed'));
    }
    
    return {
      id: get(response, 'payload.id'),
      resource: get(response, 'payload.resource')
    };
  },
  
  /**
   * Read a scratchpad resource (via messaging)
   * @param {String} id - Resource ID
   * @returns {Promise<Object>} - Resource data
   */
  async read(id) {
    if (!id) {
      throw new Error('Resource ID is required');
    }
    
    const message = SmartWebMessaging.createMessage(
      MessageTypes.SCRATCHPAD.READ,
      { id },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    if (get(response, 'payload.error')) {
      throw new Error(get(response, 'payload.error.message', 'Read failed'));
    }
    
    if (!get(response, 'payload.found')) {
      return null;
    }
    
    return get(response, 'payload.resource');
  },
  
  /**
   * Update a scratchpad resource (via messaging)
   * @param {String} id - Resource ID
   * @param {Object} resource - Updated resource
   * @returns {Promise<Object>} - Updated resource
   */
  async update(id, resource) {
    if (!id || !resource) {
      throw new Error('Resource ID and resource are required');
    }
    
    const message = SmartWebMessaging.createMessage(
      MessageTypes.SCRATCHPAD.UPDATE,
      { id, resource },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    if (get(response, 'payload.error')) {
      throw new Error(get(response, 'payload.error.message', 'Update failed'));
    }
    
    return get(response, 'payload.resource');
  },
  
  /**
   * Delete a scratchpad resource (via messaging)
   * @param {String} id - Resource ID
   * @returns {Promise<Boolean>} - Success status
   */
  async delete(id) {
    if (!id) {
      throw new Error('Resource ID is required');
    }
    
    const message = SmartWebMessaging.createMessage(
      MessageTypes.SCRATCHPAD.DELETE,
      { id },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    if (get(response, 'payload.error')) {
      throw new Error(get(response, 'payload.error.message', 'Delete failed'));
    }
    
    return get(response, 'payload.deleted', false);
  },
  
  /**
   * List all scratchpad resources (local only)
   * @returns {Promise<Array>} - Array of resources
   */
  async list() {
    const items = Array.from(this.items.get().values());
    return items.map(item => ({
      id: item.id,
      resource: item.resource,
      resourceType: item.resourceType
    }));
  },
  
  // Local operations (for handling messages from parent)
  
  /**
   * Create resource locally
   * @param {Object} resource - Resource to create
   * @param {String} messagingHandle - Associated messaging handle
   * @returns {Promise<Object>} - Created item
   */
  createLocal: async function(resource, messagingHandle) {
    const id = Random.id();
    const item = {
      id,
      resource: { ...resource, id },
      resourceType: resource.resourceType,
      createdAt: new Date(),
      updatedAt: new Date(),
      messagingHandle
    };
    
    const currentItems = this.items.get();
    currentItems.set(id, item);
    this.items.set(new Map(currentItems));
    
    SmartWebMessaging.debug('Created local scratchpad item', id);
    
    return item;
  },
  
  /**
   * Read resource locally
   * @param {String} id - Resource ID
   * @param {String} messagingHandle - Associated messaging handle
   * @returns {Promise<Object>} - Item or null
   */
  readLocal: async function(id, messagingHandle) {
    const item = this.items.get().get(id);
    
    if (!item) {
      return null;
    }
    
    // Check messaging handle matches
    if (item.messagingHandle !== messagingHandle) {
      throw new Error('Access denied: messaging handle mismatch');
    }
    
    return item;
  },
  
  /**
   * Update resource locally
   * @param {String} id - Resource ID
   * @param {Object} resource - Updated resource
   * @param {String} messagingHandle - Associated messaging handle
   * @returns {Promise<Object>} - Updated item
   */
  updateLocal: async function(id, resource, messagingHandle) {
    const item = this.items.get().get(id);
    
    if (!item) {
      throw new Error('Resource not found');
    }
    
    // Check messaging handle matches
    if (item.messagingHandle !== messagingHandle) {
      throw new Error('Access denied: messaging handle mismatch');
    }
    
    // Update item
    item.resource = { ...resource, id };
    item.updatedAt = new Date();
    
    const currentItems = this.items.get();
    currentItems.set(id, item);
    this.items.set(new Map(currentItems));
    
    SmartWebMessaging.debug('Updated local scratchpad item', id);
    
    return item;
  },
  
  /**
   * Delete resource locally
   * @param {String} id - Resource ID
   * @param {String} messagingHandle - Associated messaging handle
   * @returns {Promise<Boolean>} - Success status
   */
  deleteLocal: async function(id, messagingHandle) {
    const item = this.items.get().get(id);
    
    if (!item) {
      return false;
    }
    
    // Check messaging handle matches
    if (item.messagingHandle !== messagingHandle) {
      throw new Error('Access denied: messaging handle mismatch');
    }
    
    const currentItems = this.items.get();
    const deleted = currentItems.delete(id);
    this.items.set(new Map(currentItems));
    
    SmartWebMessaging.debug('Deleted local scratchpad item', id);
    
    return deleted;
  },
  
  /**
   * Clear all items for a messaging handle
   * @param {String} messagingHandle - Messaging handle
   */
  clearForHandle: function(messagingHandle) {
    const currentItems = this.items.get();
    const toDelete = [];
    
    currentItems.forEach((item, id) => {
      if (item.messagingHandle === messagingHandle) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => currentItems.delete(id));
    this.items.set(new Map(currentItems));
    
    SmartWebMessaging.debug(`Cleared ${toDelete.length} items for handle`, messagingHandle);
  }
};
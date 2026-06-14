// packages/smart-web-messaging/client/handlers/ScratchpadHandlers.js

import { get } from 'lodash';

/**
 * Handlers for scratchpad.* messages
 * Handle requests from parent to manipulate scratchpad resources
 */
const ScratchpadHandlers = globalThis.ScratchpadHandlers = {
  /**
   * Main handler router
   * @param {Object} message - Message to handle
   * @param {MessageEvent} event - Original event
   */
  handle: function(message, event) {
    if (!SmartWebMessaging.config.enableScratchpad) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Scratchpad functionality is disabled'
      );
      return;
    }
    
    const action = MessageTypes.getAction(message.messageType);
    
    switch (action) {
      case 'create':
        this.handleCreate(message, event);
        break;
      case 'read':
        this.handleRead(message, event);
        break;
      case 'update':
        this.handleUpdate(message, event);
        break;
      case 'delete':
        this.handleDelete(message, event);
        break;
      default:
        console.warn('ScratchpadHandlers: Unknown action', action);
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          'Unknown scratchpad action'
        );
    }
  },
  
  /**
   * Handle scratchpad.create message
   * @param {Object} message - Create message
   * @param {MessageEvent} event - Original event
   */
  handleCreate: function(message, event) {
    const resource = get(message, 'payload.resource');
    
    if (!resource) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing resource in payload'
      );
      return;
    }
    
    // Use ScratchpadService to create
    ScratchpadService.createLocal(resource, message.messagingHandle)
      .then(created => {
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            id: created.id,
            resource: created.resource,
            created: true
          }
        );
      })
      .catch(error => {
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          error.message
        );
      });
  },
  
  /**
   * Handle scratchpad.read message
   * @param {Object} message - Read message
   * @param {MessageEvent} event - Original event
   */
  handleRead: function(message, event) {
    const id = get(message, 'payload.id');
    
    if (!id) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing id in payload'
      );
      return;
    }
    
    // Use ScratchpadService to read
    ScratchpadService.readLocal(id, message.messagingHandle)
      .then(item => {
        if (!item) {
          MessageHandler.sendResponse(
            event.source,
            event.origin,
            message.messageId,
            {
              id: id,
              found: false
            }
          );
          return;
        }
        
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            id: item.id,
            resource: item.resource,
            found: true
          }
        );
      })
      .catch(error => {
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          error.message
        );
      });
  },
  
  /**
   * Handle scratchpad.update message
   * @param {Object} message - Update message
   * @param {MessageEvent} event - Original event
   */
  handleUpdate: function(message, event) {
    const id = get(message, 'payload.id');
    const resource = get(message, 'payload.resource');
    
    if (!id || !resource) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing id or resource in payload'
      );
      return;
    }
    
    // Use ScratchpadService to update
    ScratchpadService.updateLocal(id, resource, message.messagingHandle)
      .then(updated => {
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            id: updated.id,
            resource: updated.resource,
            updated: true
          }
        );
      })
      .catch(error => {
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          error.message
        );
      });
  },
  
  /**
   * Handle scratchpad.delete message
   * @param {Object} message - Delete message
   * @param {MessageEvent} event - Original event
   */
  handleDelete: function(message, event) {
    const id = get(message, 'payload.id');
    
    if (!id) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing id in payload'
      );
      return;
    }
    
    // Use ScratchpadService to delete
    ScratchpadService.deleteLocal(id, message.messagingHandle)
      .then(success => {
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            id: id,
            deleted: success
          }
        );
      })
      .catch(error => {
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          error.message
        );
      });
  }
};
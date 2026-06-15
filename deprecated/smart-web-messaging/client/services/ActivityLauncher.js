// packages/smart-web-messaging/client/services/ActivityLauncher.js

import { get } from 'lodash';

/**
 * Service for launching and handling activities
 */
ActivityLauncher = {
  // Activity handlers registry
  handlers: new Map(),
  
  /**
   * Initialize the service
   */
  initialize: function() {
    // Register default activity handlers
    this.registerDefaultHandlers();
    
    SmartWebMessaging.debug('ActivityLauncher initialized');
  },
  
  /**
   * Launch an activity (send message to parent)
   * @param {String} activityType - Activity to launch
   * @param {Object} parameters - Activity parameters
   * @param {Object} context - Launch context
   * @returns {Promise<Object>} - Launch result
   */
  async launch(activityType, parameters = {}, context = {}) {
    const message = SmartWebMessaging.createMessage(
      MessageTypes.UI.LAUNCH_ACTIVITY,
      {
        activityType,
        activityParameters: parameters,
        launchContext: context
      },
      MessageHandler.messagingHandle
    );
    
    const response = await MessageHandler.sendMessage(message);
    
    const status = get(response, 'payload.status');
    if (status === LaunchStatusCodes.ERROR) {
      const error = get(response, 'payload.error.message', 'Activity launch failed');
      throw new Error(error);
    }
    
    return get(response, 'payload.result', {});
  },
  
  /**
   * Handle an activity request (from parent)
   * @param {String} activityType - Activity to handle
   * @param {Object} parameters - Activity parameters
   * @param {Object} context - Launch context
   * @returns {Promise<Object>} - Activity result
   */
  async handleActivityRequest(activityType, parameters, context) {
    SmartWebMessaging.debug('Handling activity request', { activityType, parameters, context });
    
    // Check if we have a handler for this activity
    if (!this.handlers.has(activityType)) {
      throw new Error(`No handler registered for activity: ${activityType}`);
    }
    
    const handler = this.handlers.get(activityType);
    
    try {
      // Call the handler
      const result = await handler(parameters, context);
      
      // Validate result against activity definition
      const definition = Activities.getDefinition(activityType);
      if (definition && definition.returnsContext) {
        this.validateActivityResult(result, definition.returnsContext);
      }
      
      return result;
      
    } catch (error) {
      console.error('Activity handler error:', error);
      throw error;
    }
  },
  
  /**
   * Register an activity handler
   * @param {String} activityType - Activity type
   * @param {Function} handler - Handler function
   */
  registerHandler: function(activityType, handler) {
    if (!Activities.isValid(activityType)) {
      throw new Error(`Invalid activity type: ${activityType}`);
    }
    
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    this.handlers.set(activityType, handler);
    SmartWebMessaging.debug('Registered activity handler', activityType);
  },
  
  /**
   * Register default handlers for standard activities
   */
  registerDefaultHandlers: function() {
    // Appointment Book handler
    this.registerHandler(Activities.APPOINTMENT_BOOK, async (parameters, context) => {
      // Trigger UI event for appointment booking
      return new Promise((resolve, reject) => {
        $(document).trigger('smart:activity:appointment-book', {
          parameters,
          context,
          callback: (result) => {
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          }
        });
        
        // Set timeout
        setTimeout(() => {
          reject(new Error('Activity timeout'));
        }, SmartWebMessaging.config.defaultTimeout);
      });
    });
    
    // Order Review handler
    this.registerHandler(Activities.ORDER_REVIEW, async (parameters, context) => {
      // Trigger UI event for order review
      return new Promise((resolve, reject) => {
        $(document).trigger('smart:activity:order-review', {
          parameters,
          context,
          callback: (result) => {
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          }
        });
        
        // Set timeout
        setTimeout(() => {
          reject(new Error('Activity timeout'));
        }, SmartWebMessaging.config.defaultTimeout);
      });
    });
    
    // Problem Review handler
    this.registerHandler(Activities.PROBLEM_REVIEW, async (parameters, context) => {
      // Trigger UI event for problem review
      return new Promise((resolve, reject) => {
        $(document).trigger('smart:activity:problem-review', {
          parameters,
          context,
          callback: (result) => {
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          }
        });
        
        // Set timeout
        setTimeout(() => {
          reject(new Error('Activity timeout'));
        }, SmartWebMessaging.config.defaultTimeout);
      });
    });
  },
  
  /**
   * Validate activity result against expected format
   * @param {Object} result - Activity result
   * @param {Object} expectedFormat - Expected format from definition
   */
  validateActivityResult: function(result, expectedFormat) {
    const resourceType = get(expectedFormat, 'resourceType', []);
    
    if (resourceType.length > 0 && result.resource) {
      const actualType = get(result, 'resource.resourceType');
      if (!resourceType.includes(actualType)) {
        throw new Error(`Invalid resource type returned: ${actualType}`);
      }
    }
    
    // Additional validation can be added here
  },
  
  /**
   * Show activity UI (for embedded activities)
   * @param {String} activityType - Activity type
   * @param {Object} parameters - Activity parameters
   * @param {Object} context - Launch context
   * @returns {Promise<Object>} - Activity result
   */
  async showActivityUI(activityType, parameters, context) {
    // This would typically show a modal or navigate to an activity page
    // For now, we'll trigger an event for the app to handle
    return new Promise((resolve, reject) => {
      $(document).trigger('smart:activity:show', {
        activityType,
        parameters,
        context,
        onComplete: (result) => resolve(result),
        onCancel: () => reject(new Error('Activity cancelled'))
      });
    });
  }
};
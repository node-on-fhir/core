// packages/smart-web-messaging/client/handlers/UIHandlers.js

import { get } from 'lodash';

/**
 * Handlers for ui.* messages
 */
UIHandlers = {
  /**
   * Main handler router
   * @param {Object} message - Message to handle
   * @param {MessageEvent} event - Original event
   */
  handle: function(message, event) {
    const action = MessageTypes.getAction(message.messageType);
    
    switch (action) {
      case 'done':
        this.handleDone(message, event);
        break;
      case 'launchActivity':
        this.handleLaunchActivity(message, event);
        break;
      default:
        console.warn('UIHandlers: Unknown action', action);
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          'Unknown UI action'
        );
    }
  },
  
  /**
   * Handle ui.done message
   * @param {Object} message - Done message
   * @param {MessageEvent} event - Original event
   */
  handleDone: function(message, event) {
    SmartWebMessaging.debug('Received ui.done', message);
    
    const payload = get(message, 'payload', {});
    
    // Trigger done event for app to handle
    $(document).trigger('smart:messaging:done', {
      payload: payload,
      message: message,
      origin: event.origin
    });
    
    // If running in iframe and has navigation hint
    const navigationHint = get(payload, 'navigationHint');
    if (navigationHint) {
      this.processNavigationHint(navigationHint);
    }
    
    // Send acknowledgment
    MessageHandler.sendResponse(
      event.source,
      event.origin,
      message.messageId,
      {
        status: 'acknowledged'
      }
    );
  },
  
  /**
   * Handle ui.launchActivity message
   * @param {Object} message - Launch activity message
   * @param {MessageEvent} event - Original event
   */
  handleLaunchActivity: function(message, event) {
    SmartWebMessaging.debug('Received ui.launchActivity', message);
    
    const activityType = get(message, 'payload.activityType');
    const parameters = get(message, 'payload.activityParameters', {});
    const context = get(message, 'payload.launchContext', {});
    
    // Validate activity type
    if (!activityType) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing activityType'
      );
      return;
    }
    
    if (!Activities.isValid(activityType)) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        `Invalid activity type: ${activityType}`
      );
      return;
    }
    
    // Launch the activity
    ActivityLauncher.handleActivityRequest(activityType, parameters, context)
      .then(result => {
        // Send success response
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            status: LaunchStatusCodes.SUCCESS,
            activityType: activityType,
            result: result
          }
        );
      })
      .catch(error => {
        console.error('Activity launch failed:', error);
        // Send error response
        MessageHandler.sendResponse(
          event.source,
          event.origin,
          message.messageId,
          {
            status: LaunchStatusCodes.ERROR,
            activityType: activityType,
            error: {
              message: error.message || 'Activity launch failed'
            }
          }
        );
      });
  },
  
  /**
   * Process navigation hint
   * @param {Object} hint - Navigation hint object
   */
  processNavigationHint: function(hint) {
    const type = get(hint, 'type', 'none');
    const target = get(hint, 'target');
    const url = get(hint, 'url');
    
    SmartWebMessaging.debug('Processing navigation hint', hint);
    
    // Validate URL before any navigation
    if (url && !UrlValidator.isSafeUrl(url)) {
      console.error('UIHandlers: Blocked navigation to unsafe URL:', url);
      // Trigger security event
      $(document).trigger('smart:messaging:security:blocked', {
        type: 'unsafe_url',
        url: url,
        navigationHint: hint
      });
      return;
    }
    
    switch (type) {
      case 'none':
        // No navigation
        break;
        
      case 'replace':
        // Replace current window location
        if (url && UrlValidator.isSafeUrl(url)) {
          window.location.replace(url);
        }
        break;
        
      case 'tab':
        // Open in new tab
        if (url && UrlValidator.isSafeUrl(url)) {
          // Additional validation for _blank target to prevent window.opener attacks
          const safeTarget = target || '_blank';
          const newWindow = window.open(url, safeTarget);
          if (newWindow && safeTarget === '_blank') {
            // Prevent window.opener attacks
            newWindow.opener = null;
          }
        }
        break;
        
      case 'history':
        // Use history API - only allow same-origin URLs for history manipulation
        if (url && UrlValidator.isSameOrigin(url) && window.history && window.history.pushState) {
          window.history.pushState(null, '', url);
          // Trigger route change event
          $(window).trigger('popstate');
        } else if (url && !UrlValidator.isSameOrigin(url)) {
          console.warn('UIHandlers: History API navigation blocked for cross-origin URL:', url);
        }
        break;
        
      default:
        console.warn('UIHandlers: Unknown navigation type', type);
    }
  }
};
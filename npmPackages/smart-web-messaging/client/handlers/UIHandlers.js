// packages/smart-web-messaging/client/handlers/UIHandlers.js

/**
 * Security Notice:
 * This module handles navigation requests from SMART Web Messaging.
 * All URLs are validated and sanitized before navigation to prevent XSS attacks.
 * 
 * Security measures:
 * 1. URL validation - only allows safe protocols (http/https)
 * 2. Same-origin enforcement for sensitive operations
 * 3. Domain whitelisting for cross-origin navigation
 * 4. URL sanitization to remove injection attempts
 * 5. Centralized navigation through safeNavigate() function
 * 6. Security event triggering for monitoring blocked attempts
 * 
 * Configuration:
 * Trusted domains can be configured in settings:
 * settings.public.smartMessaging.trustedDomains = ['example.com', '*.trusted.org']
 */

import { get } from 'lodash';


/**
 * Validates that a given URL is safe to be used for navigation.
 * Only allows http/https protocols and same-origin URLs.
 * @param {string} url
 * @returns {boolean}
 */
function isSafeUrl(url) {
  if (typeof url !== 'string' || !url) return false;
  
  // Allow relative paths (must start with single slash)
  if (/^\/(?!\/)/.test(url) && !/[\s"'><`]/.test(url)) {
    return true;
  }
  
  // Allow same-origin absolute URLs
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // For same-origin navigation, allow it
    if (parsed.origin === window.location.origin) {
      return true;
    }
    // For cross-origin, only allow if explicitly whitelisted
    return isWhitelistedDomain(parsed.hostname);
  } catch (e) {
    return false;
  }
}

/**
 * Check if a domain is whitelisted for navigation
 * @param {string} hostname
 * @returns {boolean}
 */
function isWhitelistedDomain(hostname) {
  // Get whitelist from settings or use defaults
  const whitelist = get(Meteor, 'settings.public.smartMessaging.trustedDomains', []);
  
  // Add common trusted healthcare domains if needed
  const defaultTrusted = [
    // Add specific trusted domains here if needed
    // 'smarthealth.cards',
    // 'hl7.org'
  ];
  
  const allTrusted = [...whitelist, ...defaultTrusted];
  return allTrusted.some(domain => {
    // Support wildcard subdomains (*.example.com)
    if (domain.startsWith('*.')) {
      const baseDomain = domain.slice(2);
      return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
    }
    return hostname === domain;
  });
}

/**
 * Safe navigation wrapper that sanitizes and validates URLs
 * @param {string} url - URL to navigate to
 * @param {string} method - Navigation method (replace, tab, history)
 * @param {string} target - Target for window.open
 * @returns {boolean} True if navigation was performed
 */
function safeNavigate(url, method = 'replace', target = '_self') {
  // Validate URL first
  if (!url || !isSafeUrl(url)) {
    console.error('Navigation blocked - unsafe URL:', url);
    $(document).trigger('smart:messaging:security:blocked', {
      type: 'unsafe_navigation',
      url: url,
      method: method
    });
    return false;
  }
  
  // Sanitize the URL to prevent any injection
  let sanitizedUrl;
  try {
    // For relative URLs, ensure they're properly formatted
    if (url.startsWith('/')) {
      // Remove any potentially dangerous characters while preserving the path
      sanitizedUrl = url.replace(/[<>"'`]/g, '');
    } else {
      // For absolute URLs, parse and reconstruct
      const parsed = new URL(url, window.location.origin);
      sanitizedUrl = parsed.href;
    }
  } catch (e) {
    console.error('Failed to sanitize URL:', e);
    return false;
  }
  
  // Perform the navigation based on method
  try {
    switch (method) {
      case 'replace':
        // Use location.href instead of location.replace for better security
        window.location.href = sanitizedUrl;
        break;
        
      case 'tab':
        const newWindow = window.open(sanitizedUrl, target);
        if (newWindow && target === '_blank') {
          // Prevent window.opener attacks
          newWindow.opener = null;
        }
        break;
        
      case 'history':
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', sanitizedUrl);
          $(window).trigger('popstate');
        }
        break;
        
      default:
        console.error('Unknown navigation method:', method);
        return false;
    }
    
    // Log successful navigation for audit
    console.log('Navigation performed:', { url: sanitizedUrl, method: method });
    return true;
  } catch (e) {
    console.error('Navigation failed:', e);
    return false;
  }
}

/**
 * Check if a candidate URL is strictly same-origin relative to the current page.
 * Only allows a single leading slash and no full domain or scheme.
 * @param {string} url 
 * @returns {boolean}
 */
function isSameOriginUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    // New URL with base = current location
    const resolved = new URL(url, window.location.origin);
    // Only allow URLs whose origin exactly matches, and path starts with a single /
    return resolved.origin === window.location.origin &&
           /^\/(?!\/)/.test(url) && // prevent // or anything but single / at front
           !/[\s"'><`]/.test(url);  // extra defense
  } catch (e) {
    return false;
  }
}

/**
 * Handlers for ui.* messages
 */
const UIHandlers = globalThis.UIHandlers = {
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
    const target = get(hint, 'target', '_self');
    const url = get(hint, 'url');
    
    SmartWebMessaging.debug('Processing navigation hint', hint);
    
    // No URL means no navigation
    if (!url) {
      if (type !== 'none') {
        console.warn('Navigation hint missing URL:', hint);
      }
      return;
    }
    
    // Map navigation type to our safe navigation method
    let navigationMethod;
    switch (type) {
      case 'none':
        // No navigation requested
        return;
        
      case 'replace':
        navigationMethod = 'replace';
        break;
        
      case 'tab':
        navigationMethod = 'tab';
        break;
        
      case 'history':
        navigationMethod = 'history';
        break;
        
      default:
        console.warn('UIHandlers: Unknown navigation type', type);
        $(document).trigger('smart:messaging:security:blocked', {
          type: 'unknown_navigation_type',
          navigationHint: hint
        });
        return;
    }
    
    // Use the safe navigation function
    const success = safeNavigate(url, navigationMethod, target);
    
    if (!success) {
      // Navigation was blocked - event already triggered by safeNavigate
      console.warn('Navigation hint blocked:', hint);
    } else {
      // Trigger success event for tracking
      $(document).trigger('smart:messaging:navigation:success', {
        url: url,
        method: navigationMethod,
        navigationHint: hint
      });
    }
  }
};
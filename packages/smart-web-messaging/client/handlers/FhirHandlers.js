// packages/smart-web-messaging/client/handlers/FhirHandlers.js

import { get } from 'lodash';
import { HTTP } from 'meteor/fetch';

/**
 * Handlers for fhir.* messages
 * Proxy FHIR requests through messaging
 */
FhirHandlers = {
  /**
   * Main handler router
   * @param {Object} message - Message to handle
   * @param {MessageEvent} event - Original event
   */
  handle: function(message, event) {
    if (!SmartWebMessaging.config.enableFhirProxy) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'FHIR proxy functionality is disabled'
      );
      return;
    }
    
    const action = MessageTypes.getAction(message.messageType);
    
    switch (action) {
      case 'http':
        this.handleHttpRequest(message, event);
        break;
      default:
        console.warn('FhirHandlers: Unknown action', action);
        MessageHandler.sendErrorResponse(
          event.source,
          event.origin,
          message.messageId,
          'Unknown FHIR action'
        );
    }
  },
  
  /**
   * Handle fhir.http message
   * @param {Object} message - HTTP request message
   * @param {MessageEvent} event - Original event
   */
  async handleHttpRequest(message, event) {
    const method = get(message, 'payload.method');
    const url = get(message, 'payload.url');
    const headers = get(message, 'payload.headers', {});
    const body = get(message, 'payload.body');
    
    // Validate required fields
    if (!method || !url) {
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        'Missing required method or url'
      );
      return;
    }
    
    try {
      // Validate URL is for FHIR endpoint
      const fhirBaseUrl = this.getFhirBaseUrl();
      if (!url.startsWith(fhirBaseUrl) && !url.startsWith('/')) {
        throw new Error('URL must be for authorized FHIR endpoint');
      }
      
      // Build full URL if relative
      const fullUrl = url.startsWith('http') ? url : `${fhirBaseUrl}${url}`;
      
      // Add authorization header if available
      const authHeaders = await this.getAuthHeaders();
      const requestHeaders = {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json',
        ...authHeaders,
        ...headers
      };
      
      // Make the request
      SmartWebMessaging.debug('Proxying FHIR request', { method, url: fullUrl });
      
      const options = {
        headers: requestHeaders
      };
      
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        options.data = body;
        options.content = typeof body === 'string' ? body : JSON.stringify(body);
      }
      
      const response = await new Promise((resolve, reject) => {
        HTTP.call(method, fullUrl, options, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      
      // Send successful response
      MessageHandler.sendResponse(
        event.source,
        event.origin,
        message.messageId,
        {
          response: {
            status: response.statusCode,
            headers: response.headers,
            body: response.data || response.content
          }
        }
      );
      
    } catch (error) {
      console.error('FhirHandlers: Request failed', error);
      MessageHandler.sendErrorResponse(
        event.source,
        event.origin,
        message.messageId,
        error.message || 'FHIR request failed'
      );
    }
  },
  
  /**
   * Get FHIR base URL from configuration
   * @returns {String} - FHIR base URL
   */
  getFhirBaseUrl: function() {
    // Check session for SMART context
    const fhirUrl = Session.get('fhirUrl');
    if (fhirUrl) {
      return fhirUrl;
    }
    
    // Check Meteor settings
    const settingsUrl = get(Meteor, 'settings.public.fhir.baseUrl');
    if (settingsUrl) {
      return settingsUrl;
    }
    
    // Default to current origin
    return window.location.origin + '/fhir';
  },
  
  /**
   * Get authorization headers
   * @returns {Promise<Object>} - Headers object
   */
  getAuthHeaders: async function() {
    const headers = {};
    
    // Check for access token in session (from SMART launch)
    const accessToken = Session.get('accessToken');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Check for custom auth header
    const customAuth = Session.get('fhirAuthHeader');
    if (customAuth) {
      Object.assign(headers, customAuth);
    }
    
    return headers;
  }
};
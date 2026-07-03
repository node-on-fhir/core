// packages/smart-web-messaging/lib/utilities/OriginChecker.js

import { get } from 'lodash';

/**
 * Security utilities for SMART Web Messaging
 * Handles origin validation and security checks
 */
const OriginChecker = globalThis.OriginChecker = {
  /**
   * Parse origin from URL string
   * @param {String} url - URL to parse
   * @returns {String} - Origin (protocol://hostname:port)
   */
  parseOrigin: function(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin;
    } catch (error) {
      console.warn('OriginChecker: Failed to parse URL', url, error);
      return null;
    }
  },
  
  /**
   * Check if origin is allowed based on configuration
   * @param {String} origin - Origin to check
   * @param {Array<String>} allowedOrigins - List of allowed origins
   * @returns {Boolean} - True if origin is allowed
   */
  isOriginAllowed: function(origin, allowedOrigins = []) {
    if (!origin || !allowedOrigins || allowedOrigins.length === 0) {
      return false;
    }
    
    // Check exact match
    if (allowedOrigins.includes(origin)) {
      return true;
    }
    
    // Check wildcard patterns
    return allowedOrigins.some(pattern => {
      if (pattern.includes('*')) {
        const regex = this.wildcardToRegex(pattern);
        return regex.test(origin);
      }
      return false;
    });
  },
  
  /**
   * Convert wildcard pattern to regex
   * @param {String} pattern - Pattern with wildcards (e.g., "https://*.example.com")
   * @returns {RegExp} - Regular expression
   */
  wildcardToRegex: function(pattern) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = escaped.replace(/\*/g, '.*');
    return new RegExp('^' + regex + '$');
  },
  
  /**
   * Validate origin against smart_web_messaging_origin from OAuth
   * @param {String} messageOrigin - Origin from postMessage
   * @param {String} authorizedOrigin - Origin from OAuth context
   * @returns {Boolean} - True if origins match
   */
  validateAuthorizedOrigin: function(messageOrigin, authorizedOrigin) {
    if (!messageOrigin || !authorizedOrigin) {
      return false;
    }
    
    // Normalize origins
    const normalizedMessageOrigin = this.parseOrigin(messageOrigin) || messageOrigin;
    const normalizedAuthorizedOrigin = this.parseOrigin(authorizedOrigin) || authorizedOrigin;
    
    return normalizedMessageOrigin === normalizedAuthorizedOrigin;
  },
  
  /**
   * Get allowed origins from settings
   * @returns {Array<String>} - List of allowed origins
   */
  getAllowedOrigins: function() {
    // Check Meteor settings
    const fromSettings = get(Meteor, 'settings.private.smartWebMessaging.allowedOrigins', []);
    const fromPublic = get(Meteor, 'settings.public.smartWebMessaging.allowedOrigins', []);
    
    // Combine and deduplicate
    const combined = [...fromSettings, ...fromPublic];
    return [...new Set(combined)];
  },
  
  /**
   * Check if current environment is secure (HTTPS or localhost)
   * @returns {Boolean} - True if secure context
   */
  isSecureContext: function() {
    if (Meteor.isServer) {
      return true; // Assume server is secure
    }
    
    if (typeof window !== 'undefined') {
      // Check window.isSecureContext
      if (typeof window.isSecureContext !== 'undefined') {
        return window.isSecureContext;
      }
      
      // Fallback: check protocol and hostname
      const isHttps = window.location.protocol === 'https:';
      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
      
      return isHttps || isLocalhost;
    }
    
    return false;
  },
  
  /**
   * Generate a secure random messaging handle
   * @returns {String} - Random handle
   */
  generateMessagingHandle: function() {
    if (Meteor.isServer) {
      // Use crypto on server
      const crypto = Npm.require('crypto');
      return crypto.randomBytes(32).toString('hex');
    } else if (typeof window !== 'undefined' && window.crypto) {
      // Use Web Crypto API on client
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback (less secure)
      console.warn('OriginChecker: Using less secure random generation');
      return Random.id(64);
    }
  }
};
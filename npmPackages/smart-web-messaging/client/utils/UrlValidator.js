// packages/smart-web-messaging/client/utils/UrlValidator.js

/**
 * URL validation utility for security
 * Prevents XSS attacks via javascript: and data: URLs
 */
UrlValidator = {
  /**
   * List of allowed URL schemes for navigation
   */
  allowedSchemes: ['http:', 'https:', 'mailto:'],
  
  /**
   * Check if a URL is safe for navigation
   * @param {string} url - URL to validate
   * @returns {boolean} True if URL is safe
   */
  isSafeUrl: function(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // Trim whitespace
    url = url.trim();
    
    // Check for empty string
    if (!url) {
      return false;
    }
    
    try {
      // Handle relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
      }
      
      // Parse absolute URLs
      const parsed = new URL(url, window.location.origin);
      
      // Check protocol against allowed list
      if (!this.allowedSchemes.includes(parsed.protocol)) {
        console.warn('Blocked navigation to URL with unsafe protocol:', parsed.protocol, url);
        return false;
      }
      
      // Additional checks for data: URLs (even though not in allowed list, double-check)
      if (parsed.protocol === 'data:' || parsed.protocol === 'javascript:' || parsed.protocol === 'vbscript:') {
        console.warn('Blocked potentially malicious URL:', url);
        return false;
      }
      
      return true;
    } catch (e) {
      // Invalid URL format
      console.warn('Invalid URL format:', url, e.message);
      return false;
    }
  },
  
  /**
   * Sanitize a URL for safe navigation
   * @param {string} url - URL to sanitize
   * @returns {string|null} Sanitized URL or null if unsafe
   */
  sanitizeUrl: function(url) {
    if (this.isSafeUrl(url)) {
      return url;
    }
    return null;
  },
  
  /**
   * Check if URL is same-origin
   * @param {string} url - URL to check
   * @returns {boolean} True if same origin
   */
  isSameOrigin: function(url) {
    if (!url) {
      return false;
    }
    
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UrlValidator;
}
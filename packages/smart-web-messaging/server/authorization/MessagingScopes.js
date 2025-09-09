// packages/smart-web-messaging/server/authorization/MessagingScopes.js

/**
 * OAuth scope definitions and handlers for SMART Web Messaging
 */
MessagingScopes = {
  // Scope definitions
  SCOPES: {
    // Base messaging scope
    MESSAGING: 'messaging',
    
    // Scratchpad scopes
    SCRATCHPAD_READ: 'messaging/scratchpad.read',
    SCRATCHPAD_WRITE: 'messaging/scratchpad.write',
    
    // UI control scopes
    UI_DONE: 'messaging/ui.done',
    UI_LAUNCH_ACTIVITY: 'messaging/ui.launchActivity',
    
    // FHIR proxy scope
    FHIR_PROXY: 'messaging/fhir.proxy',
    
    // Wildcard scopes
    MESSAGING_ALL: 'messaging/*',
    SCRATCHPAD_ALL: 'messaging/scratchpad.*',
    UI_ALL: 'messaging/ui.*'
  },
  
  // Scope descriptions for OAuth consent
  DESCRIPTIONS: {
    'messaging': 'Basic SMART Web Messaging capabilities',
    'messaging/scratchpad.read': 'Read temporary scratchpad resources',
    'messaging/scratchpad.write': 'Create, update, and delete temporary scratchpad resources',
    'messaging/ui.done': 'Signal completion of app workflow',
    'messaging/ui.launchActivity': 'Launch activities in the EHR',
    'messaging/fhir.proxy': 'Make FHIR requests through messaging',
    'messaging/*': 'All SMART Web Messaging capabilities',
    'messaging/scratchpad.*': 'All scratchpad operations',
    'messaging/ui.*': 'All UI control operations'
  },
  
  /**
   * Check if a message type requires a specific scope
   * @param {String} messageType - Message type to check
   * @returns {String|null} - Required scope or null if no scope needed
   */
  getRequiredScope: function(messageType) {
    const scopeMap = {
      'scratchpad.create': this.SCOPES.SCRATCHPAD_WRITE,
      'scratchpad.read': this.SCOPES.SCRATCHPAD_READ,
      'scratchpad.update': this.SCOPES.SCRATCHPAD_WRITE,
      'scratchpad.delete': this.SCOPES.SCRATCHPAD_WRITE,
      'ui.done': this.SCOPES.UI_DONE,
      'ui.launchActivity': this.SCOPES.UI_LAUNCH_ACTIVITY,
      'fhir.http': this.SCOPES.FHIR_PROXY
    };
    
    return scopeMap[messageType] || null;
  },
  
  /**
   * Parse messaging scopes from scope string
   * @param {String} scopeString - Space-separated scope string
   * @returns {Array<String>} - Array of messaging scopes
   */
  parseMessagingScopes: function(scopeString) {
    if (!scopeString || typeof scopeString !== 'string') {
      return [];
    }
    
    const allScopes = scopeString.split(' ');
    return allScopes.filter(scope => scope.startsWith('messaging'));
  },
  
  /**
   * Check if scopes include a required scope
   * @param {Array<String>} authorizedScopes - Authorized scopes
   * @param {String} requiredScope - Required scope
   * @returns {Boolean} - True if authorized
   */
  hasScope: function(authorizedScopes, requiredScope) {
    if (!Array.isArray(authorizedScopes) || !requiredScope) {
      return false;
    }
    
    // Check exact match
    if (authorizedScopes.includes(requiredScope)) {
      return true;
    }
    
    // Check wildcard scopes
    const requiredParts = requiredScope.split('/');
    
    return authorizedScopes.some(scope => {
      if (scope.includes('*')) {
        const scopeParts = scope.split('/');
        
        // Check each part
        for (let i = 0; i < scopeParts.length; i++) {
          if (scopeParts[i] === '*') {
            // Wildcard matches rest of path
            return true;
          }
          if (scopeParts[i] !== requiredParts[i]) {
            return false;
          }
        }
      }
      return false;
    });
  },
  
  /**
   * Validate OAuth token has required messaging scopes
   * @param {String} token - OAuth token
   * @param {String} requiredScope - Required scope
   * @returns {Promise<Boolean>} - True if authorized
   */
  validateTokenScope: async function(token, requiredScope) {
    // This would integrate with your OAuth server
    // For now, returning a placeholder
    console.warn('MessagingScopes.validateTokenScope not fully implemented');
    return true;
  },
  
  /**
   * Get human-readable description for scope
   * @param {String} scope - Scope to describe
   * @returns {String} - Description
   */
  getDescription: function(scope) {
    return this.DESCRIPTIONS[scope] || scope;
  },
  
  /**
   * Expand wildcard scopes to concrete scopes
   * @param {Array<String>} scopes - Scopes that may include wildcards
   * @returns {Array<String>} - Expanded scopes
   */
  expandScopes: function(scopes) {
    const expanded = new Set();
    
    scopes.forEach(scope => {
      if (scope === 'messaging/*') {
        // Add all messaging scopes
        Object.values(this.SCOPES).forEach(s => {
          if (!s.includes('*')) {
            expanded.add(s);
          }
        });
      } else if (scope === 'messaging/scratchpad.*') {
        expanded.add(this.SCOPES.SCRATCHPAD_READ);
        expanded.add(this.SCOPES.SCRATCHPAD_WRITE);
      } else if (scope === 'messaging/ui.*') {
        expanded.add(this.SCOPES.UI_DONE);
        expanded.add(this.SCOPES.UI_LAUNCH_ACTIVITY);
      } else {
        expanded.add(scope);
      }
    });
    
    return Array.from(expanded);
  }
};
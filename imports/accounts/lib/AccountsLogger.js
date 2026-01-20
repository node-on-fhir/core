// imports/accounts/lib/AccountsLogger.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Preserve original console methods for line number preservation
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
  group: console.group.bind(console),
  groupCollapsed: console.groupCollapsed.bind(console),
  groupEnd: console.groupEnd.bind(console),
  table: console.table.bind(console)
};

class AccountsLogger {
  constructor() {
    this.isEnabled = get(Meteor, 'settings.public.debug.accounts', true);
    this.logLevel = get(Meteor, 'settings.public.debug.accountsLevel', 'debug');
    this.logPasswords = get(Meteor, 'settings.public.debug.logPasswords', false);
    
    // Log levels in order of severity
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      log: 3,
      debug: 4
    };
  }

  // Check if we should log at this level
  shouldLog(level) {
    if (!this.isEnabled) return false;
    return this.levels[level] <= this.levels[this.logLevel];
  }

  // Obfuscate sensitive data
  obfuscate(data, type = 'password') {
    if (!data) return data;
    
    // Handle non-string data types
    if (typeof data !== 'string') {
      if (type === 'password') return '[REDACTED]';
      return data;
    }
    
    if (type === 'password') {
      if (this.logPasswords) {
        // Show first and last character with length info
        if (data.length <= 2) return '*'.repeat(data.length);
        return `${data[0]}${'*'.repeat(data.length - 2)}${data[data.length - 1]} (len:${data.length})`;
      }
      return '[REDACTED]';
    }
    
    if (type === 'email') {
      // Show domain but obfuscate local part
      const [local, domain] = data.split('@');
      if (!domain) return data;
      if (local.length <= 2) return `**@${domain}`;
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    }
    
    if (type === 'token') {
      // Show first few characters only
      if (data.length <= 8) return '*'.repeat(data.length);
      return `${data.substring(0, 6)}...${data.length > 20 ? data.substring(data.length - 4) : ''}`;
    }
    
    return data;
  }

  // Sanitize objects for logging
  sanitize(obj, depth = 0) {
    if (depth > 3) return '[Max depth reached]';
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const value = obj[key];
      const lowerKey = key.toLowerCase();
      
      // Detect and obfuscate sensitive fields
      if (lowerKey.includes('password') || lowerKey === 'pass' || lowerKey === 'pwd') {
        sanitized[key] = typeof value === 'string' ? this.obfuscate(value, 'password') : value;
      } else if ((lowerKey.includes('email') && lowerKey !== 'isemail') || lowerKey === 'mail') {
        sanitized[key] = typeof value === 'string' ? this.obfuscate(value, 'email') : value;
      } else if (lowerKey.includes('token') || lowerKey === 'secret' || lowerKey === 'key') {
        sanitized[key] = typeof value === 'string' ? this.obfuscate(value, 'token') : value;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Logging methods that preserve line numbers
  log(...args) {
    if (this.shouldLog('log')) {
      originalConsole.log('[Accounts]', ...args.map(arg => this.sanitize(arg)));
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      originalConsole.info('[Accounts]', ...args.map(arg => this.sanitize(arg)));
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      originalConsole.warn('[Accounts]', ...args.map(arg => this.sanitize(arg)));
    }
  }

  error(...args) {
    if (this.shouldLog('error')) {
      originalConsole.error('[Accounts]', ...args.map(arg => this.sanitize(arg)));
    }
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      originalConsole.debug('[Accounts]', ...args.map(arg => this.sanitize(arg)));
    }
  }

  group(label, collapsed = false) {
    if (this.shouldLog('debug')) {
      if (collapsed) {
        originalConsole.groupCollapsed(`[Accounts] ${label}`);
      } else {
        originalConsole.group(`[Accounts] ${label}`);
      }
    }
  }

  groupEnd() {
    if (this.shouldLog('debug')) {
      originalConsole.groupEnd();
    }
  }

  table(data, columns) {
    if (this.shouldLog('debug')) {
      originalConsole.table(this.sanitize(data), columns);
    }
  }

  // Helper for timing operations
  time(label) {
    if (this.shouldLog('debug')) {
      console.time(`[Accounts] ${label}`);
    }
  }

  timeEnd(label) {
    if (this.shouldLog('debug')) {
      console.timeEnd(`[Accounts] ${label}`);
    }
  }

  // Helper for assertions
  assert(condition, message) {
    if (this.shouldLog('error') && !condition) {
      originalConsole.error('[Accounts] Assertion failed:', message);
    }
  }
}

// Export singleton instance
export const logger = new AccountsLogger();

// Also export for testing or alternative instances
export { AccountsLogger };
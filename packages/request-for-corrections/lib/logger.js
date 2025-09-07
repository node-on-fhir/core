// packages/request-for-corrections/lib/logger.js

/**
 * Centralized logging utility for the Patient Correction Requests module
 * Provides consistent logging format and can be configured for different log levels
 */

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

class CorrectionRequestLogger {
  constructor() {
    // Check if debug mode is enabled in settings
    this.debugEnabled = get(Meteor, 'settings.public.debug.correctionRequests', true);
    this.performanceEnabled = get(Meteor, 'settings.public.debug.performance', false);
    
    // Log levels
    this.levels = {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error'
    };
    
    // Track performance metrics
    this.metrics = new Map();
  }
  
  /**
   * Log a debug message
   */
  debug(component, message, data) {
    if (!this.debugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const userId = Meteor.userId();
    
    console.log(`[${component}] ${message}`, {
      timestamp,
      userId,
      ...data
    });
  }
  
  /**
   * Log an info message
   */
  info(component, message, data) {
    const timestamp = new Date().toISOString();
    const userId = Meteor.userId();
    
    console.info(`[${component}] ${message}`, {
      timestamp,
      userId,
      ...data
    });
  }
  
  /**
   * Log a warning
   */
  warn(component, message, data) {
    const timestamp = new Date().toISOString();
    const userId = Meteor.userId();
    
    console.warn(`[${component}] ${message}`, {
      timestamp,
      userId,
      ...data
    });
  }
  
  /**
   * Log an error
   */
  error(component, message, error, data) {
    const timestamp = new Date().toISOString();
    const userId = Meteor.userId();
    
    console.error(`[${component}] ${message}`, {
      timestamp,
      userId,
      error: error?.message || error,
      stack: error?.stack,
      ...data
    });
  }
  
  /**
   * Start a performance measurement
   */
  startPerformance(key) {
    if (!this.performanceEnabled) return;
    
    this.metrics.set(key, {
      start: performance.now(),
      startTime: new Date().toISOString()
    });
  }
  
  /**
   * End a performance measurement and log the result
   */
  endPerformance(key, component, message) {
    if (!this.performanceEnabled) return;
    
    const metric = this.metrics.get(key);
    if (!metric) {
      this.warn(component, `No performance metric found for key: ${key}`);
      return;
    }
    
    const duration = performance.now() - metric.start;
    this.metrics.delete(key);
    
    console.log(`[${component}] Performance: ${message}`, {
      duration: `${duration.toFixed(2)}ms`,
      startTime: metric.startTime,
      endTime: new Date().toISOString()
    });
    
    return duration;
  }
  
  /**
   * Log a grouped set of related messages
   */
  group(component, title, callback) {
    console.group(`[${component}] ${title}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', Meteor.userId());
    
    if (callback) {
      callback();
    }
    
    console.groupEnd();
  }
  
  /**
   * Log subscription status
   */
  logSubscription(component, name, status, data) {
    if (!this.debugEnabled) return;
    
    const style = status.ready ? 'color: green' : 'color: orange';
    console.log(
      `%c[${component}] Subscription "${name}" - ${status.ready ? 'READY' : 'LOADING'}`,
      style,
      {
        timestamp: new Date().toISOString(),
        ...status,
        ...data
      }
    );
  }
  
  /**
   * Log data operations
   */
  logDataOperation(component, operation, collection, query, result) {
    if (!this.debugEnabled) return;
    
    console.log(`[${component}] Data ${operation}`, {
      collection,
      query,
      resultCount: Array.isArray(result) ? result.length : 1,
      timestamp: new Date().toISOString()
    });
    
    if (Array.isArray(result) && result.length > 0) {
      console.log(`[${component}] Sample record:`, result[0]);
    }
  }
  
  /**
   * Log route navigation
   */
  logNavigation(component, from, to, params) {
    this.info(component, `Navigation: ${from} → ${to}`, {
      from,
      to,
      params,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log user actions
   */
  logUserAction(component, action, data) {
    this.info(component, `User Action: ${action}`, {
      action,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log API/Method calls
   */
  logMethodCall(component, method, params, result, error) {
    if (error) {
      this.error(component, `Method "${method}" failed`, error, { params });
    } else {
      this.debug(component, `Method "${method}" succeeded`, { params, result });
    }
  }
}

// Export singleton instance
export const Logger = new CorrectionRequestLogger();

// Also export for testing or custom instances
export default CorrectionRequestLogger;
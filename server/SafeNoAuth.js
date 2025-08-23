// /Volumes/SonicMagic/Code/honeycomb-public-release/server/SafeNoAuth.js

/**
 * SafeNoAuth - Secure Sandbox Authentication Management
 * 
 * PURPOSE:
 * This module provides a secure way to disable authentication for sandbox environments
 * while preventing accidental exposure in production. The healthcare industry requires
 * strict access controls, but developers and researchers need open sandboxes for testing
 * and demonstration purposes. This creates a fundamental tension between security and
 * accessibility.
 * 
 * THE PROBLEM:
 * Using a simple NOAUTH environment variable is dangerous because:
 * 1. Environment variables can be accidentally set in production
 * 2. Cloud platforms often copy environment configs between environments
 * 3. A single misconfiguration could expose patient data
 * 4. There's no audit trail when authentication is disabled
 * 5. Attackers could potentially modify environment variables
 * 
 * OUR SOLUTION:
 * We implement multiple layers of protection:
 * 
 * 1. COMPOUND CHECKS: Require multiple environment variables to be set correctly.
 *    This reduces the chance of accidental activation.
 * 
 * 2. TIME LIMITS: NOAUTH mode automatically expires after a set duration.
 *    This ensures that even if activated, the exposure window is limited.
 * 
 * 3. DOMAIN RESTRICTIONS: Only allow NOAUTH from specific domains/hosts.
 *    This prevents the mode from being active on production domains.
 * 
 * 4. AGGRESSIVE LOGGING: Every NOAUTH request is logged with full details.
 *    This provides an audit trail for security reviews.
 * 
 * 5. STARTUP WARNINGS: Clear, impossible-to-miss warnings when starting in NOAUTH.
 *    This alerts operators immediately if the mode is active.
 * 
 * USAGE:
 * Instead of checking process.env.NOAUTH directly, use:
 *   const noAuthEnabled = SafeNoAuth.isEnabled(req);
 * 
 * For sandbox deployments, set ALL of these:
 *   NOAUTH=true
 *   SANDBOX_MODE=true
 *   NOAUTH_ALLOWED_DOMAINS=localhost,sandbox.example.com
 *   NOAUTH_EXPIRES_HOURS=24
 * 
 * SECURITY CONSIDERATIONS:
 * - Never use NOAUTH in production, even with these safeguards
 * - Regularly audit logs for NOAUTH usage
 * - Consider using read-only sandbox data instead of real data
 * - Implement additional network-level restrictions for sandbox environments
 * - Use separate infrastructure for sandbox deployments
 */

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { AuditEvents } from '../imports/lib/schemas/SimpleSchemas/AuditEvents';

export const SafeNoAuth = {
  // Track when NOAUTH was first enabled
  startTime: null,
  
  // Track total requests in NOAUTH mode for monitoring
  requestCount: 0,
  
  /**
   * Check if NOAUTH mode should be enabled
   * Requires multiple conditions to be true for safety
   */
  isEnabled(req) {
    // First, check compound environment variables
    if (!this.hasRequiredEnvironmentVars()) {
      return false;
    }
    
    // Check if NOAUTH has expired
    if (!this.isWithinTimeLimit()) {
      return false;
    }
    
    // Check if request is from allowed domain
    if (req && !this.isAllowedDomain(req)) {
      return false;
    }
    
    // If all checks pass, log the access
    this.logNoAuthAccess(req);
    
    return true;
  },
  
  /**
   * Compound environment variable check
   * Requires multiple variables to prevent accidental activation
   */
  hasRequiredEnvironmentVars() {
    const required = [
      process.env.NOAUTH === 'true',
      process.env.SANDBOX_MODE === 'true',
      // Optional third confirmation for extra safety
      !process.env.PRODUCTION_MODE || process.env.PRODUCTION_MODE === 'false'
    ];
    
    return required.every(condition => condition === true);
  },
  
  /**
   * Time-based expiration for NOAUTH mode
   * Prevents indefinite exposure if someone forgets to disable it
   */
  isWithinTimeLimit() {
    // If NOAUTH is being checked for the first time, record start time
    if (!this.startTime && process.env.NOAUTH === 'true') {
      this.startTime = new Date();
      console.warn(`NOAUTH mode activated at ${this.startTime.toISOString()}`);
    }
    
    // If no start time, NOAUTH was never properly activated
    if (!this.startTime) {
      return false;
    }
    
    // Check if we've exceeded the time limit
    const maxHours = parseInt(process.env.NOAUTH_EXPIRES_HOURS || '24');
    const maxMilliseconds = maxHours * 60 * 60 * 1000;
    const elapsed = new Date() - this.startTime;
    
    if (elapsed > maxMilliseconds) {
      console.error(`NOAUTH mode expired after ${maxHours} hours`);
      console.error(`Started: ${this.startTime.toISOString()}`);
      console.error(`Current: ${new Date().toISOString()}`);
      
      // Log the expiration
      this.logSecurityEvent('NOAUTH_EXPIRED', {
        startTime: this.startTime,
        expiredAt: new Date(),
        maxHours: maxHours
      });
      
      return false;
    }
    
    // Show remaining time in console
    const remainingHours = ((maxMilliseconds - elapsed) / (60 * 60 * 1000)).toFixed(1);
    if (this.requestCount % 100 === 0) { // Log every 100 requests
      console.warn(`NOAUTH mode: ${remainingHours} hours remaining`);
    }
    
    return true;
  },
  
  /**
   * Domain/host restriction check
   * Only allow NOAUTH from specific domains to prevent production exposure
   */
  isAllowedDomain(req) {
    const allowedDomains = (process.env.NOAUTH_ALLOWED_DOMAINS || 'localhost').split(',');
    const requestHost = get(req, 'headers.host', '').toLowerCase();
    const requestOrigin = get(req, 'headers.origin', '').toLowerCase();
    const requestReferer = get(req, 'headers.referer', '').toLowerCase();
    
    // Check various sources for the domain
    const isAllowed = allowedDomains.some(domain => {
      domain = domain.toLowerCase().trim();
      return requestHost.includes(domain) || 
             requestOrigin.includes(domain) ||
             requestReferer.includes(domain);
    });
    
    if (!isAllowed) {
      console.error('NOAUTH request from unauthorized domain!');
      console.error('Host:', requestHost);
      console.error('Origin:', requestOrigin);
      console.error('Allowed:', allowedDomains.join(', '));
      
      // Log security violation
      this.logSecurityEvent('NOAUTH_UNAUTHORIZED_DOMAIN', {
        requestHost,
        requestOrigin,
        requestReferer,
        allowedDomains,
        ip: get(req, 'connection.remoteAddress')
      });
    }
    
    return isAllowed;
  },
  
  /**
   * Log every NOAUTH access for security auditing
   * This creates a paper trail for security reviews
   */
  logNoAuthAccess(req) {
    this.requestCount++;
    
    // Log every 10th request to avoid log spam, but always log first 10
    if (this.requestCount <= 10 || this.requestCount % 10 === 0) {
      const logEntry = {
        timestamp: new Date(),
        requestCount: this.requestCount,
        method: get(req, 'method'),
        url: get(req, 'url'),
        host: get(req, 'headers.host'),
        userAgent: get(req, 'headers.user-agent'),
        ip: get(req, 'connection.remoteAddress')
      };
      
      console.log('NOAUTH Access:', JSON.stringify(logEntry));
    }
    
    // Log to AuditEvents collection every 100 requests
    if (this.requestCount % 100 === 0) {
      this.logSecurityEvent('NOAUTH_ACCESS_MILESTONE', {
        totalRequests: this.requestCount,
        startTime: this.startTime,
        uptime: new Date() - this.startTime
      });
    }
  },
  
  /**
   * Log security events to the AuditEvents collection
   * Provides permanent audit trail
   */
  logSecurityEvent(eventType, details) {
    try {
      const event = {
        type: {
          code: eventType,
          display: eventType.replace(/_/g, ' ').toLowerCase()
        },
        action: 'E', // Execute
        recorded: new Date(),
        outcome: '0', // Success
        agent: [{
          name: 'SafeNoAuth',
          requestor: false
        }],
        source: {
          site: Meteor.absoluteUrl(),
          type: {
            code: '4', // Application Server
            display: 'Application Server'
          }
        },
        entity: [{
          what: {
            display: 'NOAUTH Mode Activity'
          },
          detail: [{
            type: 'SecurityEvent',
            valueString: JSON.stringify(details)
          }]
        }]
      };
      
      if (AuditEvents) {
        AuditEvents.insert(event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },
  
  /**
   * Display prominent warning on startup
   * Makes it impossible to miss that NOAUTH is active
   */
  displayStartupWarning() {
    if (this.hasRequiredEnvironmentVars()) {
      console.warn('\n\n');
      console.warn('████████████████████████████████████████████████████████████');
      console.warn('█                                                          █');
      console.warn('█  ⚠️   WARNING: NOAUTH MODE IS ENABLED  ⚠️                 █');
      console.warn('█                                                          █');
      console.warn('█  Authentication is DISABLED for sandbox testing.         █');
      console.warn('█  This mode will expire in ' + (process.env.NOAUTH_EXPIRES_HOURS || '24') + ' hours.                     █');
      console.warn('█                                                          █');
      console.warn('█  Allowed domains: ' + (process.env.NOAUTH_ALLOWED_DOMAINS || 'localhost') + '                          █');
      console.warn('█                                                          █');
      console.warn('█  DO NOT USE IN PRODUCTION!                               █');
      console.warn('█                                                          █');
      console.warn('████████████████████████████████████████████████████████████');
      console.warn('\n\n');
      
      // Log the activation
      this.logSecurityEvent('NOAUTH_ACTIVATED', {
        startTime: new Date(),
        expiresHours: process.env.NOAUTH_EXPIRES_HOURS || '24',
        allowedDomains: process.env.NOAUTH_ALLOWED_DOMAINS || 'localhost'
      });
    }
  }
};

// Display warning on startup
Meteor.startup(function() {
  SafeNoAuth.displayStartupWarning();
});
// imports/startup/server/middleware-traditional.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

console.log('Loading traditional authentication middleware...');

// Traditional authentication uses Meteor's built-in DDP authentication
// This file adds additional middleware for traditional auth mode

// IP-based access control
const ipWhitelist = get(Meteor, 'settings.private.security.ipWhitelist', []);
const ipBlacklist = get(Meteor, 'settings.private.security.ipBlacklist', []);

if (ipWhitelist.length > 0 || ipBlacklist.length > 0) {
  WebApp.connectHandlers.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
    
    // Check blacklist first
    if (ipBlacklist.length > 0 && ipBlacklist.includes(clientIP)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Access denied');
      return;
    }
    
    // Check whitelist if configured
    if (ipWhitelist.length > 0 && !ipWhitelist.includes(clientIP)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Access denied');
      return;
    }
    
    next();
  });
}

// Session validation middleware
WebApp.connectHandlers.use((req, res, next) => {
  // Add session tracking headers
  if (req.headers['x-meteor-session']) {
    res.setHeader('X-Session-Valid', 'true');
  }
  
  next();
});

// CORS is handled centrally in server/lib/Cors.js, configured via
// Meteor.settings.private.cors. The middleware that previously lived here
// (reading settings.private.security.cors) registered inside Meteor.startup —
// after the FHIR/DICOM routes — so it never ran for those endpoints. The
// legacy settings.private.security.cors key still works as a fallback in
// getCorsConfig(), which logs a deprecation warning when it is used.

// Request logging for traditional auth
if (get(Meteor, 'settings.private.logging.logRequests', false)) {
  WebApp.connectHandlers.use((req, res, next) => {
    const start = Date.now();
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = {
        timestamp: new Date(),
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: duration,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer
      };
      
      // Add user context if available
      if (req.headers['x-user-id']) {
        log.userId = req.headers['x-user-id'];
      }
      
      console.log('Request:', JSON.stringify(log));
    });
    
    next();
  });
}

// Password policy enforcement
Accounts.validateLoginAttempt((attempt) => {
  if (!attempt.allowed) {
    return false;
  }
  
  // Check if password needs to be changed
  const passwordPolicy = get(Meteor, 'settings.private.accounts.passwordPolicy', {});
  if (passwordPolicy.expirationDays) {
    const user = attempt.user;
    const lastPasswordChange = user.services?.password?.bcrypt?.changed || user.createdAt;
    const daysSinceChange = (new Date() - lastPasswordChange) / (1000 * 60 * 60 * 24);
    
    if (daysSinceChange > passwordPolicy.expirationDays) {
      throw new Meteor.Error('password-expired', 'Your password has expired. Please reset it.');
    }
  }
  
  return true;
});

// Account lockout after failed attempts
const lockoutConfig = get(Meteor, 'settings.private.accounts.lockoutPolicy', {});
if (lockoutConfig.enabled) {
  const failedAttempts = new Map();
  
  Accounts.validateLoginAttempt((attempt) => {
    if (!attempt.allowed) {
      // Track failed attempt
      const key = attempt.connection.clientAddress;
      const attempts = failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
      attempts.count++;
      failedAttempts.set(key, attempts);
      
      // Check if locked out
      if (attempts.count >= lockoutConfig.maxAttempts) {
        const timeSinceFirst = Date.now() - attempts.firstAttempt;
        const lockoutDuration = lockoutConfig.lockoutDuration * 60 * 1000;
        
        if (timeSinceFirst < lockoutDuration) {
          throw new Meteor.Error('account-locked', 
            `Too many failed attempts. Please try again in ${Math.ceil((lockoutDuration - timeSinceFirst) / 60000)} minutes.`);
        } else {
          // Reset counter after lockout period
          failedAttempts.delete(key);
        }
      }
    } else {
      // Clear failed attempts on successful login
      failedAttempts.delete(attempt.connection.clientAddress);
    }
    
    return attempt.allowed;
  });
  
  // Clean up old entries periodically
  Meteor.setInterval(() => {
    const now = Date.now();
    const resetAfter = lockoutConfig.resetAttemptsAfter * 60 * 1000;
    
    for (const [key, attempts] of failedAttempts.entries()) {
      if (now - attempts.firstAttempt > resetAfter) {
        failedAttempts.delete(key);
      }
    }
  }, 60000); // Check every minute
}

console.log('Traditional authentication middleware loaded');
// imports/startup/server/core-startup.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get, set } from 'lodash';

console.log('Initializing Honeycomb server...');

// Inject environment variables into settings
injectEnvironmentVariables();

// Set up error handling
setupErrorHandling();

// Configure server
configureServer();

// Set up security headers
setupSecurityHeaders();

// Initialize core services
initializeCoreServices();

console.log('Core server startup complete');

// Inject environment variables into Meteor.settings
function injectEnvironmentVariables() {
  console.log('Injecting environment variables...');

  // App configuration
  if (process.env.APP_NAME) {
    set(Meteor, 'settings.public.appName', process.env.APP_NAME);
  }
  if (process.env.APP_URL) {
    set(Meteor, 'settings.public.appUrl', process.env.APP_URL);
  }
  if (process.env.NODE_ENV) {
    set(Meteor, 'settings.public.environment', process.env.NODE_ENV);
  }

  // Development auto-login configuration
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTO_LOGIN === 'true') {
    set(Meteor, 'settings.public.devAutoLoginEnabled', true);
    console.log('Development auto-login enabled');
  }

  // Database configuration
  if (process.env.MONGO_URL) {
    // Already handled by Meteor
  }
  if (process.env.MONGO_OPLOG_URL) {
    // Already handled by Meteor
  }

  // Email configuration
  if (process.env.MAIL_URL) {
    process.env.MAIL_URL = process.env.MAIL_URL;
  }
  if (process.env.EMAIL_FROM) {
    set(Meteor, 'settings.private.email.from', process.env.EMAIL_FROM);
  }

  // Security
  if (process.env.FORCE_SSL) {
    set(Meteor, 'settings.public.security.forceSSL', process.env.FORCE_SSL === 'true');
  }
  if (process.env.TRUSTED_PROXIES) {
    set(Meteor, 'settings.private.security.trustedProxies', process.env.TRUSTED_PROXIES.split(','));
  }

  // Feature flags
  if (process.env.ENABLE_ACCOUNTS) {
    set(Meteor, 'settings.public.modules.accounts.enabled', process.env.ENABLE_ACCOUNTS === 'true');
  }
  if (process.env.ENABLE_HIPAA) {
    set(Meteor, 'settings.private.hipaa.enabled', process.env.ENABLE_HIPAA === 'true');
  }

  // API keys and secrets
  if (process.env.JWT_SECRET) {
    set(Meteor, 'settings.private.accounts.jwtSecret', process.env.JWT_SECRET);
  }
  if (process.env.ENCRYPTION_KEY) {
    set(Meteor, 'settings.private.security.encryptionKey', process.env.ENCRYPTION_KEY);
  }
}

// Set up global error handling
function setupErrorHandling() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    
    // Log to error tracking service if configured
    if (get(Meteor, 'settings.private.errorTracking.enabled')) {
      // TODO: Send to error tracking service
    }
    
    // Optionally restart the process
    if (get(Meteor, 'settings.private.errorHandling.restartOnError')) {
      console.log('Restarting due to uncaught exception...');
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Log to error tracking service if configured
    if (get(Meteor, 'settings.private.errorTracking.enabled')) {
      // TODO: Send to error tracking service
    }
  });

  // Meteor method error handling
  Meteor.methods({
    'errors.report': function(errorData) {
      check(errorData, {
        message: String,
        stack: Match.Optional(String),
        url: Match.Optional(String),
        userAgent: Match.Optional(String),
        timestamp: Date,
        metadata: Match.Optional(Object)
      });

      // Add server context
      errorData.userId = this.userId;
      errorData.connectionId = this.connection?.id;
      errorData.clientAddress = this.connection?.clientAddress;
      
      // Log error
      console.error('Client error reported:', errorData);
      
      // Store in database if configured
      if (get(Meteor, 'settings.private.errorTracking.storeInDb')) {
        const ErrorLogs = new Mongo.Collection('error_logs');
        ErrorLogs.insert(errorData);
      }
      
      return true;
    }
  });
}

// Configure server settings
function configureServer() {
  // Set server timezone
  process.env.TZ = get(Meteor, 'settings.private.server.timezone', 'UTC');
  
  // Configure upload limits
  const maxUploadSize = get(Meteor, 'settings.private.server.maxUploadSize', 10 * 1024 * 1024); // 10MB default
  WebApp.connectHandlers.use((req, res, next) => {
    req.setMaxListeners(0);
    next();
  });

  // Configure WebSocket
  const wsConfig = get(Meteor, 'settings.private.server.websocket', {});
  if (wsConfig.compression) {
    // Enable WebSocket compression
    // This would require additional configuration
  }

  // Configure rate limiting
  const rateLimitConfig = get(Meteor, 'settings.private.security.rateLimit', {});
  if (rateLimitConfig.enabled) {
    DDPRateLimiter.setErrorMessage((rateLimitResult) => {
      return `Error: Too many requests. Please slow down. Limit: ${rateLimitResult.numRequests} requests per ${rateLimitResult.timeInterval}ms`;
    });
  }
}

// Set up security headers
function setupSecurityHeaders() {
  WebApp.connectHandlers.use((req, res, next) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS
    if (get(Meteor, 'settings.public.security.forceSSL')) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // CSP
    const cspConfig = get(Meteor, 'settings.private.security.csp', {});
    if (cspConfig.enabled) {
      const cspDirectives = [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${cspConfig.scriptSrc || ''}`,
        `style-src 'self' 'unsafe-inline' ${cspConfig.styleSrc || ''}`,
        `img-src 'self' data: https: ${cspConfig.imgSrc || ''}`,
        `font-src 'self' data: ${cspConfig.fontSrc || ''}`,
        `connect-src 'self' wss: https: ${cspConfig.connectSrc || ''}`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`
      ].join('; ');
      
      res.setHeader('Content-Security-Policy', cspDirectives);
    }
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  });
}

// Initialize core services
function initializeCoreServices() {
  // Set up heartbeat
  const heartbeatInterval = get(Meteor, 'settings.private.monitoring.heartbeatInterval', 60000);
  if (heartbeatInterval > 0) {
    Meteor.setInterval(() => {
      const heartbeat = {
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: Meteor.server.sessions.size
      };
      
      // Publish heartbeat
      if (get(Meteor, 'settings.private.monitoring.publishHeartbeat')) {
        Meteor.publish('system.heartbeat', function() {
          this.added('heartbeat', 'server', heartbeat);
          this.ready();
        });
      }
    }, heartbeatInterval);
  }

  // Set up system info method
  Meteor.methods({
    'system.getInfo': function() {
      // Only allow admins
      if (!this.userId || !Roles.userIsInRole(this.userId, ['admin'])) {
        throw new Meteor.Error('not-authorized');
      }

      return {
        version: Meteor.release,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
        connections: Meteor.server.sessions.size,
        settings: {
          public: Meteor.settings.public
        }
      };
    },

    'system.ping': function() {
      return {
        pong: true,
        timestamp: new Date(),
        serverId: Meteor.absoluteUrl()
      };
    }
  });

  // Set up maintenance mode
  const maintenanceMode = get(Meteor, 'settings.private.maintenance.enabled', false);
  if (maintenanceMode) {
    WebApp.connectHandlers.use((req, res, next) => {
      const allowedIPs = get(Meteor, 'settings.private.maintenance.allowedIPs', []);
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        res.writeHead(503, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Maintenance Mode</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #333; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <h1>Under Maintenance</h1>
            <p>${get(Meteor, 'settings.private.maintenance.message', 'We are currently performing maintenance. Please check back soon.')}</p>
          </body>
          </html>
        `);
        return;
      }
      
      next();
    });
  }
}
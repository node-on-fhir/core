// imports/startup/server/core-startup.js

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { WebApp } from 'meteor/webapp';
import { get, set } from 'lodash';
import LoggerModule from '/imports/lib/Logger.js';

import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';

const log = LoggerModule.Logger.for('CoreStartup');

log.info('Initializing Honeycomb server...');

// Inject environment variables into settings
injectEnvironmentVariables();

// Load x509 keys from database if not present in settings (Electron deployment support)
loadX509KeysFromDatabase();

// Set up error handling
setupErrorHandling();

// Configure server
configureServer();

// Set up security headers
setupSecurityHeaders();

// Initialize core services
initializeCoreServices();

log.info('Core server startup complete');

// Inject environment variables into Meteor.settings
function injectEnvironmentVariables() {
  log.info('Injecting environment variables...');

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
  // Explicitly set based on environment variable to override settings file
  if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTO_LOGIN === 'true') {
    set(Meteor, 'settings.public.devAutoLoginEnabled', true);
    log.info('Development auto-login enabled');
  } else {
    // Explicitly disable if environment variable is not 'true'
    // This overrides any setting from settings.json
    set(Meteor, 'settings.public.devAutoLoginEnabled', false);
    log.info('Development auto-login disabled');
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
  
  // Autopublish configuration
  if (process.env.ENABLE_AUTOPUBLISH) {
    // Handle both 'true' and '1' as truthy values
    const autopublishValue = process.env.ENABLE_AUTOPUBLISH === 'true' || process.env.ENABLE_AUTOPUBLISH === '1';
    set(Meteor, 'settings.private.fhir.autopublishSubscriptions', autopublishValue);
    log.info('Autopublish enabled via environment variable', { envValue: process.env.ENABLE_AUTOPUBLISH, settingValue: autopublishValue });
  }

  // API keys and secrets
  if (process.env.JWT_SECRET) {
    set(Meteor, 'settings.private.accounts.jwtSecret', process.env.JWT_SECRET);
  }
  if (process.env.ENCRYPTION_KEY) {
    set(Meteor, 'settings.private.security.encryptionKey', process.env.ENCRYPTION_KEY);
  }
}

// Load x509 keys from ServerConfiguration collection if not already in settings
// This supports Electron deployments where --settings can't be passed at launch
function loadX509KeysFromDatabase() {
  Meteor.startup(async function(){
    let hasPrivateKey = get(Meteor, 'settings.private.x509.privateKey');
    let hasPublicKey = get(Meteor, 'settings.private.x509.publicKey');
    let hasPublicCert = get(Meteor, 'settings.private.x509.publicCertPem');

    // Only load from DB if keys are missing from settings/env
    if(hasPrivateKey && hasPublicKey && hasPublicCert){
      log.info('x509 keys already present in settings, skipping DB load');
      return;
    }

    try {
      let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
      if(!storedConfig || !storedConfig.data){
        log.info('No stored x509 keys found in database');
        return;
      }

      let loaded = [];

      if(get(storedConfig, 'data.privateKey') && !hasPrivateKey){
        set(Meteor, 'settings.private.x509.privateKey', storedConfig.data.privateKey);
        loaded.push('privateKey');
      }
      if(get(storedConfig, 'data.publicKey') && !hasPublicKey){
        set(Meteor, 'settings.private.x509.publicKey', storedConfig.data.publicKey);
        loaded.push('publicKey');
      }
      if(get(storedConfig, 'data.publicCertPem') && !hasPublicCert){
        set(Meteor, 'settings.private.x509.publicCertPem', storedConfig.data.publicCertPem);
        loaded.push('publicCertPem');
      }

      if(loaded.length > 0){
        log.info('Loaded x509 keys from database', { loaded: loaded.join(', ') });
      }
    } catch(error){
      log.error('Error loading x509 keys from database', { error: error.message });
    }
  });
}

// Set up global error handling
function setupErrorHandling() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception', { error: error && error.message, stack: error && error.stack });
    
    // Log to error tracking service if configured
    if (get(Meteor, 'settings.private.errorTracking.enabled')) {
      // TODO: Send to error tracking service
    }
    
    // Optionally restart the process
    if (get(Meteor, 'settings.private.errorHandling.restartOnError')) {
      log.info('Restarting due to uncaught exception...');
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections.
  //
  // Under rspack the server module chain is async, so a throw during module
  // evaluation (e.g. a ServerMethods registry error) used to surface here as
  // one quiet log line while the server kept running HALF-BOOTED: every
  // main.js module after the throw never evaluated — no core methods, no
  // publications (pages show no data), empty global.Collections. That zombie
  // state is worse than a crash, so boot-phase rejections are fatal by
  // default. Opt out (NOT recommended) with
  // settings.private.errorHandling.tolerateBootRejections: true.
  let bootCompleted = false;
  Meteor.startup(function() {
    bootCompleted = true;
  });
  process.on('unhandledRejection', (reason, promise) => {
    const message = (reason && reason.message) || String(reason);
    log.error('Unhandled Rejection', { reason: message, promise: String(promise) });

    // Log to error tracking service if configured
    if (get(Meteor, 'settings.private.errorTracking.enabled')) {
      // TODO: Send to error tracking service
    }

    // A [ServerMethods] define error is a module-load failure no matter when
    // it surfaces; any rejection before Meteor.startup means part of the
    // server load chain never ran.
    const isDefineError = /^\[ServerMethods\]/.test(message);
    if ((!bootCompleted || isDefineError) &&
        get(Meteor, 'settings.private.errorHandling.tolerateBootRejections', false) !== true) {
      /* eslint-disable no-console */
      console.error('='.repeat(78));
      console.error('[CoreStartup] FATAL: unhandled rejection during server boot.');
      console.error('[CoreStartup] Reason: ' + message);
      if (reason && reason.stack) { console.error(reason.stack); }
      console.error('[CoreStartup] A module in the server load chain threw. Everything imported');
      console.error('[CoreStartup] after it (methods, publications, collections) never loaded.');
      console.error('[CoreStartup] Refusing to run half-booted. To tolerate (NOT recommended):');
      console.error('[CoreStartup]   settings.private.errorHandling.tolerateBootRejections: true');
      console.error('='.repeat(78));
      /* eslint-enable no-console */
      process.exit(1);
    }
  });

  // Client error reporting (rpc migration: legacy name already dotted, no
  // alias needed; check() transpiled to schemaObject).
  ServerMethods.define('errors.report', {
    description: 'Report a client-side error to the server error log',
    // Public by pre-migration design: client error telemetry can fire before
    // any user is signed in.
    requireAuth: false,
    schemaObject: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        stack: { type: 'string' },
        url: { type: 'string' },
        userAgent: { type: 'string' },
        timestamp: {},   // EJSON Date over DDP; not constrained to a JSON type
        metadata: { type: 'object' }
      },
      required: ['message', 'timestamp']
    }
  }, async function(params, context) {
      const errorData = Object.assign({}, params);

      // Add server context (the RPC context does not expose the DDP
      // connection object, so connectionId is no longer captured)
      errorData.userId = context.userId;
      errorData.connectionId = null;
      errorData.clientAddress = context.ip;

      // Log error
      log.error('Client error reported', { message: errorData.message, url: errorData.url, userId: errorData.userId });

      // Store in database if configured
      if (get(Meteor, 'settings.private.errorTracking.storeInDb')) {
        const ErrorLogs = new Mongo.Collection('error_logs');
        ErrorLogs.insert(errorData);
      }

      return true;
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

  // Set up system info methods (rpc migration: legacy names already dotted,
  // no aliases needed).
  ServerMethods.define('system.getInfo', {
    description: 'Return server runtime information (admin only)'
    // requireAuth (default true) replaces the legacy this.userId check; the
    // admin role check below is preserved verbatim.
  }, async function(params, context) {
      // Only allow admins
      if (!context.userId || !Roles.userIsInRole(context.userId, ['admin'])) {
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
  });

  ServerMethods.define('system.ping', {
    description: 'Health-check ping returning server timestamp and URL',
    // Public by pre-migration design: connectivity health check, no
    // sensitive data returned.
    requireAuth: false
  }, async function(params, context) {
      return {
        pong: true,
        timestamp: new Date(),
        serverId: Meteor.absoluteUrl()
      };
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
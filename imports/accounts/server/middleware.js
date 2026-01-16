// imports/accounts/server/middleware.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';
import jwt from 'jsonwebtoken';

// Authentication middleware for different authentication modes
export const AuthMiddleware = {
  // Initialize middleware based on configuration
  initialize() {
    const authMode = get(Meteor, 'settings.private.accounts.authMode', 'traditional');
    console.log(`Initializing authentication middleware: ${authMode}`);

    switch (authMode) {
      case 'traditional':
        this.setupTraditionalAuth();
        break;
      case 'vpn':
        this.setupVPNAuth();
        break;
      case 'anonymous':
        this.setupAnonymousAuth();
        break;
      case 'mobile':
        this.setupMobileAuth();
        break;
      case 'jwt':
        this.setupJWTAuth();
        break;
      case 'api-key':
        this.setupAPIKeyAuth();
        break;
      default:
        console.warn(`Unknown auth mode: ${authMode}, falling back to traditional`);
        this.setupTraditionalAuth();
    }

    // Setup common middleware
    this.setupCommonMiddleware();
  },

  // Traditional Meteor accounts authentication
  setupTraditionalAuth() {
    // Traditional auth uses Meteor's built-in DDP authentication
    // No additional middleware needed
    console.log('Traditional authentication mode active');
  },

  // VPN-based authentication (trust network layer)
  setupVPNAuth() {
    WebApp.connectHandlers.use((req, res, next) => {
      // Check if request comes from VPN network
      const vpnNetworks = get(Meteor, 'settings.private.accounts.vpnNetworks', []);
      const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      const isVPNUser = vpnNetworks.some(network => {
        // Simple IP range check (you'd want more sophisticated logic in production)
        return clientIp.startsWith(network);
      });

      if (isVPNUser) {
        // Extract user from VPN headers
        const vpnUser = req.headers['x-vpn-user'] || req.headers['x-remote-user'];
        if (vpnUser) {
          req.vpnAuthenticated = true;
          req.vpnUser = vpnUser;
          
          // Create or update Meteor user
          Meteor.defer(() => {
            this.createOrUpdateVPNUser(vpnUser, clientIp);
          });
        }
      }

      next();
    });
  },

  // Anonymous authentication mode
  setupAnonymousAuth() {
    WebApp.connectHandlers.use((req, res, next) => {
      // Generate anonymous session ID if not present
      if (!req.headers['x-anonymous-id']) {
        const anonymousId = Random.id();
        res.setHeader('X-Anonymous-ID', anonymousId);
        req.anonymousId = anonymousId;
        
        // Create anonymous user session
        Meteor.defer(() => {
          this.createAnonymousUser(anonymousId);
        });
      } else {
        req.anonymousId = req.headers['x-anonymous-id'];
      }

      next();
    });
  },

  // Mobile app authentication (token-based)
  setupMobileAuth() {
    WebApp.connectHandlers.use('/api', (req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          // Verify mobile app token
          const decoded = this.verifyMobileToken(token);
          req.mobileAuth = decoded;
          req.userId = decoded.userId;
        } catch (error) {
          // Invalid token, but don't block the request
          // Let the method handle authorization
          req.mobileAuthError = error.message;
        }
      }

      next();
    });
  },

  // JWT authentication
  setupJWTAuth() {
    const jwtSecret = get(Meteor, 'settings.private.accounts.jwtSecret');
    if (!jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    WebApp.connectHandlers.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, jwtSecret);
          req.jwtAuth = decoded;
          req.userId = decoded.sub || decoded.userId;
          
          // Refresh token if needed
          const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
          if (expiresIn < 300) { // Less than 5 minutes
            const newToken = this.refreshJWT(decoded);
            res.setHeader('X-New-Token', newToken);
          }
        } catch (error) {
          req.jwtAuthError = error.message;
        }
      }

      next();
    });
  },

  // API Key authentication
  setupAPIKeyAuth() {
    WebApp.connectHandlers.use('/api', (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (apiKey) {
        const keyData = this.validateAPIKey(apiKey);
        if (keyData) {
          req.apiKeyAuth = keyData;
          req.userId = keyData.userId;
          
          // Track API key usage
          Meteor.defer(() => {
            this.trackAPIKeyUsage(apiKey, req);
          });
        } else {
          req.apiKeyAuthError = 'Invalid API key';
        }
      }

      next();
    });
  },

  // Common middleware for all auth modes
  setupCommonMiddleware() {
    // CORS configuration
    WebApp.connectHandlers.use((req, res, next) => {
      const allowedOrigins = get(Meteor, 'settings.private.accounts.cors.allowedOrigins', ['*']);
      const origin = req.headers.origin;
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      next();
    });

    // Request logging
    WebApp.connectHandlers.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration,
          userAgent: req.headers['user-agent'],
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        };

        // Add auth info
        if (req.userId) logData.userId = req.userId;
        if (req.vpnUser) logData.vpnUser = req.vpnUser;
        if (req.anonymousId) logData.anonymousId = req.anonymousId;

        // Log request if enabled
        if (get(Meteor, 'settings.private.accounts.logRequests', false)) {
          console.log('Request:', logData);
        }
      });

      next();
    });

    // Security headers
    WebApp.connectHandlers.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      next();
    });
  },

  // Helper methods
  async createOrUpdateVPNUser(vpnUsername, ipAddress) {
    const existingUser = Meteor.users.findOne({ 'services.vpn.username': vpnUsername });
    
    if (existingUser) {
      // Update last login
      Meteor.users.update(existingUser._id, {
        $set: {
          'services.vpn.lastLoginAt': new Date(),
          'services.vpn.lastIpAddress': ipAddress
        }
      });
    } else {
      // Create new VPN user
      const userId = Accounts.insertUserDoc({}, {
        username: vpnUsername,
        profile: {
          name: vpnUsername,
          source: 'vpn'
        },
        services: {
          vpn: {
            username: vpnUsername,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            lastIpAddress: ipAddress
          }
        }
      });

      // Assign default VPN user role
      const defaultRole = get(Meteor, 'settings.private.accounts.vpnDefaultRole', 'vpn-user');
      if (defaultRole) {
        Roles.addUsersToRoles(userId, [defaultRole]);
      }
    }
  },

  createAnonymousUser(anonymousId) {
    const existingUser = Meteor.users.findOne({ 'services.anonymous.id': anonymousId });
    
    if (!existingUser) {
      Accounts.insertUserDoc({}, {
        username: `anon-${anonymousId}`,
        profile: {
          name: 'Anonymous User',
          source: 'anonymous'
        },
        services: {
          anonymous: {
            id: anonymousId,
            createdAt: new Date()
          }
        }
      });
    }
  },

  verifyMobileToken(token) {
    // Implement mobile token verification
    // This could use JWT or a custom token system
    const mobileSecret = get(Meteor, 'settings.private.accounts.mobileSecret');
    
    try {
      return jwt.verify(token, mobileSecret);
    } catch (error) {
      throw new Error('Invalid mobile token');
    }
  },

  refreshJWT(decoded) {
    const jwtSecret = get(Meteor, 'settings.private.accounts.jwtSecret');
    const expiresIn = get(Meteor, 'settings.private.accounts.jwtExpiresIn', '1h');
    
    const payload = {
      sub: decoded.sub || decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, jwtSecret, { expiresIn });
  },

  validateAPIKey(apiKey) {
    // In production, this would check against a database
    const apiKeys = get(Meteor, 'settings.private.accounts.apiKeys', {});
    const keyData = apiKeys[apiKey];
    
    if (keyData && (!keyData.expiresAt || new Date(keyData.expiresAt) > new Date())) {
      return keyData;
    }
    
    return null;
  },

  trackAPIKeyUsage(apiKey, req) {
    // Track API key usage for rate limiting and analytics
    const collection = new Mongo.Collection('api_key_usage');
    
    collection.insert({
      apiKey,
      timestamp: new Date(),
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  }
};
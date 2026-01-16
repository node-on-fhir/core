// imports/startup/server/middleware-mobile.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

console.log('Loading mobile authentication middleware...');

// Mobile authentication configuration
const mobileConfig = get(Meteor, 'settings.private.accounts.mobile', {
  enabled: true,
  jwtSecret: process.env.MOBILE_JWT_SECRET || Random.secret(),
  tokenExpiration: '30d',
  refreshTokenExpiration: '90d',
  allowMultipleDevices: true,
  requireDeviceId: true,
  enablePushNotifications: false,
  enableBiometric: false,
  apiPrefix: '/api/v1'
});

// Mobile tokens collection
const MobileTokens = new Mongo.Collection('mobile_tokens');

// Mobile authentication middleware
WebApp.connectHandlers.use(mobileConfig.apiPrefix, (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, mobileConfig.jwtSecret);
      
      // Check if token is in database (not revoked)
      const tokenRecord = MobileTokens.findOne({ 
        token: crypto.createHash('sha256').update(token).digest('hex'),
        userId: decoded.userId,
        revoked: { $ne: true }
      });
      
      if (!tokenRecord) {
        throw new Error('Token not found or revoked');
      }
      
      // Update last used
      MobileTokens.update(tokenRecord._id, {
        $set: { lastUsed: new Date() },
        $inc: { useCount: 1 }
      });
      
      // Set request context
      req.mobileAuth = {
        userId: decoded.userId,
        deviceId: decoded.deviceId,
        platform: decoded.platform,
        version: decoded.version,
        tokenId: tokenRecord._id
      };
      
      // Check if token needs refresh
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn < 7 * 24 * 60 * 60) { // Less than 7 days
        res.setHeader('X-Token-Expires-Soon', 'true');
        res.setHeader('X-Token-Expires-In', expiresIn);
      }
      
    } catch (error) {
      req.mobileAuthError = error.message;
      
      // Don't reject the request, let the method handle authorization
      // This allows public endpoints to work
    }
  }
  
  next();
});

// Mobile-specific API endpoints
WebApp.connectHandlers.use(`${mobileConfig.apiPrefix}/auth/login`, async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  try {
    // Parse request body
    const body = await parseBody(req);
    const { email, password, deviceId, platform, version } = body;
    
    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password required');
    }
    
    if (mobileConfig.requireDeviceId && !deviceId) {
      throw new Error('Device ID required');
    }
    
    // Authenticate user
    const user = Meteor.users.findOne({ 'emails.address': email });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const result = Accounts._checkPassword(user, password);
    if (result.error) {
      throw new Error('Invalid credentials');
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateMobileTokens(user, {
      deviceId,
      platform,
      version
    });
    
    // Return response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: jwt.decode(accessToken).exp - Math.floor(Date.now() / 1000),
      user: {
        id: user._id,
        email: user.emails[0].address,
        profile: user.profile
      }
    }));
    
  } catch (error) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Refresh token endpoint
WebApp.connectHandlers.use(`${mobileConfig.apiPrefix}/auth/refresh`, async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  try {
    const body = await parseBody(req);
    const { refreshToken } = body;
    
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, mobileConfig.jwtSecret);
    
    // Check if refresh token is valid
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenRecord = MobileTokens.findOne({
      refreshToken: tokenHash,
      userId: decoded.userId,
      revoked: { $ne: true },
      type: 'refresh'
    });
    
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }
    
    // Get user
    const user = Meteor.users.findOne(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new access token
    const accessToken = jwt.sign({
      userId: user._id,
      deviceId: decoded.deviceId,
      platform: decoded.platform,
      version: decoded.version
    }, mobileConfig.jwtSecret, {
      expiresIn: mobileConfig.tokenExpiration
    });
    
    // Store new access token
    MobileTokens.insert({
      token: crypto.createHash('sha256').update(accessToken).digest('hex'),
      userId: user._id,
      deviceId: decoded.deviceId,
      type: 'access',
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      accessToken,
      expiresIn: jwt.decode(accessToken).exp - Math.floor(Date.now() / 1000)
    }));
    
  } catch (error) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Logout endpoint
WebApp.connectHandlers.use(`${mobileConfig.apiPrefix}/auth/logout`, async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, mobileConfig.jwtSecret);
    
    // Revoke all tokens for this device
    MobileTokens.update({
      userId: decoded.userId,
      deviceId: decoded.deviceId,
      revoked: { $ne: true }
    }, {
      $set: { revoked: true, revokedAt: new Date() }
    }, {
      multi: true
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Helper functions
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

async function generateMobileTokens(user, deviceInfo) {
  const tokenData = {
    userId: user._id,
    deviceId: deviceInfo.deviceId,
    platform: deviceInfo.platform || 'unknown',
    version: deviceInfo.version || '1.0.0'
  };
  
  // Generate access token
  const accessToken = jwt.sign(tokenData, mobileConfig.jwtSecret, {
    expiresIn: mobileConfig.tokenExpiration
  });
  
  // Generate refresh token
  const refreshToken = jwt.sign({
    ...tokenData,
    type: 'refresh'
  }, mobileConfig.jwtSecret, {
    expiresIn: mobileConfig.refreshTokenExpiration
  });
  
  // Store tokens
  const now = new Date();
  
  // Check device limit
  if (!mobileConfig.allowMultipleDevices) {
    // Revoke other devices' tokens
    MobileTokens.update({
      userId: user._id,
      deviceId: { $ne: deviceInfo.deviceId },
      revoked: { $ne: true }
    }, {
      $set: { revoked: true, revokedAt: now }
    }, {
      multi: true
    });
  }
  
  // Store access token
  MobileTokens.insert({
    token: crypto.createHash('sha256').update(accessToken).digest('hex'),
    userId: user._id,
    deviceId: deviceInfo.deviceId,
    platform: deviceInfo.platform,
    type: 'access',
    createdAt: now,
    lastUsed: now,
    useCount: 0
  });
  
  // Store refresh token
  MobileTokens.insert({
    refreshToken: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    userId: user._id,
    deviceId: deviceInfo.deviceId,
    platform: deviceInfo.platform,
    type: 'refresh',
    createdAt: now,
    lastUsed: now,
    useCount: 0
  });
  
  return { accessToken, refreshToken };
}

// Methods for mobile authentication
Meteor.methods({
  'mobile.registerDevice': async function(deviceInfo) {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated');
    }
    
    check(deviceInfo, {
      deviceId: String,
      platform: String,
      model: Match.Optional(String),
      osVersion: Match.Optional(String),
      appVersion: Match.Optional(String),
      pushToken: Match.Optional(String)
    });
    
    // Store device information
    const Devices = new Mongo.Collection('user_devices');
    Devices.upsert({
      userId: this.userId,
      deviceId: deviceInfo.deviceId
    }, {
      $set: {
        ...deviceInfo,
        userId: this.userId,
        lastSeen: new Date()
      }
    });
    
    return true;
  },
  
  'mobile.updatePushToken': function(deviceId, pushToken) {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated');
    }
    
    check(deviceId, String);
    check(pushToken, String);
    
    const Devices = new Mongo.Collection('user_devices');
    Devices.update({
      userId: this.userId,
      deviceId: deviceId
    }, {
      $set: { pushToken, pushTokenUpdatedAt: new Date() }
    });
    
    return true;
  },
  
  'mobile.enableBiometric': async function(deviceId, biometricData) {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated');
    }
    
    check(deviceId, String);
    check(biometricData, {
      type: String, // 'fingerprint', 'face', 'iris'
      publicKey: String
    });
    
    // Store biometric public key
    Meteor.users.update(this.userId, {
      $set: {
        [`services.mobile.devices.${deviceId}.biometric`]: {
          type: biometricData.type,
          publicKey: biometricData.publicKey,
          enabledAt: new Date()
        }
      }
    });
    
    return true;
  },
  
  'mobile.getActiveDevices': function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated');
    }
    
    // Get all active tokens for user
    const activeTokens = MobileTokens.find({
      userId: this.userId,
      type: 'access',
      revoked: { $ne: true }
    }, {
      fields: { deviceId: 1, platform: 1, lastUsed: 1, createdAt: 1 }
    }).fetch();
    
    // Group by device
    const devices = {};
    activeTokens.forEach(token => {
      if (!devices[token.deviceId]) {
        devices[token.deviceId] = {
          deviceId: token.deviceId,
          platform: token.platform,
          firstSeen: token.createdAt,
          lastActive: token.lastUsed,
          tokenCount: 0
        };
      }
      devices[token.deviceId].tokenCount++;
      if (token.lastUsed > devices[token.deviceId].lastActive) {
        devices[token.deviceId].lastActive = token.lastUsed;
      }
    });
    
    return Object.values(devices);
  },
  
  'mobile.revokeDevice': function(deviceId) {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated');
    }
    
    check(deviceId, String);
    
    // Revoke all tokens for device
    const count = MobileTokens.update({
      userId: this.userId,
      deviceId: deviceId,
      revoked: { $ne: true }
    }, {
      $set: { revoked: true, revokedAt: new Date() }
    }, {
      multi: true
    });
    
    return { revoked: count };
  }
});

// Cleanup old mobile tokens
Meteor.setInterval(() => {
  // Remove expired tokens older than 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  
  const removed = MobileTokens.remove({
    $or: [
      { revoked: true, revokedAt: { $lt: cutoff } },
      { lastUsed: { $lt: cutoff } }
    ]
  });
  
  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired mobile tokens`);
  }
}, 24 * 60 * 60 * 1000); // Daily

console.log('Mobile authentication middleware loaded');
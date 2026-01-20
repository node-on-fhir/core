// imports/startup/server/middleware-anonymous.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { Random } from 'meteor/random';
import { get } from 'lodash';

console.log('Loading anonymous authentication middleware...');

// Anonymous authentication configuration
const anonConfig = get(Meteor, 'settings.private.accounts.anonymous', {
  enabled: true,
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  allowPersistence: true,
  autoCleanup: true,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  maxAnonymousUsers: 10000,
  features: {
    canSaveData: true,
    canAccessAPI: true,
    canExport: false,
    canShare: true
  }
});

// Anonymous sessions collection
const AnonymousSessions = new Mongo.Collection('anonymous_sessions');

// Anonymous authentication middleware
WebApp.connectHandlers.use((req, res, next) => {
  let anonId = req.headers['x-anonymous-id'] || req.cookies?.anonymousId;
  
  if (!anonId) {
    // Generate new anonymous ID
    anonId = `anon_${Random.id()}`;
    
    // Set cookie if persistence is allowed
    if (anonConfig.allowPersistence) {
      res.setHeader('Set-Cookie', `anonymousId=${anonId}; Path=/; Max-Age=${anonConfig.sessionDuration / 1000}; HttpOnly`);
    }
    
    // Set header for client
    res.setHeader('X-Anonymous-ID', anonId);
    
    // Create anonymous session
    createAnonymousSession(anonId, req);
  } else {
    // Validate existing anonymous ID
    const session = AnonymousSessions.findOne({ _id: anonId });
    
    if (!session || (Date.now() - session.lastActivity > anonConfig.sessionDuration)) {
      // Session expired or not found, create new one
      anonId = `anon_${Random.id()}`;
      res.setHeader('X-Anonymous-ID', anonId);
      
      if (anonConfig.allowPersistence) {
        res.setHeader('Set-Cookie', `anonymousId=${anonId}; Path=/; Max-Age=${anonConfig.sessionDuration / 1000}; HttpOnly`);
      }
      
      createAnonymousSession(anonId, req);
    } else {
      // Update last activity
      AnonymousSessions.update(anonId, {
        $set: { lastActivity: Date.now() },
        $inc: { activityCount: 1 }
      });
    }
  }
  
  // Set anonymous context
  req.anonymousId = anonId;
  req.isAnonymous = true;
  
  next();
});

// Create anonymous session
function createAnonymousSession(anonId, req) {
  const session = {
    _id: anonId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    activityCount: 1,
    ip: req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer,
    data: {}
  };
  
  AnonymousSessions.insert(session);
  
  // Create anonymous user if needed
  if (anonConfig.features.canSaveData) {
    createAnonymousUser(anonId);
  }
}

// Create anonymous user account
function createAnonymousUser(anonId) {
  try {
    const existingUser = Meteor.users.findOne({ 'services.anonymous.id': anonId });
    
    if (!existingUser) {
      const userId = Accounts.insertUserDoc({}, {
        username: anonId,
        profile: {
          name: 'Anonymous User',
          isAnonymous: true
        },
        services: {
          anonymous: {
            id: anonId,
            createdAt: new Date()
          }
        }
      });
      
      // Assign anonymous role if roles package is available
      if (Package['alanning:roles']) {
        Roles.addUsersToRoles(userId, ['anonymous']);
      }
      
      console.log(`Created anonymous user: ${anonId}`);
    }
  } catch (error) {
    console.error('Error creating anonymous user:', error);
  }
}

// Custom login handler for anonymous users
Accounts.registerLoginHandler('anonymous', (loginRequest) => {
  if (!loginRequest.anonymous) {
    return undefined; // Let other handlers try
  }
  
  const { id } = loginRequest.anonymous;
  
  // Validate anonymous session
  const session = AnonymousSessions.findOne({ _id: id });
  if (!session) {
    throw new Meteor.Error('invalid-anonymous-id', 'Invalid anonymous session');
  }
  
  // Find or create user
  let user = Meteor.users.findOne({ 'services.anonymous.id': id });
  if (!user) {
    // Create user on demand
    createAnonymousUser(id);
    user = Meteor.users.findOne({ 'services.anonymous.id': id });
  }
  
  if (!user) {
    throw new Meteor.Error('anonymous-user-creation-failed', 'Failed to create anonymous user');
  }
  
  // Update session
  AnonymousSessions.update(id, {
    $set: { 
      lastLogin: Date.now(),
      userId: user._id
    }
  });
  
  return { userId: user._id };
});

// Methods for anonymous authentication
Meteor.methods({
  'anonymous.login': function(anonymousId) {
    check(anonymousId, String);
    
    // Use custom login handler
    const result = Accounts._loginMethod(this, 'anonymous', [{ 
      anonymous: { id: anonymousId } 
    }]);
    
    return result;
  },
  
  'anonymous.saveData': function(key, value) {
    if (!anonConfig.features.canSaveData) {
      throw new Meteor.Error('not-allowed', 'Anonymous users cannot save data');
    }
    
    const anonId = this.connection?.httpHeaders?.['x-anonymous-id'];
    if (!anonId) {
      throw new Meteor.Error('no-anonymous-id', 'No anonymous ID found');
    }
    
    check(key, String);
    check(value, Match.Any);
    
    // Save data to session
    AnonymousSessions.update(anonId, {
      $set: { [`data.${key}`]: value }
    });
    
    return true;
  },
  
  'anonymous.getData': function(key) {
    const anonId = this.connection?.httpHeaders?.['x-anonymous-id'];
    if (!anonId) {
      throw new Meteor.Error('no-anonymous-id', 'No anonymous ID found');
    }
    
    check(key, String);
    
    const session = AnonymousSessions.findOne(anonId);
    return session?.data?.[key];
  },
  
  'anonymous.convertToUser': function(userData) {
    const anonId = this.connection?.httpHeaders?.['x-anonymous-id'];
    if (!anonId) {
      throw new Meteor.Error('no-anonymous-id', 'No anonymous ID found');
    }
    
    check(userData, {
      email: String,
      password: String,
      profile: Match.Optional(Object)
    });
    
    // Find anonymous user
    const anonUser = Meteor.users.findOne({ 'services.anonymous.id': anonId });
    if (!anonUser) {
      throw new Meteor.Error('anonymous-user-not-found', 'Anonymous user not found');
    }
    
    // Check if email already exists
    const existingUser = Meteor.users.findOne({ 'emails.address': userData.email });
    if (existingUser) {
      throw new Meteor.Error('email-exists', 'Email already registered');
    }
    
    // Convert anonymous user to regular user
    Meteor.users.update(anonUser._id, {
      $set: {
        emails: [{ address: userData.email, verified: false }],
        profile: { ...anonUser.profile, ...userData.profile, isAnonymous: false }
      },
      $unset: {
        'services.anonymous': 1
      }
    });
    
    // Set password
    Accounts.setPassword(anonUser._id, userData.password);
    
    // Send verification email
    Accounts.sendVerificationEmail(anonUser._id);
    
    // Update roles
    if (Package['alanning:roles']) {
      Roles.removeUsersFromRoles(anonUser._id, ['anonymous']);
      Roles.addUsersToRoles(anonUser._id, ['user']);
    }
    
    // Clean up anonymous session
    AnonymousSessions.remove(anonId);
    
    return { success: true, userId: anonUser._id };
  }
});

// Publications for anonymous users
Meteor.publish('anonymous.session', function() {
  const anonId = this.connection?.httpHeaders?.['x-anonymous-id'];
  
  if (anonId) {
    return AnonymousSessions.find({ _id: anonId }, {
      fields: { data: 1, createdAt: 1, features: 1 }
    });
  }
  
  return this.ready();
});

// Cleanup old anonymous sessions
if (anonConfig.autoCleanup) {
  Meteor.setInterval(() => {
    const cutoff = Date.now() - anonConfig.sessionDuration;
    
    // Find expired sessions
    const expiredSessions = AnonymousSessions.find({
      lastActivity: { $lt: cutoff }
    }).fetch();
    
    // Remove expired sessions and their users
    expiredSessions.forEach(session => {
      // Remove session
      AnonymousSessions.remove(session._id);
      
      // Remove associated user if exists
      if (session.userId) {
        Meteor.users.remove({ 
          _id: session.userId,
          'services.anonymous': { $exists: true }
        });
      }
    });
    
    // Check max anonymous users limit
    const anonUserCount = Meteor.users.find({ 
      'services.anonymous': { $exists: true } 
    }).count();
    
    if (anonUserCount > anonConfig.maxAnonymousUsers) {
      // Remove oldest anonymous users
      const usersToRemove = anonUserCount - anonConfig.maxAnonymousUsers;
      const oldestUsers = Meteor.users.find(
        { 'services.anonymous': { $exists: true } },
        { sort: { createdAt: 1 }, limit: usersToRemove }
      ).fetch();
      
      oldestUsers.forEach(user => {
        Meteor.users.remove(user._id);
        AnonymousSessions.remove({ userId: user._id });
      });
    }
    
    console.log(`Cleaned up ${expiredSessions.length} expired anonymous sessions`);
  }, anonConfig.cleanupInterval);
}

// Security rules for anonymous users
if (anonConfig.features.canAccessAPI) {
  // Allow anonymous users to call certain methods
  const allowedMethods = get(Meteor, 'settings.private.accounts.anonymous.allowedMethods', []);
  
  Meteor.methods({
    'anonymous.checkAccess': function(methodName) {
      check(methodName, String);
      
      const isAnonymous = this.connection?.httpHeaders?.['x-anonymous-id'];
      if (!isAnonymous) {
        return true; // Not anonymous, regular access control applies
      }
      
      return allowedMethods.includes(methodName);
    }
  });
}

console.log('Anonymous authentication middleware loaded');
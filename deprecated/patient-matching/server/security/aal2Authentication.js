// packages/patient-matching/server/security/aal2Authentication.js

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';
import crypto from 'crypto';

// AAL2 (Authentication Assurance Level 2) authentication support
export const AAL2Authentication = {
  
  // Verify AAL2 requirements are met
  verifyAAL2: function(userId, authContext = {}) {
    const user = Meteor.users.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const aal2Requirements = {
      hasMultiFactorAuth: false,
      hasVerifiedIdentity: false,
      hasSecureSession: false,
      lastAuthTime: null
    };
    
    // Check for multi-factor authentication
    if (get(user, 'services.totp.enabled') || get(user, 'profile.twoFactorEnabled')) {
      aal2Requirements.hasMultiFactorAuth = true;
    }
    
    // Check for verified identity (e.g., verified email, phone, or government ID)
    if (get(user, 'emails[0].verified') || get(user, 'profile.identityVerified')) {
      aal2Requirements.hasVerifiedIdentity = true;
    }
    
    // Check session security
    const sessionToken = get(authContext, 'sessionToken');
    if (sessionToken && this.isSecureSession(sessionToken)) {
      aal2Requirements.hasSecureSession = true;
    }
    
    // Get last authentication time
    aal2Requirements.lastAuthTime = get(user, 'services.resume.loginTokens[0].when');
    
    // Determine if AAL2 is satisfied
    const isAAL2 = aal2Requirements.hasMultiFactorAuth && 
                   aal2Requirements.hasVerifiedIdentity && 
                   aal2Requirements.hasSecureSession;
    
    return {
      isAAL2,
      requirements: aal2Requirements,
      userId: userId
    };
  },
  
  // Check if session meets security requirements
  isSecureSession: function(sessionToken) {
    if (!sessionToken) return false;
    
    // In production, verify:
    // - Session is over HTTPS
    // - Session has not expired
    // - Session token is cryptographically secure
    
    // For now, basic validation
    return sessionToken.length >= 32;
  },
  
  // Generate AAL2 authentication token
  generateAAL2Token: function(userId, duration = 3600000) { // 1 hour default
    const user = Meteor.users.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const verification = this.verifyAAL2(userId);
    if (!verification.isAAL2) {
      throw new Error('User does not meet AAL2 requirements');
    }
    
    const token = {
      userId: userId,
      aal: 'AAL2',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + duration),
      tokenId: crypto.randomBytes(32).toString('hex'),
      authFactors: {
        password: true,
        mfa: get(user, 'services.totp.enabled', false),
        biometric: get(user, 'profile.biometricEnabled', false)
      }
    };
    
    // Store token (in production, use secure token storage)
    if (!user.services) user.services = {};
    if (!user.services.aal2) user.services.aal2 = {};
    user.services.aal2.token = token;
    
    Meteor.users.update(userId, {
      $set: { 'services.aal2.token': token }
    });
    
    return token;
  },
  
  // Validate AAL2 token
  validateAAL2Token: function(tokenId, userId) {
    const user = Meteor.users.findOne(userId);
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }
    
    const token = get(user, 'services.aal2.token');
    if (!token) {
      return { valid: false, reason: 'No AAL2 token found' };
    }
    
    if (token.tokenId !== tokenId) {
      return { valid: false, reason: 'Invalid token' };
    }
    
    if (new Date() > new Date(token.expiresAt)) {
      return { valid: false, reason: 'Token expired' };
    }
    
    return { valid: true, token: token };
  },
  
  // Require AAL2 for sensitive operations
  requireAAL2: function(userId, authContext = {}) {
    const verification = this.verifyAAL2(userId, authContext);
    
    if (!verification.isAAL2) {
      const missingRequirements = [];
      
      if (!verification.requirements.hasMultiFactorAuth) {
        missingRequirements.push('Multi-factor authentication required');
      }
      if (!verification.requirements.hasVerifiedIdentity) {
        missingRequirements.push('Identity verification required');
      }
      if (!verification.requirements.hasSecureSession) {
        missingRequirements.push('Secure session required');
      }
      
      throw new Meteor.Error('aal2-required', 
        'AAL2 authentication required. Missing: ' + missingRequirements.join(', '));
    }
    
    return verification;
  },
  
  // Elevate session to AAL2
  elevateToAAL2: async function(userId, additionalFactor) {
    const user = Meteor.users.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify additional factor (e.g., MFA code, biometric)
    const factorValid = await this.verifyAdditionalFactor(userId, additionalFactor);
    if (!factorValid) {
      throw new Error('Invalid authentication factor');
    }
    
    // Update user's authentication level
    Meteor.users.update(userId, {
      $set: {
        'profile.currentAAL': 'AAL2',
        'profile.aal2ElevatedAt': new Date(),
        'services.aal2.lastVerification': new Date()
      }
    });
    
    // Generate new AAL2 token
    return this.generateAAL2Token(userId);
  },
  
  // Verify additional authentication factor
  verifyAdditionalFactor: async function(userId, factor) {
    // In production, implement actual verification logic
    // For now, basic validation
    
    if (factor.type === 'totp') {
      // Verify TOTP code
      return factor.code && factor.code.length === 6;
    } else if (factor.type === 'biometric') {
      // Verify biometric data
      return factor.data && factor.signature;
    } else if (factor.type === 'sms') {
      // Verify SMS code
      return factor.code && factor.code.length >= 4;
    }
    
    return false;
  }
};
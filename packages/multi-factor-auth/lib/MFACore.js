// packages/multi-factor-auth/lib/MFACore.js

import { get, set } from 'lodash';
import speakeasy from 'speakeasy';

// ONC 170.315(d)(13) Multi-Factor Authentication Implementation
export class MFACore {
  
  // Generate TOTP secret for new user
  static generateSecret(userInfo = {}) {
    const secret = speakeasy.generateSecret({
      name: userInfo.name || 'Honeycomb User',
      issuer: 'Honeycomb Healthcare',
      length: 32
    });
    
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      manualEntryKey: secret.base32
    };
  }
  
  // Verify TOTP token
  static verifyToken(secret, token, window = 2) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window, // Allow 60 second window for clock drift
      time: Math.floor(Date.now() / 1000)
    });
  }
  
  // Generate backup codes
  static generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
  
  // Hash backup code for storage
  static hashBackupCode(code) {
    // Simple hash - in production use bcrypt
    if (typeof btoa !== 'undefined') {
      return btoa(code + 'honeycomb_salt').replace(/[^a-zA-Z0-9]/g, '');
    } else {
      // Server-side fallback using Buffer
      return Buffer.from(code + 'honeycomb_salt').toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    }
  }
  
  // Verify backup code
  static verifyBackupCode(code, hashedCode) {
    return MFACore.hashBackupCode(code) === hashedCode;
  }
  
  // Generate QR code data URL
  static generateQRCodeDataURL(secret, userInfo = {}) {
    const issuer = encodeURIComponent('Honeycomb Healthcare');
    const name = encodeURIComponent(userInfo.name || userInfo.email || 'User');
    const secretKey = secret;
    
    const otpauthUrl = `otpauth://totp/${issuer}:${name}?secret=${secretKey}&issuer=${issuer}`;
    
    // Return the URL that can be used with a QR code library
    return otpauthUrl;
  }
  
  // Validate ONC 170.315(d)(13) compliance
  static validateONCCompliance(mfaConfig) {
    const errors = [];
    const warnings = [];
    
    // Check required elements for ONC certification
    if (!mfaConfig.totpEnabled && !mfaConfig.smsEnabled && !mfaConfig.emailEnabled) {
      errors.push('At least one multi-factor authentication method must be enabled');
    }
    
    if (!mfaConfig.enforcementPolicy) {
      warnings.push('MFA enforcement policy should be defined');
    }
    
    if (!mfaConfig.backupCodesEnabled) {
      warnings.push('Backup codes recommended for account recovery');
    }
    
    // Check session management
    if (!mfaConfig.sessionTimeout || mfaConfig.sessionTimeout > 3600) {
      warnings.push('Session timeout should be 60 minutes or less for security');
    }
    
    // Check audit logging
    if (!mfaConfig.auditLogging) {
      errors.push('Audit logging required for ONC compliance');
    }
    
    return {
      compliant: errors.length === 0,
      errors: errors,
      warnings: warnings,
      score: Math.max(0, 100 - (errors.length * 25) - (warnings.length * 10))
    };
  }
  
  // Generate secure random string for recovery codes
  static generateSecureRandom(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for server-side
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }
  
  // Format backup codes for display
  static formatBackupCodes(codes) {
    return codes.map(code => 
      code.substring(0, 4) + '-' + code.substring(4)
    );
  }
  
  // Check if user needs MFA based on policy
  static requiresMFA(user, policy = {}) {
    // Default policy: require MFA for all users
    if (policy.enforceForAll) {
      return true;
    }
    
    // Role-based MFA requirements
    if (policy.enforceForRoles && user.roles) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
      return policy.enforceForRoles.some(role => userRoles.includes(role));
    }
    
    // Admin users always require MFA
    if (user.roles && (
      user.roles.includes('admin') || 
      user.roles.includes('sysadmin') || 
      user.roles.includes('practitioner')
    )) {
      return true;
    }
    
    return false;
  }
  
  // Generate MFA challenge for login
  static generateChallenge(user) {
    const methods = [];
    
    if (get(user, 'mfa.totp.enabled')) {
      methods.push({
        type: 'totp',
        name: 'Authenticator App',
        description: 'Enter the 6-digit code from your authenticator app'
      });
    }
    
    if (get(user, 'mfa.sms.enabled')) {
      methods.push({
        type: 'sms',
        name: 'SMS Code',
        description: `We'll send a code to ${user.mfa.sms.maskedNumber}`
      });
    }
    
    if (get(user, 'mfa.backup.enabled')) {
      methods.push({
        type: 'backup',
        name: 'Backup Code',
        description: 'Use one of your backup recovery codes'
      });
    }
    
    return {
      challengeId: MFACore.generateSecureRandom(32),
      methods: methods,
      expiresAt: new Date(Date.now() + 300000) // 5 minutes
    };
  }
}

// Default MFA policies for healthcare environments
export const DefaultMFAPolicies = {
  strict: {
    enforceForAll: true,
    backupCodesEnabled: true,
    sessionTimeout: 1800, // 30 minutes
    auditLogging: true,
    allowedMethods: ['totp', 'backup'],
    description: 'High security policy for all users'
  },
  
  roleBasedStandard: {
    enforceForAll: false,
    enforceForRoles: ['admin', 'practitioner', 'nurse'],
    backupCodesEnabled: true,
    sessionTimeout: 3600, // 60 minutes
    auditLogging: true,
    allowedMethods: ['totp', 'sms', 'backup'],
    description: 'Standard policy for healthcare roles'
  },
  
  adminOnly: {
    enforceForAll: false,
    enforceForRoles: ['admin', 'sysadmin'],
    backupCodesEnabled: true,
    sessionTimeout: 1800, // 30 minutes
    auditLogging: true,
    allowedMethods: ['totp', 'backup'],
    description: 'MFA required only for administrative users'
  }
};

export default MFACore;
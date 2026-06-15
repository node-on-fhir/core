// packages/hipaa-compliance/lib/EncryptionManager.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import crypto from 'crypto';
import { SecurityLevels } from './Constants';

// Encryption management for sensitive audit data
export const EncryptionManager = {
  // Get encryption key from settings or environment
  getEncryptionKey: function() {
    const key = get(Meteor, 'settings.private.hipaa.encryption.secretKey');
    if (!key) {
      console.warn('No encryption key configured - using default (NOT SECURE FOR PRODUCTION)');
      return 'default-insecure-key-replace-in-production';
    }
    return key;
  },

  // Get current encryption level
  getEncryptionLevel: function() {
    return get(Meteor, 'settings.private.hipaa.security.encryptionLevel', SecurityLevels.NONE);
  },

  // Encrypt sensitive data based on configured level
  encryptSensitiveData: function(data, encryptionLevel = null) {
    const level = encryptionLevel || this.getEncryptionLevel();
    
    // Convert data to string if needed
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    switch(level) {
      case SecurityLevels.NONE:
        return dataString;
        
      case SecurityLevels.BASIC:
        return this.basicEncrypt(dataString);
        
      case SecurityLevels.AES:
        return this.aesEncrypt(dataString);
        
      case SecurityLevels.ADVANCED:
        return this.advancedEncrypt(dataString);
        
      default:
        console.warn(`Unknown encryption level: ${level}`);
        return dataString;
    }
  },

  // Decrypt sensitive data based on configured level
  decryptSensitiveData: function(encryptedData, encryptionLevel = null) {
    const level = encryptionLevel || this.getEncryptionLevel();
    
    if (!encryptedData) {
      return null;
    }
    
    try {
      switch(level) {
        case SecurityLevels.NONE:
          return encryptedData;
          
        case SecurityLevels.BASIC:
          return this.basicDecrypt(encryptedData);
          
        case SecurityLevels.AES:
          return this.aesDecrypt(encryptedData);
          
        case SecurityLevels.ADVANCED:
          return this.advancedDecrypt(encryptedData);
          
        default:
          return encryptedData;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  },

  // Basic encryption (Base64)
  basicEncrypt: function(data) {
    return Buffer.from(data).toString('base64');
  },

  // Basic decryption (Base64)
  basicDecrypt: function(data) {
    return Buffer.from(data, 'base64').toString('utf8');
  },

  // AES encryption
  aesEncrypt: function(data) {
    const algorithm = get(Meteor, 'settings.private.hipaa.encryption.algorithm', 'aes-256-gcm');
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return encrypted data with IV and auth tag
    return JSON.stringify({
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  },

  // AES decryption
  aesDecrypt: function(encryptedDataJson) {
    const { encrypted, iv, authTag } = JSON.parse(encryptedDataJson);
    
    const algorithm = get(Meteor, 'settings.private.hipaa.encryption.algorithm', 'aes-256-gcm');
    const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
    
    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  // Advanced encryption (placeholder for HSM integration)
  advancedEncrypt: function(data) {
    // In production, this would integrate with HSM or KMS
    console.warn('Advanced encryption not implemented - falling back to AES');
    return this.aesEncrypt(data);
  },

  // Advanced decryption (placeholder for HSM integration)
  advancedDecrypt: function(data) {
    // In production, this would integrate with HSM or KMS
    console.warn('Advanced decryption not implemented - falling back to AES');
    return this.aesDecrypt(data);
  },

  // Encrypt specific fields in an audit event
  encryptAuditEvent: function(auditEvent) {
    const encryptedEvent = { ...auditEvent };
    const level = this.getEncryptionLevel();
    
    if (level === SecurityLevels.NONE) {
      return encryptedEvent;
    }
    
    // Fields to encrypt
    const sensitiveFields = ['patientName', 'userName', 'userEmail', 'metadata'];
    
    sensitiveFields.forEach(field => {
      if (encryptedEvent[field]) {
        encryptedEvent[field] = this.encryptSensitiveData(encryptedEvent[field]);
      }
    });
    
    // Mark as encrypted
    encryptedEvent.encryptionLevel = level;
    
    return encryptedEvent;
  },

  // Decrypt audit event fields
  decryptAuditEvent: function(encryptedEvent) {
    if (!encryptedEvent.encryptionLevel || encryptedEvent.encryptionLevel === SecurityLevels.NONE) {
      return encryptedEvent;
    }
    
    const decryptedEvent = { ...encryptedEvent };
    const sensitiveFields = ['patientName', 'userName', 'userEmail', 'metadata'];
    
    sensitiveFields.forEach(field => {
      if (decryptedEvent[field]) {
        const decrypted = this.decryptSensitiveData(
          decryptedEvent[field],
          encryptedEvent.encryptionLevel
        );
        
        // Parse JSON fields if needed
        if (field === 'metadata' && typeof decrypted === 'string') {
          try {
            decryptedEvent[field] = JSON.parse(decrypted);
          } catch (e) {
            decryptedEvent[field] = decrypted;
          }
        } else {
          decryptedEvent[field] = decrypted;
        }
      }
    });
    
    return decryptedEvent;
  },

  // Generate cryptographic signature for audit event
  generateSignature: function(auditEvent) {
    const key = this.getEncryptionKey();
    const dataToSign = JSON.stringify({
      eventType: auditEvent.eventType,
      eventDate: auditEvent.eventDate,
      userId: auditEvent.userId,
      resourceId: auditEvent.resourceId,
      patientId: auditEvent.patientId
    });
    
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(dataToSign);
    return hmac.digest('hex');
  },

  // Verify audit event signature
  verifySignature: function(auditEvent, signature) {
    const expectedSignature = this.generateSignature(auditEvent);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  },

  // Key rotation check
  shouldRotateKey: function() {
    const lastRotation = get(Meteor, 'settings.private.hipaa.encryption.lastKeyRotation');
    if (!lastRotation) {
      return true;
    }
    
    const rotationDays = get(Meteor, 'settings.private.hipaa.encryption.keyRotationDays', 90);
    const daysSinceRotation = (new Date() - new Date(lastRotation)) / 1000 / 60 / 60 / 24;
    
    return daysSinceRotation >= rotationDays;
  }
};
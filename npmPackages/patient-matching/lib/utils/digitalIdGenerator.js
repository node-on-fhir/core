// packages/patient-matching/lib/utils/digitalIdGenerator.js
import { Random } from 'meteor/random';
import crypto from 'crypto';
import moment from 'moment';

// Digital ID Generator utilities
export const DigitalIdGenerator = {
  // Generate a unique patient identifier
  generatePatientId: function(options = {}) {
    const prefix = options.prefix || 'PAT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Random.id(6).toUpperCase();
    
    return `${prefix}-${timestamp}-${random}`;
  },
  
  // Generate a secure hash for identity verification
  generateIdentityHash: function(patientData) {
    const components = [
      patientData.birthDate,
      patientData.gender,
      patientData.name?.[0]?.family,
      patientData.name?.[0]?.given?.join(' ')
    ].filter(Boolean).join('|');
    
    return crypto
      .createHash('sha256')
      .update(components)
      .digest('hex');
  },
  
  // Generate a QR code payload for identity verification
  generateQRPayload: function(patient, options = {}) {
    const payload = {
      version: '1.0',
      type: 'patient-identity',
      timestamp: new Date().toISOString(),
      data: {
        id: patient.id,
        identifier: patient.identifier?.[0],
        name: {
          family: patient.name?.[0]?.family,
          given: patient.name?.[0]?.given?.[0]
        },
        birthDate: patient.birthDate,
        gender: patient.gender
      }
    };
    
    if (options.includePhoto && patient.photo?.[0]) {
      payload.data.photoHash = crypto
        .createHash('md5')
        .update(patient.photo[0].data || patient.photo[0].url)
        .digest('hex');
    }
    
    // Sign the payload
    if (options.privateKey) {
      const sign = crypto.createSign('SHA256');
      sign.update(JSON.stringify(payload.data));
      payload.signature = sign.sign(options.privateKey, 'hex');
    }
    
    return JSON.stringify(payload);
  },
  
  // Generate temporary access code
  generateAccessCode: function(options = {}) {
    const length = options.length || 6;
    const chars = options.alphanumeric 
      ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      : '0123456789';
    
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return code;
  },
  
  // Generate verification token
  generateVerificationToken: function(patientId, purpose = 'identity-verification') {
    const payload = {
      patientId,
      purpose,
      timestamp: Date.now(),
      nonce: Random.id()
    };
    
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    const hash = crypto
      .createHash('sha256')
      .update(token + (process.env.TOKEN_SECRET || 'default-secret'))
      .digest('hex')
      .substring(0, 8);
    
    return `${token}.${hash}`;
  },
  
  // Verify token
  verifyToken: function(token, maxAge = 3600000) { // 1 hour default
    try {
      const [payload, hash] = token.split('.');
      
      // Verify hash
      const expectedHash = crypto
        .createHash('sha256')
        .update(payload + (process.env.TOKEN_SECRET || 'default-secret'))
        .digest('hex')
        .substring(0, 8);
      
      if (hash !== expectedHash) {
        return { isValid: false, error: 'Invalid token signature' };
      }
      
      // Decode and verify payload
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      if (Date.now() - decoded.timestamp > maxAge) {
        return { isValid: false, error: 'Token expired' };
      }
      
      return { isValid: true, payload: decoded };
    } catch (error) {
      return { isValid: false, error: 'Invalid token format' };
    }
  },
  
  // Generate match request ID
  generateMatchRequestId: function() {
    const timestamp = Date.now().toString(36);
    const random = Random.id(8);
    return `MATCH-${timestamp}-${random}`.toUpperCase();
  },
  
  // Generate session identifier for identity proofing
  generateSessionId: function(userId, purpose = 'identity-proofing') {
    const data = {
      userId,
      purpose,
      timestamp: Date.now(),
      expires: moment().add(30, 'minutes').valueOf()
    };
    
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
    return `SID-${encoded}`;
  },
  
  // Parse session ID
  parseSessionId: function(sessionId) {
    try {
      if (!sessionId.startsWith('SID-')) {
        return { isValid: false, error: 'Invalid session ID format' };
      }
      
      const encoded = sessionId.substring(4);
      const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString());
      
      if (Date.now() > decoded.expires) {
        return { isValid: false, error: 'Session expired' };
      }
      
      return { isValid: true, data: decoded };
    } catch (error) {
      return { isValid: false, error: 'Invalid session ID' };
    }
  },
  
  // Generate biometric template ID
  generateBiometricId: function(biometricType, patientId) {
    const hash = crypto
      .createHash('sha256')
      .update(`${biometricType}-${patientId}-${Date.now()}`)
      .digest('hex');
    
    return `BIO-${biometricType.toUpperCase()}-${hash.substring(0, 12)}`;
  }
};

export default DigitalIdGenerator;
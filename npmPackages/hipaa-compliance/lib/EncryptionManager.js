// npmPackages/hipaa-compliance/lib/EncryptionManager.js
//
// Audit-event encryption + tamper evidence, keyed to the installation's UDAP
// x509 material (settings.private.x509.privateKey — the same key UdapMethods
// uses for client-assertion JWTs). One key-management surface per install:
//
// - keyId          = SHA-256 thumbprint of the key's SPKI public part
// - signature      = RSA-SHA256 over a canonical subset of the FHIR event,
//                    verifiable against the installation's certificate
// - field encrypt  = per-field random AES-256-GCM data key, wrapped with the
//                    RSA public key (OAEP). Envelope v2 is self-describing:
//                    {v:2, keyId, alg, wrappedKey, iv, tag, data}
//
// Rotation never mutates stored events: rotating the x509 key changes the
// active keyId for NEW events; old events decrypt/verify forever via the
// keyId embedded in their envelopes/extensions, resolved against
// settings.private.x509.previousKeys ({thumbprint: PEM}).
//
// SERVER-ONLY: imports node crypto. The client entry must not export this.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import crypto from 'crypto';
import { SecurityLevels } from './Constants';
import { EXTENSION_URLS, getExtensionValue, setExtensionValue } from './AuditEventMapping';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

const ENVELOPE_VERSION = 2;

// FHIR paths holding person-identifying display values — the encrypted
// field set. References (User/x, Patient/y) stay plaintext so indexes and
// the signature canonical subset keep working.
const ENCRYPTED_PATHS = [
  'agent[0].who.display',
  'agent[0].altId',
  'patient[0].display'
];

let warnedAdvancedAlias = false;
let erroredBadLevel = false;

export const EncryptionManager = {
  // ---------------------------------------------------------------------
  // Key material (UDAP x509)

  // Effective encryption level: 'none' | 'aes'. 'advanced' is accepted as an
  // alias of 'aes'; 'basic' (the old Base64 mode) and unknown values provide
  // no protection and are treated as 'none' — loudly.
  getEncryptionLevel: function() {
    const configured = get(Meteor, 'settings.private.hipaa.security.encryptionLevel', SecurityLevels.NONE);

    if (configured === SecurityLevels.NONE || configured === SecurityLevels.AES) {
      return configured;
    }
    if (configured === SecurityLevels.ADVANCED) {
      if (!warnedAdvancedAlias) {
        warnedAdvancedAlias = true;
        log.warn('encryptionLevel "advanced" is an alias of "aes" — update settings.private.hipaa.security.encryptionLevel');
      }
      return SecurityLevels.AES;
    }
    if (!erroredBadLevel) {
      erroredBadLevel = true;
      log.error('Unsupported encryptionLevel — treating as "none" (base64 "basic" mode provided no protection and was removed)', { configured });
    }
    return SecurityLevels.NONE;
  },

  hasSigningKey: function() {
    return !!get(Meteor, 'settings.private.x509.privateKey');
  },

  // The active UDAP private key (PEM). Fail-closed: throws when unset.
  getSigningKeyPem: function() {
    const pem = get(Meteor, 'settings.private.x509.privateKey');
    if (!pem) {
      throw new Meteor.Error('encryption-key-missing',
        'No x509 private key configured — set settings.private.x509.privateKey (the UDAP key)');
    }
    return pem;
  },

  // SHA-256 thumbprint of a private key's SPKI public part
  computeKeyId: function(privateKeyPem) {
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const publicDer = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'der' });
    return crypto.createHash('sha256').update(publicDer).digest('hex');
  },

  getActiveKeyId: function() {
    return this.computeKeyId(this.getSigningKeyPem());
  },

  // Resolve a private key PEM by keyId: the active key, or a retained
  // historical key from settings.private.x509.previousKeys.
  resolvePrivateKeyById: function(keyId) {
    if (this.hasSigningKey() && this.getActiveKeyId() === keyId) {
      return this.getSigningKeyPem();
    }
    const previousKeys = get(Meteor, 'settings.private.x509.previousKeys', {});
    const pem = get(previousKeys, keyId);
    if (pem) {
      return pem;
    }
    throw new Meteor.Error('encryption-key-missing',
      'No x509 key found for keyId ' + keyId + ' — check settings.private.x509.previousKeys');
  },

  resolvePublicKeyById: function(keyId) {
    return crypto.createPublicKey(crypto.createPrivateKey(this.resolvePrivateKeyById(keyId)));
  },

  // ---------------------------------------------------------------------
  // Envelope encryption (wrapped-DEK, AES-256-GCM)

  isEnvelope: function(value) {
    if (typeof value !== 'string' || value[0] !== '{') {
      return false;
    }
    try {
      return get(JSON.parse(value), 'v') === ENVELOPE_VERSION;
    } catch (e) {
      return false;
    }
  },

  encryptValue: function(plaintext) {
    const publicKey = crypto.createPublicKey(crypto.createPrivateKey(this.getSigningKeyPem()));
    const dek = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const wrappedKey = crypto.publicEncrypt({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, dek);

    return JSON.stringify({
      v: ENVELOPE_VERSION,
      keyId: this.getActiveKeyId(),
      alg: 'aes-256-gcm',
      wrappedKey: wrappedKey.toString('hex'),
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      data: encrypted
    });
  },

  decryptValue: function(envelopeJson) {
    if (!this.isEnvelope(envelopeJson)) {
      return envelopeJson;
    }
    const envelope = JSON.parse(envelopeJson);
    const privateKeyPem = this.resolvePrivateKeyById(get(envelope, 'keyId'));

    const dek = crypto.privateDecrypt({
      key: crypto.createPrivateKey(privateKeyPem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    }, Buffer.from(get(envelope, 'wrappedKey', ''), 'hex'));

    const decipher = crypto.createDecipheriv(
      get(envelope, 'alg', 'aes-256-gcm'),
      dek,
      Buffer.from(get(envelope, 'iv', ''), 'hex')
    );
    decipher.setAuthTag(Buffer.from(get(envelope, 'tag', ''), 'hex'));

    let decrypted = decipher.update(get(envelope, 'data', ''), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  // Generic string encryption for exports (same envelope format)
  encryptSensitiveData: function(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return this.encryptValue(dataString);
  },

  decryptSensitiveData: function(encryptedData) {
    if (!encryptedData) {
      return null;
    }
    try {
      return this.decryptValue(encryptedData);
    } catch (error) {
      log.error('Decryption error', { error: error && error.message });
      return null;
    }
  },

  // ---------------------------------------------------------------------
  // FHIR AuditEvent field encryption

  encryptAuditEvent: function(fhirEvent) {
    const level = this.getEncryptionLevel();
    if (level === SecurityLevels.NONE) {
      return fhirEvent;
    }

    const encryptedEvent = cloneEvent(fhirEvent);
    const self = this;

    ENCRYPTED_PATHS.forEach(function(path) {
      const value = get(encryptedEvent, path);
      if (value) {
        // lodash.set with bracket paths
        setPath(encryptedEvent, path, self.encryptValue(value));
      }
    });

    // Patient entity display + metadata details
    const entities = get(encryptedEvent, 'entity', []);
    if (Array.isArray(entities)) {
      entities.forEach(function(entity) {
        const whatDisplay = get(entity, 'what.display');
        if (whatDisplay && String(get(entity, 'what.reference', '')).startsWith('Patient/')) {
          entity.what.display = self.encryptValue(whatDisplay);
        }
        const details = get(entity, 'detail', []);
        if (Array.isArray(details)) {
          details.forEach(function(detail) {
            if (get(detail, 'type') === 'metadata' && get(detail, 'valueString')) {
              detail.valueString = self.encryptValue(detail.valueString);
            }
          });
        }
      });
    }

    setExtensionValue(encryptedEvent, EXTENSION_URLS.ENCRYPTION_LEVEL, level);
    return encryptedEvent;
  },

  decryptAuditEvent: function(fhirEvent) {
    const storedLevel = getExtensionValue(fhirEvent, EXTENSION_URLS.ENCRYPTION_LEVEL);
    if (!storedLevel || storedLevel === SecurityLevels.NONE) {
      return fhirEvent;
    }

    const decryptedEvent = cloneEvent(fhirEvent);
    const self = this;

    ENCRYPTED_PATHS.forEach(function(path) {
      const value = get(decryptedEvent, path);
      if (value && self.isEnvelope(value)) {
        try {
          setPath(decryptedEvent, path, self.decryptValue(value));
        } catch (error) {
          log.error('Failed to decrypt audit field', { path, error: error && error.message });
        }
      }
    });

    const entities = get(decryptedEvent, 'entity', []);
    if (Array.isArray(entities)) {
      entities.forEach(function(entity) {
        const whatDisplay = get(entity, 'what.display');
        if (whatDisplay && self.isEnvelope(whatDisplay)) {
          try {
            entity.what.display = self.decryptValue(whatDisplay);
          } catch (error) {
            log.error('Failed to decrypt entity display', { error: error && error.message });
          }
        }
        const details = get(entity, 'detail', []);
        if (Array.isArray(details)) {
          details.forEach(function(detail) {
            if (self.isEnvelope(get(detail, 'valueString'))) {
              try {
                detail.valueString = self.decryptValue(detail.valueString);
              } catch (error) {
                log.error('Failed to decrypt entity detail', { error: error && error.message });
              }
            }
          });
        }
      });
    }

    return decryptedEvent;
  },

  // ---------------------------------------------------------------------
  // Tamper-evident signatures (RSA-SHA256 with the UDAP key)

  // Canonical subset — plaintext-stable fields only, so integrity can be
  // verified without decrypting.
  canonicalSubset: function(fhirEvent) {
    const recorded = get(fhirEvent, 'recorded');
    return JSON.stringify({
      typeCode: get(fhirEvent, 'type.code', ''),
      action: get(fhirEvent, 'action', ''),
      recorded: recorded instanceof Date ? recorded.toISOString() : String(recorded || ''),
      agentWhoReference: get(fhirEvent, 'agent[0].who.reference', ''),
      patientReference: get(fhirEvent, 'patient[0].reference', ''),
      entityWhatReference: get(fhirEvent, 'entity[0].what.reference', '')
    });
  },

  signAuditEvent: function(fhirEvent) {
    const keyId = this.getActiveKeyId();
    const signature = crypto.sign(
      'sha256',
      Buffer.from(this.canonicalSubset(fhirEvent), 'utf8'),
      crypto.createPrivateKey(this.getSigningKeyPem())
    ).toString('base64');

    setExtensionValue(fhirEvent, EXTENSION_URLS.SIGNATURE, signature);
    setExtensionValue(fhirEvent, EXTENSION_URLS.KEY_ID, keyId);
    return fhirEvent;
  },

  verifySignature: function(fhirEvent) {
    const signature = getExtensionValue(fhirEvent, EXTENSION_URLS.SIGNATURE);
    const keyId = getExtensionValue(fhirEvent, EXTENSION_URLS.KEY_ID);
    if (!signature || !keyId) {
      return false;
    }

    try {
      return crypto.verify(
        'sha256',
        Buffer.from(this.canonicalSubset(fhirEvent), 'utf8'),
        this.resolvePublicKeyById(keyId),
        Buffer.from(signature, 'base64')
      );
    } catch (error) {
      log.error('Signature verification error', { keyId, error: error && error.message });
      return false;
    }
  },

  // The write-path stage HipaaLogger runs every event through: encrypt when
  // level is aes (throws encryption-key-missing when no key — startup
  // validation prevents that state), then sign when a key is present.
  // Signature is computed AFTER encryption so verification never requires
  // decryption.
  secureAuditEvent: function(fhirEvent) {
    let secured = fhirEvent;

    if (this.getEncryptionLevel() === SecurityLevels.AES) {
      secured = this.encryptAuditEvent(secured);
    }

    if (this.hasSigningKey()) {
      secured = this.signAuditEvent(secured);
    }

    return secured;
  },

  // Key rotation check (advisory)
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

// Deep clone that preserves the recorded Date (JSON round-trips stringify
// Dates, which would break the {recorded:-1} index range queries).
function cloneEvent(fhirEvent) {
  const cloned = JSON.parse(JSON.stringify(fhirEvent));
  if (get(fhirEvent, 'recorded') instanceof Date) {
    cloned.recorded = fhirEvent.recorded;
  }
  return cloned;
}

// lodash.set counterpart for the bracket paths used in ENCRYPTED_PATHS
function setPath(target, path, value) {
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cursor = target;
  for (let i = 0; i < segments.length - 1; i++) {
    if (cursor[segments[i]] === undefined || cursor[segments[i]] === null) {
      return;
    }
    cursor = cursor[segments[i]];
  }
  cursor[segments[segments.length - 1]] = value;
}

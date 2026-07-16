// tests/mocha/hipaaCompliance.test.js
//
// Server-side tests for @node-on-fhir/hipaa-compliance: FHIR AuditEvent
// mapping round-trips, UDAP x509 envelope encryption + signatures (including
// decrypt/verify after key rotation), fail-closed authorization, and the
// settings-gated AuditEvents immutability guard.

import assert from 'assert';
import { Meteor } from 'meteor/meteor';

if (Meteor.isServer) {
  const crypto = require('crypto');
  const { get, set } = require('lodash');

  const {
    buildFhirAuditEvent,
    flattenAuditEvent,
    buildAuditQuery,
    mapEventTypeToAction,
    EXTENSION_URLS,
    getExtensionValue
  } = require('@node-on-fhir/hipaa-compliance/lib/AuditEventMapping');
  const { EncryptionManager } = require('@node-on-fhir/hipaa-compliance/lib/EncryptionManager');
  const { SecurityValidators } = require('@node-on-fhir/hipaa-compliance/lib/SecurityValidators');

  // Registers auditEvents.* methods (immutability guard test)
  require('/imports/api/AuditEvents/AuditEvents');

  function generateKeyPem() {
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    return privateKey.export({ type: 'pkcs8', format: 'pem' });
  }

  const SAMPLE_FLAT_EVENT = {
    eventType: 'update',
    message: 'Updated Patients record',
    resourceType: 'Patient',
    resourceId: 'patient-123',
    collectionName: 'Patients',
    patientId: 'patient-123',
    patientName: 'Jane Doe',
    userId: 'user-abc',
    userName: 'dr.jones',
    userEmail: 'dr.jones@example.com',
    userRoles: ['clinician'],
    metadata: { fieldsModified: ['name'] }
  };

  describe('hipaa-compliance', function() {
    let savedPrivateSettings;

    before(function() {
      savedPrivateSettings = JSON.parse(JSON.stringify(Meteor.settings.private || {}));
    });

    afterEach(function() {
      Meteor.settings.private = JSON.parse(JSON.stringify(savedPrivateSettings));
    });

    describe('AuditEventMapping', function() {
      it('maps event types to FHIR action codes', function() {
        assert.strictEqual(mapEventTypeToAction('create'), 'C');
        assert.strictEqual(mapEventTypeToAction('view'), 'R');
        assert.strictEqual(mapEventTypeToAction('read'), 'R');
        assert.strictEqual(mapEventTypeToAction('export'), 'R');
        assert.strictEqual(mapEventTypeToAction('update'), 'U');
        assert.strictEqual(mapEventTypeToAction('delete'), 'D');
        assert.strictEqual(mapEventTypeToAction('login'), 'E');
        assert.strictEqual(mapEventTypeToAction('anything-else'), 'E');
      });

      it('builds a FHIR AuditEvent with required fields', function() {
        const fhirEvent = buildFhirAuditEvent(SAMPLE_FLAT_EVENT);

        assert.strictEqual(fhirEvent.resourceType, 'AuditEvent');
        assert.strictEqual(get(fhirEvent, 'type.code'), 'update');
        assert.strictEqual(fhirEvent.action, 'U');
        assert.ok(fhirEvent.recorded instanceof Date);
        assert.strictEqual(get(fhirEvent, 'agent[0].who.reference'), 'User/user-abc');
        assert.strictEqual(get(fhirEvent, 'agent[0].who.display'), 'dr.jones');
        assert.strictEqual(get(fhirEvent, 'agent[0].requestor'), true);
        assert.strictEqual(get(fhirEvent, 'patient[0].reference'), 'Patient/patient-123');
        assert.strictEqual(get(fhirEvent, 'entity[0].what.reference'), 'Patient/patient-123');
        assert.ok(get(fhirEvent, 'source.observer.display'));
      });

      it('round-trips flat -> FHIR -> flat', function() {
        const fhirEvent = buildFhirAuditEvent(SAMPLE_FLAT_EVENT);
        const flat = flattenAuditEvent(fhirEvent);

        assert.strictEqual(flat.eventType, 'update');
        assert.strictEqual(flat.action, 'U');
        assert.strictEqual(flat.userId, 'user-abc');
        assert.strictEqual(flat.userName, 'dr.jones');
        assert.strictEqual(flat.userEmail, 'dr.jones@example.com');
        assert.strictEqual(flat.patientId, 'patient-123');
        assert.strictEqual(flat.patientName, 'Jane Doe');
        assert.strictEqual(flat.collectionName, 'Patients');
        assert.strictEqual(flat.message, 'Updated Patients record');
        assert.deepStrictEqual(flat.metadata, { fieldsModified: ['name'] });
      });

      it('flattens core-writer events (no patient array, no details) without crashing', function() {
        const coreEvent = {
          _id: 'abc',
          resourceType: 'AuditEvent',
          type: { code: 'rest' },
          recorded: new Date(),
          agent: [{ who: { reference: 'User/u1', display: 'u1' }, requestor: true }]
        };
        const flat = flattenAuditEvent(coreEvent);
        assert.strictEqual(flat.eventType, 'rest');
        assert.strictEqual(flat.userId, 'u1');
        assert.strictEqual(flat.patientId, '');
      });

      it('builds FHIR-path queries', function() {
        const query = buildAuditQuery({
          eventType: 'view',
          userId: 'user-abc',
          patientId: 'patient-123',
          collectionName: 'Patients',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-02-01')
        });

        assert.strictEqual(query['type.code'], 'view');
        assert.strictEqual(query['agent.who.reference'], 'User/user-abc');
        assert.strictEqual(query['patient.reference'], 'Patient/patient-123');
        assert.deepStrictEqual(query['entity.detail'],
          { $elemMatch: { type: 'collectionName', valueString: 'Patients' } });
        assert.ok(query.recorded.$gte instanceof Date);
        assert.ok(query.recorded.$lte instanceof Date);
      });
    });

    describe('EncryptionManager (UDAP x509)', function() {
      it('getSigningKeyPem throws when no x509 key is configured', function() {
        set(Meteor.settings, 'private.x509.privateKey', '');
        assert.throws(function() {
          EncryptionManager.getSigningKeyPem();
        }, /encryption-key-missing/);
      });

      it('treats the removed base64 "basic" level as none', function() {
        set(Meteor.settings, 'private.hipaa.security.encryptionLevel', 'basic');
        assert.strictEqual(EncryptionManager.getEncryptionLevel(), 'none');
      });

      it('encrypts and decrypts an envelope with the active key', function() {
        set(Meteor.settings, 'private.x509.privateKey', generateKeyPem());

        const envelope = EncryptionManager.encryptValue('Jane Doe');
        assert.ok(EncryptionManager.isEnvelope(envelope));
        const parsed = JSON.parse(envelope);
        assert.strictEqual(parsed.v, 2);
        assert.strictEqual(parsed.keyId, EncryptionManager.getActiveKeyId());
        assert.ok(parsed.wrappedKey);
        assert.notStrictEqual(parsed.data, 'Jane Doe');

        assert.strictEqual(EncryptionManager.decryptValue(envelope), 'Jane Doe');
      });

      it('decrypts old records after key rotation via previousKeys', function() {
        const oldKeyPem = generateKeyPem();
        set(Meteor.settings, 'private.x509.privateKey', oldKeyPem);
        const oldKeyId = EncryptionManager.getActiveKeyId();
        const envelope = EncryptionManager.encryptValue('historic value');

        // Rotate: new active key, old key retained under previousKeys
        set(Meteor.settings, 'private.x509.privateKey', generateKeyPem());
        set(Meteor.settings, 'private.x509.previousKeys', { [oldKeyId]: oldKeyPem });

        assert.notStrictEqual(EncryptionManager.getActiveKeyId(), oldKeyId);
        assert.strictEqual(EncryptionManager.decryptValue(envelope), 'historic value');
      });

      it('encrypts audit event fields and decrypts them for display', function() {
        set(Meteor.settings, 'private.x509.privateKey', generateKeyPem());
        set(Meteor.settings, 'private.hipaa.security.encryptionLevel', 'aes');

        const fhirEvent = buildFhirAuditEvent(SAMPLE_FLAT_EVENT);
        const encrypted = EncryptionManager.encryptAuditEvent(fhirEvent);

        // Displays are encrypted; references stay plaintext
        assert.ok(EncryptionManager.isEnvelope(get(encrypted, 'agent[0].who.display')));
        assert.ok(EncryptionManager.isEnvelope(get(encrypted, 'patient[0].display')));
        assert.strictEqual(get(encrypted, 'agent[0].who.reference'), 'User/user-abc');
        assert.strictEqual(getExtensionValue(encrypted, EXTENSION_URLS.ENCRYPTION_LEVEL), 'aes');
        // recorded stays a Date through the clone
        assert.ok(encrypted.recorded instanceof Date);

        const decrypted = EncryptionManager.decryptAuditEvent(encrypted);
        assert.strictEqual(get(decrypted, 'agent[0].who.display'), 'dr.jones');
        assert.strictEqual(get(decrypted, 'patient[0].display'), 'Jane Doe');
      });

      it('signs events and detects tampering', function() {
        set(Meteor.settings, 'private.x509.privateKey', generateKeyPem());

        const fhirEvent = buildFhirAuditEvent(SAMPLE_FLAT_EVENT);
        const signed = EncryptionManager.signAuditEvent(fhirEvent);

        assert.ok(getExtensionValue(signed, EXTENSION_URLS.SIGNATURE));
        assert.strictEqual(getExtensionValue(signed, EXTENSION_URLS.KEY_ID), EncryptionManager.getActiveKeyId());
        assert.strictEqual(EncryptionManager.verifySignature(signed), true);

        // Tamper with a canonical field
        const tampered = JSON.parse(JSON.stringify(signed));
        tampered.agent[0].who.reference = 'User/attacker';
        assert.strictEqual(EncryptionManager.verifySignature(tampered), false);
      });

      it('verifies signatures made with a rotated-out key', function() {
        const oldKeyPem = generateKeyPem();
        set(Meteor.settings, 'private.x509.privateKey', oldKeyPem);
        const oldKeyId = EncryptionManager.getActiveKeyId();
        const signed = EncryptionManager.signAuditEvent(buildFhirAuditEvent(SAMPLE_FLAT_EVENT));

        set(Meteor.settings, 'private.x509.privateKey', generateKeyPem());
        set(Meteor.settings, 'private.x509.previousKeys', { [oldKeyId]: oldKeyPem });

        assert.strictEqual(EncryptionManager.verifySignature(signed), true);
      });
    });

    describe('SecurityValidators (fail-closed)', function() {
      it('denies without a userId', async function() {
        assert.strictEqual(await SecurityValidators.canViewAuditLog(null), false);
        assert.strictEqual(await SecurityValidators.canViewAuditLog(undefined), false);
        assert.strictEqual(await SecurityValidators.canExportAuditData(null), false);
        assert.strictEqual(await SecurityValidators.canModifyAuditSettings(null), false);
      });

      it('denies a user with no role data', async function() {
        const userId = await Meteor.users.insertAsync({ username: 'hipaa-test-noroles' });
        try {
          assert.strictEqual(await SecurityValidators.canViewAuditLog(userId), false);
          assert.strictEqual(await SecurityValidators.canViewPatientAudits(userId, 'p1'), false);
        } finally {
          await Meteor.users.removeAsync({ _id: userId });
        }
      });

      it('grants via the user.roles array', async function() {
        const userId = await Meteor.users.insertAsync({
          username: 'hipaa-test-admin',
          roles: ['admin']
        });
        try {
          assert.strictEqual(await SecurityValidators.canViewAuditLog(userId), true);
          assert.strictEqual(await SecurityValidators.canExportAuditData(userId), true);
          assert.strictEqual(await SecurityValidators.canViewPatientAudits(userId, 'p1'), true);
        } finally {
          await Meteor.users.removeAsync({ _id: userId });
        }
      });

      it('returns a boolean (not a truthy Promise) from canViewPatientAudits', async function() {
        const userId = await Meteor.users.insertAsync({
          username: 'hipaa-test-patient',
          roles: ['patient'],
          profile: { patientId: 'p-self' }
        });
        try {
          const own = await SecurityValidators.canViewPatientAudits(userId, 'p-self');
          const other = await SecurityValidators.canViewPatientAudits(userId, 'p-other');
          assert.strictEqual(typeof own, 'boolean');
          assert.strictEqual(own, true);
          assert.strictEqual(other, false);
        } finally {
          await Meteor.users.removeAsync({ _id: userId });
        }
      });
    });

    describe('AuditEvents immutability guard', function() {
      it('refuses auditEvents.update when immutable is on', async function() {
        set(Meteor.settings, 'private.hipaa.audit.immutable', true);
        await assert.rejects(
          Meteor.callAsync('auditEvents.update', 'any-id', { outcomeDesc: 'tampered' }),
          function(error) {
            return error.error === 'feature-disabled';
          }
        );
      });

      it('refuses auditEvents.remove when immutable is on', async function() {
        set(Meteor.settings, 'private.hipaa.audit.immutable', true);
        await assert.rejects(
          Meteor.callAsync('auditEvents.remove', 'any-id'),
          function(error) {
            return error.error === 'feature-disabled';
          }
        );
      });
    });
  });
}

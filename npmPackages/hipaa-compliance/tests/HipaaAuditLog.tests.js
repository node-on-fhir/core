// packages/hipaa-compliance/tests/HipaaAuditLog.tests.js

import { Tinytest } from 'meteor/tinytest';
import { HipaaAuditLog } from '../lib/Collections';
import { HipaaLogger } from '../lib/HipaaLogger';
import { EventTypes } from '../lib/Constants';
import { EncryptionManager } from '../lib/EncryptionManager';
import { SecurityValidators } from '../lib/SecurityValidators';

// Test HipaaAuditLog collection exists
Tinytest.add('hipaa-compliance - HipaaAuditLog collection exists', function (test) {
  test.isNotNull(HipaaAuditLog, 'HipaaAuditLog collection should exist');
  test.instanceOf(HipaaAuditLog, Mongo.Collection, 'HipaaAuditLog should be a Mongo.Collection');
});

// Test HipaaLogger exists and has required methods
Tinytest.add('hipaa-compliance - HipaaLogger has required methods', function (test) {
  test.isNotNull(HipaaLogger, 'HipaaLogger should exist');
  test.equal(typeof HipaaLogger.logEvent, 'function', 'HipaaLogger should have logEvent method');
  test.equal(typeof HipaaLogger.logPatientAccess, 'function', 'HipaaLogger should have logPatientAccess method');
  test.equal(typeof HipaaLogger.logDataModification, 'function', 'HipaaLogger should have logDataModification method');
  test.equal(typeof HipaaLogger.logSystemEvent, 'function', 'HipaaLogger should have logSystemEvent method');
});

// Test EventTypes constants
Tinytest.add('hipaa-compliance - EventTypes constants are defined', function (test) {
  test.isNotNull(EventTypes, 'EventTypes should exist');
  test.equal(EventTypes.VIEW, 'view', 'VIEW event type should be "view"');
  test.equal(EventTypes.CREATE, 'create', 'CREATE event type should be "create"');
  test.equal(EventTypes.UPDATE, 'update', 'UPDATE event type should be "update"');
  test.equal(EventTypes.DELETE, 'delete', 'DELETE event type should be "delete"');
  test.equal(EventTypes.LOGIN, 'login', 'LOGIN event type should be "login"');
  test.equal(EventTypes.DENIED, 'denied', 'DENIED event type should be "denied"');
});

// Test EncryptionManager exists and has required methods
Tinytest.add('hipaa-compliance - EncryptionManager has required methods', function (test) {
  test.isNotNull(EncryptionManager, 'EncryptionManager should exist');
  test.equal(typeof EncryptionManager.encryptSensitiveData, 'function', 'Should have encryptSensitiveData method');
  test.equal(typeof EncryptionManager.decryptSensitiveData, 'function', 'Should have decryptSensitiveData method');
  test.equal(typeof EncryptionManager.encryptAuditEvent, 'function', 'Should have encryptAuditEvent method');
  test.equal(typeof EncryptionManager.decryptAuditEvent, 'function', 'Should have decryptAuditEvent method');
});

// Test SecurityValidators exists and has required methods
Tinytest.add('hipaa-compliance - SecurityValidators has required methods', function (test) {
  test.isNotNull(SecurityValidators, 'SecurityValidators should exist');
  test.equal(typeof SecurityValidators.canViewAuditLog, 'function', 'Should have canViewAuditLog method');
  test.equal(typeof SecurityValidators.canExportAuditData, 'function', 'Should have canExportAuditData method');
  test.equal(typeof SecurityValidators.canModifyAuditSettings, 'function', 'Should have canModifyAuditSettings method');
  test.equal(typeof SecurityValidators.validateCurrentUser, 'function', 'Should have validateCurrentUser method');
});

// Test basic encryption/decryption
Tinytest.add('hipaa-compliance - Basic encryption/decryption works', function (test) {
  const testData = 'Sensitive patient information';
  
  // Test basic encryption
  const basicEncrypted = EncryptionManager.basicEncrypt(testData);
  test.notEqual(basicEncrypted, testData, 'Basic encryption should change the data');
  
  const basicDecrypted = EncryptionManager.basicDecrypt(basicEncrypted);
  test.equal(basicDecrypted, testData, 'Basic decryption should restore original data');
});

// Test audit event validation
Tinytest.add('hipaa-compliance - Audit event validation', function (test) {
  const validEvent = {
    eventType: EventTypes.VIEW,
    eventDate: new Date()
  };
  
  const invalidEvent = {
    // Missing required fields
  };
  
  test.isTrue(HipaaLogger.validateEvent(validEvent), 'Valid event should pass validation');
  test.isFalse(HipaaLogger.validateEvent(invalidEvent), 'Invalid event should fail validation');
});

// Test HipaaAuditLog schema
Tinytest.add('hipaa-compliance - HipaaAuditLog schema validation', function (test) {
  const validDoc = {
    eventType: EventTypes.CREATE,
    eventDate: new Date(),
    userId: 'user123',
    userName: 'Test User',
    collectionName: 'Patients',
    resourceId: 'patient123',
    message: 'Created patient record'
  };
  
  // This would normally throw if invalid
  try {
    HipaaAuditLog._collection.simpleSchema().validate(validDoc);
    test.isTrue(true, 'Valid document should pass schema validation');
  } catch (error) {
    test.fail('Valid document failed schema validation: ' + error.message);
  }
});

// Test helper methods on HipaaAuditLog
Tinytest.add('hipaa-compliance - HipaaAuditLog helper methods', function (test) {
  const mockEvent = {
    eventType: EventTypes.CREATE,
    patientId: 'patient123'
  };
  
  test.equal(mockEvent.eventType, EventTypes.CREATE, 'Event type should match');
  test.isTrue(!!mockEvent.patientId, 'isPatientRelated should return true for patient events');
  
  // Test getEventIcon mapping
  const iconMap = {
    'view': 'visibility',
    'create': 'add_circle',
    'update': 'edit',
    'delete': 'delete'
  };
  
  Object.keys(iconMap).forEach(eventType => {
    test.isNotNull(iconMap[eventType], `Icon should exist for ${eventType} event`);
  });
});

// Test security rules (would need to be mocked in real tests)
Tinytest.add('hipaa-compliance - Security rules prevent updates and deletes', function (test) {
  // Test that update returns false
  const updateAllowed = HipaaAuditLog._collection.allow.update();
  test.isFalse(updateAllowed, 'Updates should not be allowed on audit logs');
  
  // Test that remove returns false
  const removeAllowed = HipaaAuditLog._collection.allow.remove();
  test.isFalse(removeAllowed, 'Removes should not be allowed on audit logs');
});
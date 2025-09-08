// packages/smart-web-messaging/tests/client/MessageHandler.tests.js

import { Tinytest } from 'meteor/tinytest';

Tinytest.add('SmartWebMessaging - MessageHandler - Initialize', function(test) {
  // Test initialization
  MessageHandler.initialize({
    messagingHandle: 'test-handle',
    origin: 'https://test.example.com'
  });
  
  test.equal(MessageHandler.messagingHandle, 'test-handle');
  test.equal(MessageHandler.authorizedOrigin, 'https://test.example.com');
});

Tinytest.add('SmartWebMessaging - MessageTypes - Validation', function(test) {
  // Test valid message types
  test.isTrue(MessageTypes.isValid('status.handshake'));
  test.isTrue(MessageTypes.isValid('ui.done'));
  test.isTrue(MessageTypes.isValid('scratchpad.create'));
  test.isTrue(MessageTypes.isValid('fhir.http'));
  
  // Test invalid message types
  test.isFalse(MessageTypes.isValid('invalid.type'));
  test.isFalse(MessageTypes.isValid(''));
  test.isFalse(MessageTypes.isValid(null));
});

Tinytest.add('SmartWebMessaging - MessageTypes - Parse', function(test) {
  // Test category parsing
  test.equal(MessageTypes.getCategory('status.handshake'), 'status');
  test.equal(MessageTypes.getCategory('ui.done'), 'ui');
  test.equal(MessageTypes.getCategory('scratchpad.create'), 'scratchpad');
  
  // Test action parsing
  test.equal(MessageTypes.getAction('status.handshake'), 'handshake');
  test.equal(MessageTypes.getAction('ui.done'), 'done');
  test.equal(MessageTypes.getAction('scratchpad.create'), 'create');
});

Tinytest.add('SmartWebMessaging - Activities - Validation', function(test) {
  // Test valid activities
  test.isTrue(Activities.isValid('appointment-book'));
  test.isTrue(Activities.isValid('order-review'));
  test.isTrue(Activities.isValid('problem-review'));
  
  // Test invalid activities
  test.isFalse(Activities.isValid('invalid-activity'));
  test.isFalse(Activities.isValid(''));
});

Tinytest.add('SmartWebMessaging - Activities - Resource Acceptance', function(test) {
  // Test appointment-book accepts Bundle
  const appointmentBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [{
      resource: {
        resourceType: 'Appointment',
        status: 'proposed'
      }
    }]
  };
  
  test.isTrue(Activities.acceptsResource('appointment-book', appointmentBundle));
  
  // Test wrong resource type
  const patient = {
    resourceType: 'Patient',
    name: [{ family: 'Test' }]
  };
  
  test.isFalse(Activities.acceptsResource('appointment-book', patient));
});

Tinytest.add('SmartWebMessaging - MessageValidator - Valid Message', function(test) {
  const validMessage = {
    messagingHandle: 'test-handle',
    messageId: 'msg-123',
    messageType: 'status.handshake',
    payload: {
      smart_web_messaging_handle: 'handle',
      smart_web_messaging_origin: 'https://example.com'
    }
  };
  
  const result = MessageValidator.validateMessage(validMessage);
  test.isTrue(result.valid);
  test.isUndefined(result.error);
});

Tinytest.add('SmartWebMessaging - MessageValidator - Invalid Message', function(test) {
  // Missing required fields
  const invalidMessage = {
    messageType: 'status.handshake'
  };
  
  const result = MessageValidator.validateMessage(invalidMessage);
  test.isFalse(result.valid);
  test.isNotUndefined(result.error);
});

Tinytest.add('SmartWebMessaging - OriginChecker - Parse Origin', function(test) {
  // Test URL parsing
  test.equal(
    OriginChecker.parseOrigin('https://example.com:8443/path'),
    'https://example.com:8443'
  );
  
  test.equal(
    OriginChecker.parseOrigin('http://localhost:3000'),
    'http://localhost:3000'
  );
  
  // Test invalid URL
  test.isNull(OriginChecker.parseOrigin('not-a-url'));
});

Tinytest.add('SmartWebMessaging - OriginChecker - Wildcard Matching', function(test) {
  const allowedOrigins = [
    'https://exact.example.com',
    'https://*.wildcard.com',
    'http://localhost:*'
  ];
  
  // Test exact match
  test.isTrue(OriginChecker.isOriginAllowed('https://exact.example.com', allowedOrigins));
  
  // Test wildcard subdomain
  test.isTrue(OriginChecker.isOriginAllowed('https://app.wildcard.com', allowedOrigins));
  test.isTrue(OriginChecker.isOriginAllowed('https://test.wildcard.com', allowedOrigins));
  
  // Test wildcard port
  test.isTrue(OriginChecker.isOriginAllowed('http://localhost:3000', allowedOrigins));
  test.isTrue(OriginChecker.isOriginAllowed('http://localhost:4000', allowedOrigins));
  
  // Test non-matching
  test.isFalse(OriginChecker.isOriginAllowed('https://other.com', allowedOrigins));
});

Tinytest.add('SmartWebMessaging - Create Message', function(test) {
  const message = SmartWebMessaging.createMessage(
    'ui.done',
    { status: 'completed' },
    'test-handle'
  );
  
  test.equal(message.messageType, 'ui.done');
  test.equal(message.messagingHandle, 'test-handle');
  test.equal(message.payload.status, 'completed');
  test.isNotUndefined(message.messageId);
});

Tinytest.add('SmartWebMessaging - Create Response', function(test) {
  const response = SmartWebMessaging.createResponse(
    'original-msg-id',
    { result: 'success' },
    false
  );
  
  test.equal(response.responseToMessageId, 'original-msg-id');
  test.equal(response.payload.result, 'success');
  test.isNotUndefined(response.messageId);
  test.isUndefined(response.additionalResponsesExpected);
});
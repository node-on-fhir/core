// packages/smart-web-messaging/lib/schemas/MessageSchema.js

import SimpleSchema from 'simpl-schema';

// simpl-schema v3 removed the `SimpleSchema.RegEx` static this package was written
// against (v2). URL_REGEX is the canonical URL pattern RegEx.Url provided.
const URL_REGEX = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[a-z¡-￿0-9]-*)*[a-z¡-￿0-9]+)(?:\.(?:[a-z¡-￿0-9]-*)*[a-z¡-￿0-9]+)*(?:\.(?:[a-z¡-￿]{2,}))\.?(?::\d{2,5})?(?:[/?#]\S*)?$/i;

/**
 * Schema for SMART Web Messaging message structure
 * Based on the SMART Web Messaging IG specification
 */

// Base message schema (common fields)
const BaseMessageSchema = new SimpleSchema({
  messagingHandle: {
    type: String,
    optional: false,
    label: 'Messaging Handle',
    max: 200
  },
  messageId: {
    type: String,
    optional: false,
    label: 'Message ID',
    max: 200
  },
  messageType: {
    type: String,
    optional: false,
    label: 'Message Type',
    custom: function() {
      if (!MessageTypes.isValid(this.value)) {
        return 'invalidMessageType';
      }
    }
  },
  payload: {
    type: Object,
    optional: true,
    label: 'Message Payload',
    blackbox: true
  }
});

// Response message schema
const ResponseMessageSchema = new SimpleSchema({
  messageId: {
    type: String,
    optional: false,
    label: 'Message ID',
    max: 200
  },
  responseToMessageId: {
    type: String,
    optional: false,
    label: 'Response To Message ID',
    max: 200
  },
  payload: {
    type: Object,
    optional: true,
    label: 'Response Payload',
    blackbox: true
  },
  additionalResponsesExpected: {
    type: Boolean,
    optional: true,
    label: 'Additional Responses Expected',
    defaultValue: false
  }
});

// Specific payload schemas for different message types

// Status handshake payload
const StatusHandshakePayloadSchema = new SimpleSchema({
  'smart_web_messaging_handle': {
    type: String,
    optional: false
  },
  'smart_web_messaging_origin': {
    type: String,
    optional: false,
    regEx: URL_REGEX
  }
});

// UI Launch Activity payload
const UILaunchActivityPayloadSchema = new SimpleSchema({
  activityType: {
    type: String,
    optional: false,
    custom: function() {
      if (!Activities.isValid(this.value)) {
        return 'invalidActivityType';
      }
    }
  },
  activityParameters: {
    type: Object,
    optional: true,
    blackbox: true
  },
  launchContext: {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// Scratchpad operation payload
const ScratchpadPayloadSchema = new SimpleSchema({
  id: {
    type: String,
    optional: true,
    max: 200
  },
  resource: {
    type: Object,
    optional: true,
    blackbox: true
  },
  resourceType: {
    type: String,
    optional: true
  }
});

// FHIR HTTP payload
const FhirHttpPayloadSchema = new SimpleSchema({
  method: {
    type: String,
    allowedValues: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    optional: false
  },
  url: {
    type: String,
    optional: false
  },
  headers: {
    type: Object,
    optional: true,
    blackbox: true
  },
  body: {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// Export schemas
const MessageSchemas = globalThis.MessageSchemas = {
  BaseMessage: BaseMessageSchema,
  ResponseMessage: ResponseMessageSchema,
  Payloads: {
    StatusHandshake: StatusHandshakePayloadSchema,
    UILaunchActivity: UILaunchActivityPayloadSchema,
    Scratchpad: ScratchpadPayloadSchema,
    FhirHttp: FhirHttpPayloadSchema
  }
};
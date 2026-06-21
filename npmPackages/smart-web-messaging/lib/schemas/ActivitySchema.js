// packages/smart-web-messaging/lib/schemas/ActivitySchema.js

import SimpleSchema from 'simpl-schema';

// simpl-schema v3 removed the `SimpleSchema.RegEx` static this package was written
// against (v2). URL_REGEX is the canonical URL pattern RegEx.Url provided.
const URL_REGEX = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?:[a-z¡-￿0-9]-*)*[a-z¡-￿0-9]+)(?:\.(?:[a-z¡-￿0-9]-*)*[a-z¡-￿0-9]+)*(?:\.(?:[a-z¡-￿]{2,}))\.?(?::\d{2,5})?(?:[/?#]\S*)?$/i;

/**
 * Schema for Activity definitions and results
 * Based on the SMART Web Messaging IG activity catalog
 */

// Activity launch result schema
const ActivityLaunchResultSchema = new SimpleSchema({
  activityType: {
    type: String,
    optional: false,
    label: 'Activity Type'
  },
  status: {
    type: String,
    allowedValues: [LaunchStatusCodes.SUCCESS, LaunchStatusCodes.ERROR],
    optional: false,
    label: 'Launch Status'
  },
  message: {
    type: String,
    optional: true,
    label: 'Status Message',
    max: 500
  },
  resources: {
    type: Array,
    optional: true,
    label: 'Result Resources'
  },
  'resources.$': {
    type: Object,
    blackbox: true
  },
  navigationHint: {
    type: Object,
    optional: true,
    label: 'Navigation Hint'
  },
  'navigationHint.type': {
    type: String,
    allowedValues: ['none', 'tab', 'replace', 'history'],
    optional: true
  },
  'navigationHint.target': {
    type: String,
    optional: true
  },
  'navigationHint.url': {
    type: String,
    regEx: URL_REGEX,
    optional: true
  }
});

// Activity parameters schema (for launching activities)
const ActivityParametersSchema = new SimpleSchema({
  patient: {
    type: String,
    optional: true,
    label: 'Patient Reference'
  },
  encounter: {
    type: String,
    optional: true,
    label: 'Encounter Reference'
  },
  practitioner: {
    type: String,
    optional: true,
    label: 'Practitioner Reference'
  },
  resources: {
    type: Array,
    optional: true,
    label: 'Input Resources'
  },
  'resources.$': {
    type: Object,
    blackbox: true
  }
});

// Scratchpad item schema
const ScratchpadItemSchema = new SimpleSchema({
  id: {
    type: String,
    optional: false,
    label: 'Scratchpad Item ID'
  },
  resourceType: {
    type: String,
    optional: false,
    label: 'FHIR Resource Type'
  },
  resource: {
    type: Object,
    blackbox: true,
    optional: false,
    label: 'FHIR Resource'
  },
  createdAt: {
    type: Date,
    optional: false,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  updatedAt: {
    type: Date,
    optional: false,
    autoValue: function() {
      return new Date();
    }
  },
  messagingHandle: {
    type: String,
    optional: false,
    label: 'Associated Messaging Handle'
  },
  sessionId: {
    type: String,
    optional: true,
    label: 'Session ID'
  }
});

// Export schemas
const ActivitySchemas = globalThis.ActivitySchemas = {
  LaunchResult: ActivityLaunchResultSchema,
  Parameters: ActivityParametersSchema,
  ScratchpadItem: ScratchpadItemSchema
};
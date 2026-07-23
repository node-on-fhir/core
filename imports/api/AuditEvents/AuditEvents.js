// /imports/api/AuditEvents/AuditEvents.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';
import { Random } from 'meteor/random';

// Import the existing collection from the schema file
import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

// Re-export for other modules
export { AuditEvents };

Meteor.ServerMethods.define('auditEvents.insert', {
  description: 'Create a new AuditEvent resource',
  schemaObject: { type: 'object' }   // arbitrary FHIR AuditEvent shape
}, async function(params, context){
  const auditEventData = params;

  const cleanAuditEvent = {
    resourceType: 'AuditEvent',
    id: Random.id(),
    type: get(auditEventData, 'type', {
      system: 'http://hl7.org/fhir/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    }),
    subtype: get(auditEventData, 'subtype', []),
    action: get(auditEventData, 'action', 'R'),
    recorded: get(auditEventData, 'recorded', new Date().toISOString()),
    outcome: get(auditEventData, 'outcome', '0'),
    outcomeDesc: get(auditEventData, 'outcomeDesc', ''),
    agent: get(auditEventData, 'agent', [{
      who: {
        reference: `User/${context.userId}`,
        display: context.userId
      },
      requestor: true
    }]),
    source: get(auditEventData, 'source', {
      observer: {
        display: 'Honeycomb FHIR Server'
      }
    }),
    entity: get(auditEventData, 'entity', [])
  };

  cleanAuditEvent._id = cleanAuditEvent.id;

  context.log.info('Inserting audit event', { _id: cleanAuditEvent._id });
  const result = await AuditEvents.insertAsync(cleanAuditEvent);
  return result;
});

Meteor.ServerMethods.define('auditEvents.update', {
  description: 'Update an existing AuditEvent resource unless the audit trail is immutable',
  positionalParams: ['auditEventId', 'auditEventData'],
  schemaObject: {
    type: 'object',
    properties: {
      auditEventId: { type: 'string' },
      auditEventData: { type: 'object' }
    },
    required: ['auditEventId', 'auditEventData']
  }
}, async function(params, context){
  const auditEventId = params.auditEventId;
  const auditEventData = params.auditEventData;

  if (get(Meteor, 'settings.private.hipaa.audit.immutable', false)) {
    throw new Meteor.Error('feature-disabled',
      'AuditEvents are immutable (settings.private.hipaa.audit.immutable)');
  }

  const existing = await AuditEvents.findOneAsync({ _id: auditEventId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'AuditEvent not found');
  }

  const updates = {
    type: get(auditEventData, 'type', existing.type),
    subtype: get(auditEventData, 'subtype', existing.subtype),
    action: get(auditEventData, 'action', existing.action),
    recorded: get(auditEventData, 'recorded', existing.recorded),
    outcome: get(auditEventData, 'outcome', existing.outcome),
    outcomeDesc: get(auditEventData, 'outcomeDesc', existing.outcomeDesc),
    agent: get(auditEventData, 'agent', existing.agent),
    source: get(auditEventData, 'source', existing.source),
    entity: get(auditEventData, 'entity', existing.entity)
  };

  context.log.info('Updating audit event', { auditEventId: auditEventId });
  const result = await AuditEvents.updateAsync(
    { _id: auditEventId },
    { $set: updates }
  );
  return result;
});

Meteor.ServerMethods.define('auditEvents.remove', {
  description: 'Delete an AuditEvent resource unless the audit trail is immutable',
  positionalParams: ['auditEventId'],
  schemaObject: {
    type: 'object',
    properties: {
      auditEventId: { type: 'string' }
    },
    required: ['auditEventId']
  }
}, async function(params, context){
  if (get(Meteor, 'settings.private.hipaa.audit.immutable', false)) {
    throw new Meteor.Error('feature-disabled',
      'AuditEvents are immutable (settings.private.hipaa.audit.immutable)');
  }

  context.log.info('Removing audit event', { auditEventId: params.auditEventId });
  const result = await AuditEvents.removeAsync({ _id: params.auditEventId });
  return result;
});

Meteor.ServerMethods.define('auditEvents.findOne', {
  description: 'Fetch a single AuditEvent resource by id',
  positionalParams: ['auditEventId'],
  schemaObject: {
    type: 'object',
    properties: {
      auditEventId: { type: 'string' }
    },
    required: ['auditEventId']
  }
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change noted in the migration report.
}, async function(params){
  const auditEvent = await AuditEvents.findOneAsync({ _id: params.auditEventId });
  return auditEvent;
});

Meteor.ServerMethods.define('auditEvents.log', {
  description: 'Record an audit event describing a system or user action',
  // Public by design (pre-migration behavior): the audit sink must accept
  // events from unauthenticated contexts (login attempts, anonymous access)
  // and from server-side orchestration.
  requireAuth: false,
  positionalParams: ['eventType', 'userId', 'recordId', 'message', 'additionalData'],
  schemaObject: {
    type: 'object',
    properties: {
      eventType: { type: 'string' }
    },
    required: ['eventType']
  }
}, async function(params, context){
  const eventType = params.eventType;
  const userId = params.userId;
  const recordId = params.recordId;
  const message = params.message;
  const additionalData = get(params, 'additionalData', {});

  // Basic validation
  if (!eventType) {
    throw new Meteor.Error('missing-event-type', 'Event type is required');
  }

  // Build the audit event
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://hl7.org/fhir/audit-event-type',
      code: eventType,
      display: eventType
    },
    recorded: new Date().toISOString(),
    outcome: '0', // Success
    agent: [{
      who: userId ? {
        reference: `User/${userId}`,
        display: userId
      } : {
        display: 'System'
      },
      requestor: true
    }],
    source: {
      observer: {
        display: 'Honeycomb FHIR Server'
      },
      type: [{
        system: 'http://hl7.org/fhir/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    }
  };

  // Add entity if recordId provided
  if (recordId) {
    auditEvent.entity = [{
      what: {
        reference: recordId
      },
      type: {
        system: 'http://hl7.org/fhir/audit-entity-type',
        code: '2',
        display: 'System Object'
      }
    }];
  }

  // Add any additional data
  if (message) {
    auditEvent.outcomeDesc = message;
  }

  // Merge additional data (but preserve arrays like entity)
  if (additionalData) {
    // Handle entity array specially
    if (additionalData.entity && !auditEvent.entity) {
      auditEvent.entity = additionalData.entity;
    }

    // Handle action — normalize verbs to the FHIR AuditEvent.action code set (C|R|U|D|E)
    if (additionalData.action) {
      const actionMap = { CREATE: 'C', READ: 'R', UPDATE: 'U', DELETE: 'D', EXECUTE: 'E' };
      const rawAction = String(additionalData.action).toUpperCase();
      auditEvent.action = actionMap[rawAction] || (['C', 'R', 'U', 'D', 'E'].includes(rawAction) ? rawAction : 'E');
    }

    // Merge other properties
    const { entity, action, ...otherData } = additionalData;
    Object.assign(auditEvent, otherData);
  }

  // Insert the audit event
  try {
    const result = await AuditEvents.insertAsync(auditEvent);
    return result;
  } catch (error) {
    context.log.error('Error logging audit event', { message: error.message });
    throw new Meteor.Error('audit-log-failed',
      'Failed to log audit event: ' + (error.reason || error.message || 'unknown error'),
      error.details);
  }
});

Meteor.ServerMethods.define('auditEvents.logAccess', {
  description: 'Record an access audit event for a resource, attributed to the calling user',
  // Public by design (pre-migration behavior): access events must be
  // recordable for anonymous users as well as authenticated ones.
  requireAuth: false,
  positionalParams: ['resourceType', 'resourceId', 'action'],
  schemaObject: {
    type: 'object',
    properties: {
      resourceType: { type: 'string' },
      resourceId: { type: 'string' },
      action: { type: 'string' }
    },
    required: ['resourceType', 'resourceId']
  }
}, async function(params, context){
  const resourceType = params.resourceType;
  const resourceId = params.resourceId;
  const action = get(params, 'action', 'read');

  const userId = context.userId;
  const eventType = `${resourceType}-${action}`;
  const message = `User ${userId || 'anonymous'} performed ${action} on ${resourceType}/${resourceId}`;

  return await Meteor.ServerMethods.invoke('auditEvents.log', {
    eventType: eventType,
    userId: userId,
    recordId: `${resourceType}/${resourceId}`,
    message: message
  }, { userId: userId });
});

// Publications
if (Meteor.isServer) {
  Meteor.publish('auditEvents', function(query = {}, options = {}) {
    // Check if user has permission to view audit logs
    if (!this.userId) {
      return this.ready();
    }

    // Add default options
    const defaultOptions = {
      limit: 100,
      sort: { recorded: -1 }
    };

    const finalOptions = Object.assign({}, defaultOptions, options);

    return AuditEvents.find(query, finalOptions);
  });

  Meteor.publish('auditEvents.recent', function(limit = 50) {
    if (!this.userId) {
      return this.ready();
    }

    return AuditEvents.find({}, {
      limit: limit,
      sort: { recorded: -1 }
    });
  });
}

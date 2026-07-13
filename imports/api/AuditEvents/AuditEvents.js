// /imports/api/AuditEvents/AuditEvents.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

// Import the existing collection from the schema file
import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

// Re-export for other modules
export { AuditEvents };

// Define Meteor methods for audit logging and CRUD operations
Meteor.methods({
  'auditEvents.insert': async function(auditEventData) {
    check(auditEventData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create audit events');
    }

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
          reference: `User/${this.userId}`,
          display: this.userId
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

    console.log('[auditEvents.insert] Inserting:', cleanAuditEvent._id);
    const result = await AuditEvents.insertAsync(cleanAuditEvent);
    return result;
  },

  'auditEvents.update': async function(auditEventId, auditEventData) {
    check(auditEventId, String);
    check(auditEventData, Object);

    if (get(Meteor, 'settings.private.hipaa.audit.immutable', false)) {
      throw new Meteor.Error('feature-disabled',
        'AuditEvents are immutable (settings.private.hipaa.audit.immutable)');
    }

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update audit events');
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

    console.log('[auditEvents.update] Updating:', auditEventId);
    const result = await AuditEvents.updateAsync(
      { _id: auditEventId },
      { $set: updates }
    );
    return result;
  },

  'auditEvents.remove': async function(auditEventId) {
    check(auditEventId, String);

    if (get(Meteor, 'settings.private.hipaa.audit.immutable', false)) {
      throw new Meteor.Error('feature-disabled',
        'AuditEvents are immutable (settings.private.hipaa.audit.immutable)');
    }

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove audit events');
    }

    console.log('[auditEvents.remove] Removing:', auditEventId);
    const result = await AuditEvents.removeAsync({ _id: auditEventId });
    return result;
  },

  'auditEvents.findOne': async function(auditEventId) {
    check(auditEventId, String);

    const auditEvent = await AuditEvents.findOneAsync({ _id: auditEventId });
    return auditEvent;
  },
  'auditEvents.log': async function(eventType, userId, recordId, message, additionalData = {}) {
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
      console.error('Error logging audit event:', error);
      throw new Meteor.Error('audit-log-failed',
        'Failed to log audit event: ' + (error.reason || error.message || 'unknown error'),
        error.details);
    }
  },

  'auditEvents.logAccess': async function(resourceType, resourceId, action = 'read') {
    const userId = this.userId;
    const eventType = `${resourceType}-${action}`;
    const message = `User ${userId || 'anonymous'} performed ${action} on ${resourceType}/${resourceId}`;
    
    return Meteor.call('auditEvents.log', eventType, userId, `${resourceType}/${resourceId}`, message);
  }
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
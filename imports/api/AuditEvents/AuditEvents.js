// /imports/api/AuditEvents/AuditEvents.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';

// Import the existing collection from the schema file
import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

// Re-export for other modules
export { AuditEvents };

// Define Meteor methods for audit logging
Meteor.methods({
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
      recorded: new Date(),
      outcome: '0', // Success
      agent: [{
        who: {
          reference: userId ? `User/${userId}` : 'System',
          display: userId || 'System'
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

    // Merge additional data
    Object.assign(auditEvent, additionalData);

    // Insert the audit event
    try {
      const result = await AuditEvents.insertAsync(auditEvent);
      return result;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw new Meteor.Error('audit-log-failed', 'Failed to log audit event');
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
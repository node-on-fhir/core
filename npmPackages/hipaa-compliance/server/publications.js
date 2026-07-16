// npmPackages/hipaa-compliance/server/publications.js
//
// Fail-closed audit publications over the core FHIR AuditEvents collection.
// Every publication awaits the async SecurityValidators before publishing
// anything, and streams documents through the decryption transform so the
// client's AuditEvents minimongo receives readable records while the stored
// documents stay encrypted.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EncryptionManager } from '../lib/EncryptionManager';
import { buildAuditQuery } from '../lib/AuditEventMapping';

function getAuditEventsCollection() {
  return get(global, 'Collections.AuditEvents');
}

// Stream a cursor into the subscription with per-document decryption.
async function publishDecrypted(subscription, cursor) {
  const handle = await cursor.observeChangesAsync({
    added: function(id, fields) {
      subscription.added('AuditEvents', id, EncryptionManager.decryptAuditEvent(fields));
    },
    changed: function(id, fields) {
      subscription.changed('AuditEvents', id, EncryptionManager.decryptAuditEvent(fields));
    },
    removed: function(id) {
      subscription.removed('AuditEvents', id);
    }
  });

  subscription.ready();

  subscription.onStop(function() {
    handle.stop();
  });
}

// Publish audit log entries (role-gated, filtered, decrypted)
Meteor.publish('hipaa.auditEvents', async function(filters = {}) {
  check(filters, {
    limit: Match.Optional(Number),
    eventType: Match.Optional(String),
    userId: Match.Optional(String),
    patientId: Match.Optional(String),
    collectionName: Match.Optional(String),
    startDate: Match.Optional(Date),
    endDate: Match.Optional(Date),
    searchText: Match.Optional(String)
  });

  // Fail-closed permission checks
  if (!this.userId || !(await SecurityValidators.canViewAuditLog(this.userId))) {
    return this.ready();
  }
  if (filters.patientId && !(await SecurityValidators.canViewPatientAudits(this.userId, filters.patientId))) {
    return this.ready();
  }

  const AuditEvents = getAuditEventsCollection();
  if (!AuditEvents) {
    return this.ready();
  }

  const query = buildAuditQuery(filters);
  const limit = filters.limit || get(Meteor, 'settings.public.hipaa.ui.defaultPageSize', 25);

  const cursor = AuditEvents.find(query, {
    sort: { recorded: -1 },
    limit: limit
  });

  await publishDecrypted(this, cursor);
});

// Publish patient-specific audit trail
Meteor.publish('hipaa.patientAuditTrail', async function(patientId) {
  check(patientId, String);

  // Fail-closed permission check
  if (!this.userId || !(await SecurityValidators.canViewPatientAudits(this.userId, patientId))) {
    return this.ready();
  }

  const AuditEvents = getAuditEventsCollection();
  if (!AuditEvents) {
    return this.ready();
  }

  const cursor = AuditEvents.find(buildAuditQuery({ patientId: patientId }), {
    sort: { recorded: -1 },
    limit: 100
  });

  await publishDecrypted(this, cursor);
});

// Publish audit statistics (synthetic summary document)
Meteor.publish('hipaa.auditStatistics', async function(dateRange) {
  check(dateRange, Match.Optional({
    start: Date,
    end: Date
  }));

  // Fail-closed permission check
  if (!this.userId || !(await SecurityValidators.canViewAuditLog(this.userId))) {
    return this.ready();
  }

  const AuditEvents = getAuditEventsCollection();
  if (!AuditEvents) {
    return this.ready();
  }

  const self = this;
  let count = 0;
  const eventTypes = {};

  const query = {};
  if (dateRange) {
    query.recorded = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  // Send initial synthetic doc, then keep it updated
  self.added('HipaaAuditStatistics', 'summary', {
    totalEvents: count,
    eventTypes: eventTypes,
    lastUpdated: new Date()
  });

  const handle = await AuditEvents.find(query).observeChangesAsync({
    added: function(id, fields) {
      const eventType = get(fields, 'type.code', 'unknown');
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1;
      count++;

      self.changed('HipaaAuditStatistics', 'summary', {
        totalEvents: count,
        eventTypes: eventTypes,
        lastUpdated: new Date()
      });
    },
    removed: function(id) {
      count--;

      self.changed('HipaaAuditStatistics', 'summary', {
        totalEvents: count,
        eventTypes: eventTypes,
        lastUpdated: new Date()
      });
    }
  });

  self.ready();

  self.onStop(function() {
    handle.stop();
  });
});

// Publish recent security events
Meteor.publish('hipaa.securityEvents', async function(limit = 10) {
  check(limit, Number);

  // Only admins can view security events — fail-closed
  if (!this.userId || !(await SecurityValidators.canModifyAuditSettings(this.userId))) {
    return this.ready();
  }

  const AuditEvents = getAuditEventsCollection();
  if (!AuditEvents) {
    return this.ready();
  }

  const cursor = AuditEvents.find({
    'type.code': { $in: ['denied', 'error', 'login', 'logout', 'key-rotated', 'key-rotation-due'] }
  }, {
    sort: { recorded: -1 },
    limit: limit
  });

  await publishDecrypted(this, cursor);
});

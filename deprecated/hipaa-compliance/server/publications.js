// packages/hipaa-compliance/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { HipaaAuditLog } from '../lib/Collections';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EncryptionManager } from '../lib/EncryptionManager';

// Publish audit log entries
Meteor.publish('hipaa.auditLog', function(filters = {}) {
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

  // Check permissions
  if (!this.userId || !SecurityValidators.canViewAuditLog(this.userId)) {
    return this.ready();
  }

  // Build query
  const query = {};

  if (filters.eventType) {
    query.eventType = filters.eventType;
  }
  
  if (filters.userId) {
    query.userId = filters.userId;
  }
  
  if (filters.patientId) {
    // Check if user can view patient audits
    if (!SecurityValidators.canViewPatientAudits(this.userId, filters.patientId)) {
      return this.ready();
    }
    query.patientId = filters.patientId;
  }
  
  if (filters.collectionName) {
    query.collectionName = filters.collectionName;
  }
  
  if (filters.startDate || filters.endDate) {
    query.eventDate = {};
    if (filters.startDate) {
      query.eventDate.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.eventDate.$lte = filters.endDate;
    }
  }
  
  if (filters.searchText) {
    query.$or = [
      { message: { $regex: filters.searchText, $options: 'i' } },
      { userName: { $regex: filters.searchText, $options: 'i' } },
      { patientName: { $regex: filters.searchText, $options: 'i' } }
    ];
  }

  // Default limit
  const limit = filters.limit || get(Meteor, 'settings.public.hipaa.ui.defaultPageSize', 25);

  // Return cursor with decryption transform
  const cursor = HipaaAuditLog.find(query, {
    sort: { eventDate: -1 },
    limit: limit
  });

  // Add transform to decrypt data
  const handle = cursor.observeChanges({
    added: (id, fields) => {
      const decrypted = EncryptionManager.decryptAuditEvent(fields);
      this.added('HipaaAuditLog', id, decrypted);
    },
    changed: (id, fields) => {
      const decrypted = EncryptionManager.decryptAuditEvent(fields);
      this.changed('HipaaAuditLog', id, decrypted);
    },
    removed: (id) => {
      this.removed('HipaaAuditLog', id);
    }
  });

  this.ready();

  this.onStop(() => {
    handle.stop();
  });
});

// Publish patient-specific audit trail
Meteor.publish('hipaa.patientAuditTrail', function(patientId) {
  check(patientId, String);

  // Check permissions
  if (!this.userId || !SecurityValidators.canViewPatientAudits(this.userId, patientId)) {
    return this.ready();
  }

  // Return patient-related events
  return HipaaAuditLog.find({
    patientId: patientId
  }, {
    sort: { eventDate: -1 },
    limit: 100
  });
});

// Publish audit statistics
Meteor.publish('hipaa.auditStatistics', function(dateRange) {
  check(dateRange, Match.Optional({
    start: Date,
    end: Date
  }));

  // Check permissions
  if (!this.userId || !SecurityValidators.canViewAuditLog(this.userId)) {
    return this.ready();
  }

  // Create a synthetic collection for statistics
  const self = this;
  let count = 0;

  const query = {};
  if (dateRange) {
    query.eventDate = {
      $gte: dateRange.start,
      $lte: dateRange.end
    };
  }

  // Count by event type
  const eventTypes = {};
  
  const handle = HipaaAuditLog.find(query).observeChanges({
    added: function(id, fields) {
      const eventType = fields.eventType;
      if (!eventTypes[eventType]) {
        eventTypes[eventType] = 0;
      }
      eventTypes[eventType]++;
      count++;
      
      self.changed('HipaaAuditStatistics', 'summary', {
        totalEvents: count,
        eventTypes: eventTypes,
        lastUpdated: new Date()
      });
    },
    removed: function(id, fields) {
      const eventType = fields.eventType;
      if (eventTypes[eventType]) {
        eventTypes[eventType]--;
        if (eventTypes[eventType] === 0) {
          delete eventTypes[eventType];
        }
      }
      count--;
      
      self.changed('HipaaAuditStatistics', 'summary', {
        totalEvents: count,
        eventTypes: eventTypes,
        lastUpdated: new Date()
      });
    }
  });

  // Send initial data
  self.added('HipaaAuditStatistics', 'summary', {
    totalEvents: count,
    eventTypes: eventTypes,
    lastUpdated: new Date()
  });

  self.ready();

  self.onStop(function() {
    handle.stop();
  });
});

// Publish recent security events
Meteor.publish('hipaa.securityEvents', function(limit = 10) {
  check(limit, Number);

  // Only admins can view security events
  if (!this.userId || !SecurityValidators.canModifyAuditSettings(this.userId)) {
    return this.ready();
  }

  // Return recent security-related events
  return HipaaAuditLog.find({
    eventType: { $in: ['denied', 'error', 'login', 'logout'] }
  }, {
    sort: { eventDate: -1 },
    limit: limit
  });
});
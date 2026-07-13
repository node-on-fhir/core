// npmPackages/hipaa-compliance/server/methods.js
//
// Audit logging, reporting, and export methods — all reads and writes go
// through the core FHIR AuditEvents collection (global.Collections),
// translated via lib/AuditEventMapping.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';
import { HipaaLogger } from '../lib/HipaaLogger';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EncryptionManager } from '../lib/EncryptionManager';
import { buildAuditQuery, flattenAuditEvent } from '../lib/AuditEventMapping';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

function getAuditEventsCollection() {
  const AuditEvents = get(global, 'Collections.AuditEvents');
  if (!AuditEvents) {
    throw new Meteor.Error('collection-unavailable', 'AuditEvents collection not available');
  }
  return AuditEvents;
}

function escapeCsvField(field) {
  const value = String(field === undefined || field === null ? '' : field);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// Format flattened events as CSV
function formatAsCSV(flatEvents) {
  const headers = [
    'Event Date',
    'Event Type',
    'User',
    'Patient ID',
    'Patient Name',
    'Collection',
    'Resource ID',
    'Message'
  ];

  const csv = [headers.join(',')];
  flatEvents.forEach(function(event) {
    csv.push([
      moment(event.recorded).format('YYYY-MM-DD HH:mm:ss'),
      event.eventType,
      event.userName || event.userId || '',
      event.patientId || '',
      event.patientName || '',
      event.collectionName || '',
      event.resourceId || '',
      event.message || ''
    ].map(escapeCsvField).join(','));
  });

  return csv.join('\n');
}

// Format stored FHIR resources as a Bundle — the store is already FHIR, so
// the export is the resources themselves (decrypted).
function formatAsFHIR(fhirEvents) {
  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    total: fhirEvents.length,
    entry: fhirEvents.map(function(event) {
      return { resource: event };
    })
  };

  return JSON.stringify(bundle, null, 2);
}

// Shared export builder — auth is the caller's responsibility
// (hipaa.exportAuditTrail and hipaa.generateEncryptedExport both validate
// via SecurityValidators.validateExportRequest first).
export async function buildAuditExport(options) {
  const AuditEvents = getAuditEventsCollection();

  const query = buildAuditQuery({
    startDate: get(options, 'dateRange.start'),
    endDate: get(options, 'dateRange.end')
  });

  const limit = get(options, 'limit') || get(Meteor, 'settings.private.hipaa.reporting.maxExportRecords', 10000);

  const events = await AuditEvents.find(query, {
    sort: { recorded: -1 },
    limit: limit
  }).fetchAsync();

  const decryptedEvents = events.map(function(event) {
    return EncryptionManager.decryptAuditEvent(event);
  });

  let exportData;
  switch (get(options, 'format')) {
    case 'csv':
      exportData = formatAsCSV(decryptedEvents.map(flattenAuditEvent));
      break;
    case 'fhir':
      exportData = formatAsFHIR(decryptedEvents);
      break;
    default:
      exportData = JSON.stringify(decryptedEvents.map(flattenAuditEvent), null, 2);
  }

  return {
    format: get(options, 'format'),
    data: exportData,
    recordCount: decryptedEvents.length,
    exportDate: new Date()
  };
}

Meteor.methods({
  // Log a HIPAA audit event
  'hipaa.logEvent': async function(auditEvent) {
    check(auditEvent, {
      eventType: String,
      message: Match.Optional(String),
      resourceType: Match.Optional(String),
      resourceId: Match.Optional(String),
      collectionName: Match.Optional(String),
      patientId: Match.Optional(String),
      patientName: Match.Optional(String),
      metadata: Match.Optional(Object),
      userId: Match.Optional(String),
      userName: Match.Optional(String),
      userEmail: Match.Optional(String),
      userRoles: Match.Optional([String]),
      eventDate: Match.Optional(Date)
    });

    return await HipaaLogger.logEvent(auditEvent, this);
  },

  // Log a FHIR AuditEvent
  'hipaa.logAuditEvent': async function(fhirAuditEvent) {
    check(fhirAuditEvent, Object);

    // Validate user
    await SecurityValidators.validateCurrentUser(this);

    return await HipaaLogger.logAuditEvent(fhirAuditEvent, this);
  },

  // Generate compliance report
  'hipaa.generateReport': async function(filters) {
    check(filters, {
      startDate: Date,
      endDate: Date,
      eventTypes: Match.Optional([String]),
      userId: Match.Optional(String),
      patientId: Match.Optional(String),
      collectionName: Match.Optional(String)
    });

    // Validate permissions
    const user = await SecurityValidators.validateCurrentUser(this);
    if (!(await SecurityValidators.canViewAuditLog(this.userId))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to generate reports');
    }
    if (filters.patientId && !(await SecurityValidators.canViewPatientAudits(this.userId, filters.patientId))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to view this patient\'s audit trail');
    }

    const AuditEvents = getAuditEventsCollection();

    // Build FHIR-path query
    const query = buildAuditQuery({
      startDate: filters.startDate,
      endDate: filters.endDate,
      userId: filters.userId,
      patientId: filters.patientId,
      collectionName: filters.collectionName
    });
    if (get(filters, 'eventTypes', []).length > 0) {
      query['type.code'] = { $in: filters.eventTypes };
    }

    const events = await AuditEvents.find(query, {
      sort: { recorded: -1 }
    }).fetchAsync();

    // Decrypt + flatten for the report
    const flatEvents = events.map(function(event) {
      return flattenAuditEvent(EncryptionManager.decryptAuditEvent(event));
    });

    // Generate report statistics
    const report = {
      generatedAt: new Date(),
      generatedBy: user.username || get(user, 'emails[0].address'),
      filters: filters,
      totalEvents: flatEvents.length,
      eventsByType: {},
      eventsByUser: {},
      eventsByCollection: {},
      events: flatEvents
    };

    flatEvents.forEach(function(event) {
      report.eventsByType[event.eventType] = (report.eventsByType[event.eventType] || 0) + 1;

      if (event.userName) {
        report.eventsByUser[event.userName] = (report.eventsByUser[event.userName] || 0) + 1;
      }

      if (event.collectionName) {
        report.eventsByCollection[event.collectionName] =
          (report.eventsByCollection[event.collectionName] || 0) + 1;
      }
    });

    // Log the report generation
    await HipaaLogger.logSystemEvent('report-generated', {
      userId: this.userId,
      reportType: 'compliance',
      filters: filters,
      eventCount: flatEvents.length
    });

    return report;
  },

  // Export audit trail
  'hipaa.exportAuditTrail': async function(options) {
    check(options, {
      format: Match.OneOf('csv', 'json', 'fhir'),
      dateRange: {
        start: Date,
        end: Date
      },
      limit: Match.Optional(Number),
      approvalId: Match.Optional(String)
    });

    if (!get(Meteor, 'settings.public.hipaa.features.dataExport', true)) {
      throw new Meteor.Error('feature-disabled',
        'Audit export is disabled (settings.public.hipaa.features.dataExport)');
    }

    // Validate export request (fail-closed)
    await SecurityValidators.validateExportRequest(this.userId, options);

    const exportResult = await buildAuditExport(options);

    // Log the export
    await HipaaLogger.logSystemEvent('audit-exported', {
      userId: this.userId,
      format: options.format,
      recordCount: exportResult.recordCount,
      dateRange: options.dateRange,
      approvalId: options.approvalId
    });

    return exportResult;
  },

  // Get audit statistics
  'hipaa.getAuditStatistics': async function(dateRange) {
    check(dateRange, Match.Optional({
      start: Date,
      end: Date
    }));

    // Validate permissions
    if (!(await SecurityValidators.canViewAuditLog(this.userId))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to view statistics');
    }

    const AuditEvents = getAuditEventsCollection();

    const query = {};
    if (dateRange) {
      query.recorded = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    // Get aggregated statistics (by event type per day)
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: {
            eventType: '$type.code',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$recorded' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ];

    const stats = await AuditEvents.rawCollection().aggregate(pipeline).toArray();

    return {
      daily: stats,
      total: await AuditEvents.find(query).countAsync()
    };
  },

  // Export audit events as CSV (called by the audit-log page)
  'hipaa.auditEvents.exportCsv': async function(filters) {
    check(filters, {
      startDate: Date,
      endDate: Date,
      userId: Match.Optional(String),
      eventType: Match.Optional(String)
    });

    if (!get(Meteor, 'settings.public.hipaa.features.dataExport', true)) {
      throw new Meteor.Error('feature-disabled',
        'Audit export is disabled (settings.public.hipaa.features.dataExport)');
    }

    // Fail-closed: exports require an export-capable role
    if (!this.userId || !(await SecurityValidators.canExportAuditData(this.userId))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to export audit logs');
    }

    const AuditEvents = getAuditEventsCollection();

    const query = buildAuditQuery({
      startDate: filters.startDate,
      endDate: filters.endDate,
      userId: filters.userId || undefined,
      eventType: filters.eventType || undefined
    });

    const events = await AuditEvents.find(query, {
      sort: { recorded: -1 }
    }).fetchAsync();

    const flatEvents = events.map(function(event) {
      return flattenAuditEvent(EncryptionManager.decryptAuditEvent(event));
    });

    const csvHeader = 'Timestamp,Event Type,User,User ID,Patient/Resource,Resource Type,Action Details,Outcome\n';

    const csvRows = flatEvents.map(function(event) {
      return [
        moment(event.recorded).format('YYYY-MM-DD HH:mm:ss'),
        event.eventType,
        escapeCsvField(event.userName || 'Unknown'),
        event.userId,
        escapeCsvField(event.patientName || event.resourceReference || ''),
        event.resourceType,
        escapeCsvField(event.message),
        event.outcome === '0' ? 'Success' : 'Failed'
      ].join(',');
    });

    await HipaaLogger.logSystemEvent('audit-exported', {
      userId: this.userId,
      format: 'csv',
      recordCount: flatEvents.length,
      dateRange: { start: filters.startDate, end: filters.endDate }
    });

    return csvHeader + csvRows.join('\n');
  }
});

// packages/hipaa-compliance/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';
import { HipaaAuditLog } from '../lib/Collections';
import { HipaaLogger } from '../lib/HipaaLoggerAccess';
import { SecurityValidators } from '../lib/SecurityValidators';
import { EncryptionManager } from '../lib/EncryptionManager';
import { EventTypes } from '../lib/Constants';

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
      metadata: Match.Optional(Object)
    });

    // Set invocation context for logger
    HipaaLogger.setInvocation(this);
    
    // Log the event
    const eventId = await HipaaLogger.logEvent(auditEvent);
    
    return eventId;
  },

  // Log a FHIR AuditEvent
  'hipaa.logAuditEvent': async function(fhirAuditEvent) {
    check(fhirAuditEvent, Object);
    
    // Validate user
    SecurityValidators.validateCurrentUser(this);
    
    // Set invocation context
    HipaaLogger.setInvocation(this);
    
    // Log the FHIR event
    const eventId = await HipaaLogger.logAuditEvent(fhirAuditEvent);
    
    return eventId;
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
    const user = SecurityValidators.validateCurrentUser(this);
    if (!SecurityValidators.canViewAuditLog(this.userId)) {
      throw new Meteor.Error('unauthorized', 'Not authorized to generate reports');
    }

    // Build query
    const query = {
      eventDate: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.eventTypes?.length > 0) {
      query.eventType = { $in: filters.eventTypes };
    }
    if (filters.userId) {
      query.userId = filters.userId;
    }
    if (filters.patientId) {
      query.patientId = filters.patientId;
    }
    if (filters.collectionName) {
      query.collectionName = filters.collectionName;
    }

    // Get audit events
    const events = await HipaaAuditLog.find(query, {
      sort: { eventDate: -1 }
    }).fetchAsync();

    // Decrypt events if needed
    const decryptedEvents = events.map(event => 
      EncryptionManager.decryptAuditEvent(event)
    );

    // Generate report statistics
    const report = {
      generatedAt: new Date(),
      generatedBy: user.username || user.emails?.[0]?.address,
      filters: filters,
      totalEvents: decryptedEvents.length,
      eventsByType: {},
      eventsByUser: {},
      eventsByCollection: {},
      events: decryptedEvents
    };

    // Calculate statistics
    decryptedEvents.forEach(event => {
      // By type
      report.eventsByType[event.eventType] = (report.eventsByType[event.eventType] || 0) + 1;
      
      // By user
      if (event.userName) {
        report.eventsByUser[event.userName] = (report.eventsByUser[event.userName] || 0) + 1;
      }
      
      // By collection
      if (event.collectionName) {
        report.eventsByCollection[event.collectionName] = 
          (report.eventsByCollection[event.collectionName] || 0) + 1;
      }
    });

    // Log the report generation
    await HipaaLogger.logSystemEvent('report-generated', {
      reportType: 'compliance',
      filters: filters,
      eventCount: decryptedEvents.length
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

    // Validate export request
    SecurityValidators.validateExportRequest(this.userId, options);

    // Build query
    const query = {
      eventDate: {
        $gte: options.dateRange.start,
        $lte: options.dateRange.end
      }
    };

    const limit = options.limit || get(Meteor, 'settings.private.hipaa.reporting.maxExportRecords', 10000);

    // Get events
    const events = await HipaaAuditLog.find(query, {
      sort: { eventDate: -1 },
      limit: limit
    }).fetchAsync();

    // Decrypt events
    const decryptedEvents = events.map(event => 
      EncryptionManager.decryptAuditEvent(event)
    );

    // Format based on requested type
    let exportData;
    switch(options.format) {
      case 'csv':
        exportData = this.formatAsCSV(decryptedEvents);
        break;
      case 'fhir':
        exportData = this.formatAsFHIR(decryptedEvents);
        break;
      default:
        exportData = JSON.stringify(decryptedEvents, null, 2);
    }

    // Log the export
    await HipaaLogger.logSystemEvent('audit-exported', {
      format: options.format,
      recordCount: decryptedEvents.length,
      dateRange: options.dateRange,
      approvalId: options.approvalId
    });

    return {
      format: options.format,
      data: exportData,
      recordCount: decryptedEvents.length,
      exportDate: new Date()
    };
  },

  // Get audit statistics
  'hipaa.getAuditStatistics': async function(dateRange) {
    check(dateRange, Match.Optional({
      start: Date,
      end: Date
    }));

    // Validate permissions
    if (!SecurityValidators.canViewAuditLog(this.userId)) {
      throw new Meteor.Error('unauthorized', 'Not authorized to view statistics');
    }

    const query = {};
    if (dateRange) {
      query.eventDate = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    // Get aggregated statistics
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: {
            eventType: '$eventType',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$eventDate' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ];

    const stats = await HipaaAuditLog.rawCollection().aggregate(pipeline).toArray();

    return {
      daily: stats,
      total: await HipaaAuditLog.find(query).countAsync()
    };
  },

  // Format as CSV helper
  formatAsCSV: function(events) {
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

    const rows = events.map(event => [
      moment(event.eventDate).format('YYYY-MM-DD HH:mm:ss'),
      event.eventType,
      event.userName || event.userId || '',
      event.patientId || '',
      event.patientName || '',
      event.collectionName || '',
      event.resourceId || '',
      event.message || ''
    ]);

    // Build CSV
    const csv = [headers.join(',')];
    rows.forEach(row => {
      csv.push(row.map(cell => `"${cell}"`).join(','));
    });

    return csv.join('\n');
  },

  // Format as FHIR AuditEvent
  formatAsFHIR: function(events) {
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: events.map(event => ({
        resource: {
          resourceType: 'AuditEvent',
          type: {
            system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
            code: event.eventType,
            display: event.eventType
          },
          recorded: event.eventDate,
          agent: [{
            who: {
              identifier: {
                value: event.userId
              },
              display: event.userName
            }
          }],
          entity: event.patientId ? [{
            what: {
              reference: `Patient/${event.patientId}`,
              display: event.patientName
            }
          }] : []
        }
      }))
    };

    return JSON.stringify(bundle, null, 2);
  },

  // Export audit events as CSV (for modern UI)
  'hipaa.auditEvents.exportCsv': async function(filters) {
    check(filters, {
      startDate: Date,
      endDate: Date,
      userId: Match.Optional(String),
      eventType: Match.Optional(String)
    });

    // Validate permissions
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to export audit logs');
    }

    // Import AuditEvents collection
    const { AuditEvents } = await import('/imports/lib/schemas/SimpleSchemas/AuditEvents');

    // Build query
    const query = {
      recorded: {
        $gte: filters.startDate,
        $lte: filters.endDate
      }
    };

    if (filters.userId) {
      query['agent.reference'] = filters.userId;
    }

    if (filters.eventType) {
      query['action'] = filters.eventType;
    }

    // Fetch events
    const events = await AuditEvents.find(query, {
      sort: { recorded: -1 }
    }).fetchAsync();

    // Build CSV
    const csvHeader = 'Timestamp,Event Type,User,User ID,Patient/Resource,Resource Type,Action Details,Outcome\n';
    
    const csvRows = events.map(event => {
      const timestamp = moment(event.recorded).format('YYYY-MM-DD HH:mm:ss');
      const eventType = event.action || '';
      const userName = get(event, 'agent[0].name', 'Unknown');
      const userId = get(event, 'agent[0].requestor.identifier.value', '');
      const resource = get(event, 'entity[0].what.display', get(event, 'entity[0].what.reference', ''));
      const resourceType = get(event, 'entity[0].type.display', '');
      const actionDetails = get(event, 'outcomeDesc', get(event, 'type.display', ''));
      const outcome = get(event, 'outcome.code', '0') === '0' ? 'Success' : 'Failed';
      
      // Escape CSV fields
      const escapeField = (field) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      return [
        timestamp,
        eventType,
        escapeField(userName),
        userId,
        escapeField(resource),
        resourceType,
        escapeField(actionDetails),
        outcome
      ].join(',');
    });

    return csvHeader + csvRows.join('\n');
  }
});
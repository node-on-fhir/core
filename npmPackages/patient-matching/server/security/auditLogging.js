// packages/patient-matching/server/security/auditLogging.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';
import moment from 'moment';

const log = (Meteor.Logger ? Meteor.Logger.for('auditLogging') : console);

// Audit log collection
export const AuditLogs = new Mongo.Collection('AuditLogs');

// Ensure indexes for efficient querying
if (Meteor.isServer) {
  Meteor.startup(async function() {
    // Use createIndexAsync for Meteor 3.x
    try {
      await AuditLogs.createIndexAsync({ timestamp: -1 });
      await AuditLogs.createIndexAsync({ userId: 1 });
      await AuditLogs.createIndexAsync({ operation: 1 });
      await AuditLogs.createIndexAsync({ 'patient.id': 1 });
      console.log('PatientMatching: Audit log indexes created'); // phi-audit: ok
    } catch (error) {
      log.error('PatientMatching: Error creating audit log indexes', { error: error?.message });
    }
  });
}

// Audit logging functions
export const AuditLogger = {
  
  // Log a match operation
  logMatchOperation: async function(details) {
    const auditEntry = {
      timestamp: new Date(),
      operation: 'patient-match',
      userId: get(details, 'userId', 'system'),
      userAgent: get(details, 'userAgent', 'unknown'),
      ipAddress: get(details, 'ipAddress', 'unknown'),
      
      // Match details
      matchCriteria: {
        firstName: get(details, 'patientData.name[0].given[0]'),
        lastName: get(details, 'patientData.name[0].family'),
        birthDate: get(details, 'patientData.birthDate'),
        gender: get(details, 'patientData.gender'),
        identifierCount: get(details, 'patientData.identifier', []).length
      },
      
      // Results
      matchCount: get(details, 'matchCount', 0),
      matchScores: get(details, 'matchScores', []),
      responseTime: get(details, 'responseTime', 0),
      
      // Security context
      authenticationLevel: get(details, 'authLevel', 'AAL1'),
      sessionId: get(details, 'sessionId'),
      
      // Compliance
      purpose: get(details, 'purpose', 'treatment'),
      dataMinimization: true,
      
      // Status
      success: get(details, 'success', true),
      errorMessage: get(details, 'error')
    };
    
    try {
      const logId = await AuditLogs.insertAsync(auditEntry);
      console.log('Audit log created:', logId);
      return logId;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // In production, alert security team
    }
  },
  
  // Log data access
  logDataAccess: async function(details) {
    const auditEntry = {
      timestamp: new Date(),
      operation: 'data-access',
      userId: get(details, 'userId', 'system'),
      
      // Resource details
      resourceType: get(details, 'resourceType', 'Patient'),
      resourceId: get(details, 'resourceId'),
      action: get(details, 'action', 'read'), // read, write, delete
      
      // Security context
      authenticationLevel: get(details, 'authLevel', 'AAL1'),
      purpose: get(details, 'purpose', 'treatment'),
      
      // Data accessed
      fieldsAccessed: get(details, 'fields', []),
      dataClassification: get(details, 'classification', 'PHI'),
      
      success: get(details, 'success', true)
    };
    
    return await AuditLogs.insertAsync(auditEntry);
  },
  
  // Log security events
  logSecurityEvent: async function(eventType, details) {
    const auditEntry = {
      timestamp: new Date(),
      operation: 'security-event',
      eventType: eventType,
      userId: get(details, 'userId'),
      
      // Event details
      severity: get(details, 'severity', 'info'), // info, warning, critical
      description: get(details, 'description'),
      
      // Context
      ipAddress: get(details, 'ipAddress'),
      userAgent: get(details, 'userAgent'),
      sessionId: get(details, 'sessionId'),
      
      // Response
      actionTaken: get(details, 'actionTaken'),
      blocked: get(details, 'blocked', false)
    };
    
    // Alert on critical events
    if (auditEntry.severity === 'critical') {
      console.error('CRITICAL SECURITY EVENT:', eventType, details);
      // In production, send alerts
    }
    
    return await AuditLogs.insertAsync(auditEntry);
  },
  
  // Generate audit report
  generateAuditReport: async function(criteria = {}) {
    const query = {};
    
    // Time range
    if (criteria.startDate || criteria.endDate) {
      query.timestamp = {};
      if (criteria.startDate) {
        query.timestamp.$gte = new Date(criteria.startDate);
      }
      if (criteria.endDate) {
        query.timestamp.$lte = new Date(criteria.endDate);
      }
    }
    
    // Filter by user
    if (criteria.userId) {
      query.userId = criteria.userId;
    }
    
    // Filter by operation
    if (criteria.operation) {
      query.operation = criteria.operation;
    }
    
    const logs = await AuditLogs.find(query, {
      sort: { timestamp: -1 },
      limit: criteria.limit || 1000
    }).fetchAsync();
    
    // Aggregate statistics
    const stats = {
      totalOperations: logs.length,
      uniqueUsers: [...new Set(logs.map(l => l.userId))].length,
      operationCounts: {},
      failureRate: 0,
      averageResponseTime: 0
    };
    
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let failures = 0;
    
    logs.forEach(log => {
      // Count by operation type
      const op = log.operation || 'unknown';
      stats.operationCounts[op] = (stats.operationCounts[op] || 0) + 1;
      
      // Calculate failure rate
      if (log.success === false) {
        failures++;
      }
      
      // Calculate average response time
      if (log.responseTime) {
        totalResponseTime += log.responseTime;
        responseTimeCount++;
      }
    });
    
    stats.failureRate = logs.length > 0 ? (failures / logs.length) * 100 : 0;
    stats.averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    return {
      criteria: criteria,
      period: {
        start: criteria.startDate || (logs.length > 0 ? logs[logs.length - 1].timestamp : null),
        end: criteria.endDate || (logs.length > 0 ? logs[0].timestamp : null)
      },
      statistics: stats,
      logs: logs
    };
  },
  
  // Retention policy - remove old logs
  applyRetentionPolicy: async function(retentionDays = 365) {
    const cutoffDate = moment().subtract(retentionDays, 'days').toDate();
    
    const result = await AuditLogs.removeAsync({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`Removed ${result} audit logs older than ${retentionDays} days`);
    return result;
  }
};

// Export convenience function for match operations
export async function auditMatchOperation(details) {
  return await AuditLogger.logMatchOperation(details);
}
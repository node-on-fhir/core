// packages/hipaa-compliance/lib/HipaaLogger.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';
import { EventTypes, AuditDetailLevels } from './Constants';

// Core HIPAA Logger class
class HipaaLoggerClass {
  constructor() {
    this.isEnabled = true;
    this.detailLevel = AuditDetailLevels.STANDARD;
  }

  // Initialize logger with settings
  initialize() {
    if (Meteor.isServer) {
      this.isEnabled = get(Meteor, 'settings.public.hipaa.features.auditLogging', true);
      this.detailLevel = get(Meteor, 'settings.public.hipaa.compliance.auditDetailLevel', AuditDetailLevels.STANDARD);
    }
  }

  // Core logging method
  async logEvent(eventData) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      // Build the audit event
      const auditEvent = await this.buildAuditEvent(eventData);
      
      // Validate the event
      if (!this.validateEvent(auditEvent)) {
        console.error('Invalid audit event:', auditEvent);
        return null;
      }

      // Insert the event using core AuditEvents collection
      if (Meteor.isServer) {
        // Get AuditEvents from global Collections
        const AuditEvents = await global.Collections?.AuditEvents;
        if (!AuditEvents) {
          console.error('AuditEvents collection not available');
          return null;
        }
        return await AuditEvents.insertAsync(auditEvent);
      } else {
        // On client, use Meteor method instead
        return Meteor.call('auditEvents.log', 
          auditEvent.eventType, 
          auditEvent.userId, 
          auditEvent.resourceId, 
          auditEvent.message,
          auditEvent
        );
      }
    } catch (error) {
      console.error('Error logging HIPAA event:', error);
      return null;
    }
  }

  // Build audit event with context
  async buildAuditEvent(eventData) {
    const event = {
      eventType: eventData.eventType || EventTypes.ACCESS,
      eventDate: new Date(),
      createdAt: new Date(),
      message: eventData.message
    };

    // Add user context
    const user = await this.getUserContext();
    if (user) {
      event.userId = user._id;
      event.userName = user.username || user.emails?.[0]?.address;
      event.userEmail = user.emails?.[0]?.address;
      event.userRoles = user.roles || [];
    }

    // Add resource information
    if (eventData.resourceType) {
      event.resourceType = eventData.resourceType;
    }
    if (eventData.resourceId) {
      event.resourceId = eventData.resourceId;
    }
    if (eventData.collectionName) {
      event.collectionName = eventData.collectionName;
    }

    // Add patient context
    if (eventData.patientId) {
      event.patientId = eventData.patientId;
      event.patientName = eventData.patientName || await this.getPatientName(eventData.patientId);
    }

    // Add metadata based on detail level
    if (this.detailLevel !== AuditDetailLevels.MINIMAL) {
      event.metadata = eventData.metadata || {};
      
      if (this.detailLevel === AuditDetailLevels.VERBOSE) {
        event.ipAddress = this.getClientIP();
        event.userAgent = this.getUserAgent();
        event.sessionId = this.getSessionId();
      }
    }

    // Add security info
    event.encryptionLevel = get(Meteor, 'settings.private.hipaa.security.encryptionLevel', 'none');

    return event;
  }

  // Validate event has required fields
  validateEvent(event) {
    return event.eventType && event.eventDate;
  }

  // Get current user context
  async getUserContext() {
    if (Meteor.isServer && this.currentInvocation) {
      const userId = this.currentInvocation.userId;
      if (userId) {
        return await Meteor.users.findOneAsync(userId);
      }
    } else if (Meteor.isClient) {
      return Meteor.user();
    }
    return null;
  }

  // Get patient name from ID
  async getPatientName(patientId) {
    if (Meteor.isServer && global.Collections?.Patients) {
      const patient = await global.Collections.Patients.findOneAsync(patientId);
      if (patient) {
        const name = get(patient, 'name[0]', {});
        return `${name.given?.join(' ')} ${name.family}`.trim();
      }
    }
    return null;
  }

  // Get client IP address
  getClientIP() {
    if (Meteor.isServer && this.currentInvocation?.connection) {
      return this.currentInvocation.connection.clientAddress;
    }
    return null;
  }

  // Get user agent
  getUserAgent() {
    if (Meteor.isServer && this.currentInvocation?.connection) {
      return this.currentInvocation.connection.httpHeaders?.['user-agent'];
    }
    return null;
  }

  // Get session ID
  getSessionId() {
    if (Meteor.isClient && Session) {
      return Session.get('sessionId');
    }
    return null;
  }

  // Convenience methods for common events
  async logPatientAccess(patientId, action = 'view') {
    return this.logEvent({
      eventType: action,
      patientId: patientId,
      message: `Patient record ${action}ed`
    });
  }

  async logDataModification(collectionName, recordId, changeType) {
    return this.logEvent({
      eventType: changeType,
      collectionName: collectionName,
      resourceId: recordId,
      message: `${collectionName} record ${changeType}d`
    });
  }

  async logSystemEvent(eventType, details) {
    return this.logEvent({
      eventType: eventType,
      message: details.message || `System event: ${eventType}`,
      metadata: details
    });
  }

  async logSecurityEvent(eventType, details) {
    return this.logEvent({
      eventType: eventType,
      message: details.message || `Security event: ${eventType}`,
      metadata: {
        ...details,
        securityAlert: true
      }
    });
  }

  // Log FHIR AuditEvent
  async logAuditEvent(fhirAuditEvent) {
    const eventData = {
      eventType: get(fhirAuditEvent, 'type.display', 'access'),
      message: get(fhirAuditEvent, 'outcome.text', ''),
      metadata: {
        fhirResource: fhirAuditEvent
      }
    };

    // Extract patient from entity
    const patientEntity = get(fhirAuditEvent, 'entity', []).find(e => 
      get(e, 'what.reference', '').startsWith('Patient/')
    );
    if (patientEntity) {
      eventData.patientId = get(patientEntity, 'what.reference', '').replace('Patient/', '');
    }

    return this.logEvent(eventData);
  }

  // Set current invocation for server context
  setInvocation(invocation) {
    this.currentInvocation = invocation;
  }
}

// Create singleton instance
HipaaLogger = new HipaaLoggerClass();

// Initialize on startup
if (Meteor.isServer) {
  Meteor.startup(function() {
    HipaaLogger.initialize();
  });
}

// Export for use
export { HipaaLogger };
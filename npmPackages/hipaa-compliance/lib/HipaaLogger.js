// npmPackages/hipaa-compliance/lib/HipaaLogger.js
//
// The single audit logger for the package. Server: builds a FHIR R4B
// AuditEvent (lib/AuditEventMapping), runs it through the security pipeline
// (encryption + signature — attached by server/index.js so the client bundle
// never pulls in node crypto), and inserts into the core AuditEvents
// collection. Client: forwards the flat event to the 'hipaa.logEvent' method.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { AuditDetailLevels } from './Constants';
import { buildFhirAuditEvent } from './AuditEventMapping';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

class HipaaLoggerClass {
  constructor() {
    this.isEnabled = true;
    this.detailLevel = AuditDetailLevels.STANDARD;
    this.currentInvocation = null;
    // Server-only encryption/signature stage, attached via
    // attachSecurityPipeline() so this module stays isomorphic.
    this.securityPipeline = null;
  }

  initialize() {
    this.isEnabled = get(Meteor, 'settings.public.hipaa.features.auditLogging', true);
    this.detailLevel = get(Meteor, 'settings.public.hipaa.compliance.auditDetailLevel', AuditDetailLevels.STANDARD);
  }

  // manager must provide secureAuditEvent(fhirEvent) -> fhirEvent
  attachSecurityPipeline(manager) {
    this.securityPipeline = manager;
  }

  // Core logging method. eventData is the flat event shape
  // ({eventType, message, resourceType, resourceId, collectionName,
  //   patientId, patientName, metadata, userId, userName}); context is an
  // optional method invocation / connection-bearing object for user + network
  // attribution (falls back to the setInvocation() compat state).
  async logEvent(eventData, context = null) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      if (Meteor.isClient) {
        return await Meteor.callAsync('hipaa.logEvent', this.toPlainEvent(eventData));
      }

      const flatEvent = await this.enrichWithContext(eventData, context || this.currentInvocation);
      let fhirEvent = buildFhirAuditEvent(flatEvent, this.detailLevel);

      if (this.securityPipeline) {
        fhirEvent = this.securityPipeline.secureAuditEvent(fhirEvent);
      }

      return await this.persist(fhirEvent);
    } catch (error) {
      log.error('Error logging HIPAA event', { error: error && error.message, eventType: get(eventData, 'eventType') });
      return null;
    }
  }

  // Log a pre-built FHIR AuditEvent resource (consent engine, appointments,
  // data importer). The resource is normalized and persisted directly —
  // AuditEvents is the canonical store, so we do not wrap it in metadata.
  async logAuditEvent(fhirAuditEvent, context = null) {
    if (!this.isEnabled) {
      return null;
    }

    try {
      if (Meteor.isClient) {
        return await Meteor.callAsync('hipaa.logAuditEvent', fhirAuditEvent);
      }

      let fhirEvent = Object.assign({}, fhirAuditEvent);
      fhirEvent.resourceType = 'AuditEvent';
      if (!fhirEvent.recorded) {
        fhirEvent.recorded = new Date();
      }
      if (!fhirEvent.type) {
        fhirEvent.type = {
          system: 'http://hl7.org/fhir/audit-event-type',
          code: 'access',
          display: 'access'
        };
      }
      if (!Array.isArray(fhirEvent.agent) || fhirEvent.agent.length === 0) {
        const invocation = context || this.currentInvocation;
        const userId = get(invocation, 'userId');
        fhirEvent.agent = [{
          who: userId
            ? { reference: 'User/' + userId, display: userId }
            : { display: 'System' },
          requestor: true
        }];
      }
      if (!fhirEvent.source) {
        fhirEvent.source = { observer: { display: 'Honeycomb FHIR Server' } };
      }

      if (this.securityPipeline) {
        fhirEvent = this.securityPipeline.secureAuditEvent(fhirEvent);
      }

      return await this.persist(fhirEvent);
    } catch (error) {
      log.error('Error logging FHIR AuditEvent', { error: error && error.message });
      return null;
    }
  }

  async persist(fhirEvent) {
    const AuditEvents = get(global, 'Collections.AuditEvents');
    if (!AuditEvents) {
      log.error('AuditEvents collection not available — audit event dropped', {
        eventType: get(fhirEvent, 'type.code')
      });
      return null;
    }
    return await AuditEvents.insertAsync(fhirEvent);
  }

  // Fill in user identity + network attribution from the invocation context.
  async enrichWithContext(eventData, invocation) {
    const flatEvent = this.toPlainEvent(eventData);

    if (!flatEvent.userId && get(invocation, 'userId')) {
      flatEvent.userId = invocation.userId;
    }

    if (flatEvent.userId && !flatEvent.userName) {
      const user = await Meteor.users.findOneAsync(flatEvent.userId, {
        fields: { username: 1, emails: 1, roles: 1 }
      });
      if (user) {
        flatEvent.userName = get(user, 'username', get(user, 'emails[0].address', flatEvent.userId));
        flatEvent.userEmail = get(user, 'emails[0].address');
        flatEvent.userRoles = get(user, 'roles', []);
      }
    }

    if (this.detailLevel === AuditDetailLevels.VERBOSE && get(invocation, 'connection')) {
      flatEvent.ipAddress = get(invocation, 'connection.clientAddress');
      flatEvent.userAgent = get(invocation, 'connection.httpHeaders.user-agent');
    }

    if (flatEvent.patientId && !flatEvent.patientName) {
      flatEvent.patientName = await this.getPatientName(flatEvent.patientId);
    }

    return flatEvent;
  }

  // Strip non-serializable values so events survive the client -> method hop.
  toPlainEvent(eventData) {
    return {
      eventType: get(eventData, 'eventType', 'access'),
      message: get(eventData, 'message'),
      resourceType: get(eventData, 'resourceType'),
      // recordId is the legacy field name used by core HipaaLogger callers
      resourceId: get(eventData, 'resourceId', get(eventData, 'recordId')),
      collectionName: get(eventData, 'collectionName'),
      patientId: get(eventData, 'patientId'),
      patientName: get(eventData, 'patientName'),
      metadata: get(eventData, 'metadata'),
      userId: get(eventData, 'userId'),
      userName: get(eventData, 'userName'),
      userEmail: get(eventData, 'userEmail'),
      userRoles: get(eventData, 'userRoles'),
      eventDate: get(eventData, 'eventDate')
    };
  }

  async getPatientName(patientId) {
    const Patients = get(global, 'Collections.Patients');
    if (Meteor.isServer && Patients) {
      const patient = await Patients.findOneAsync(patientId);
      if (patient) {
        const name = get(patient, 'name[0]', {});
        return ((get(name, 'given', []) || []).join(' ') + ' ' + get(name, 'family', '')).trim();
      }
    }
    return null;
  }

  // Convenience methods (public API preserved)
  async logPatientAccess(patientId, action = 'view') {
    return this.logEvent({
      eventType: action,
      patientId: patientId,
      message: 'Patient record ' + action
    });
  }

  async logDataModification(collectionName, recordId, changeType) {
    return this.logEvent({
      eventType: changeType,
      collectionName: collectionName,
      resourceId: recordId,
      message: collectionName + ' record ' + changeType
    });
  }

  async logSystemEvent(eventType, details = {}) {
    return this.logEvent({
      eventType: eventType,
      userId: get(details, 'userId'),
      userName: get(details, 'userName'),
      message: get(details, 'message', 'System event: ' + eventType),
      metadata: details
    });
  }

  async logSecurityEvent(eventType, details = {}) {
    return this.logEvent({
      eventType: eventType,
      userId: get(details, 'userId'),
      userName: get(details, 'userName'),
      message: get(details, 'message', 'Security event: ' + eventType),
      metadata: Object.assign({}, details, { securityAlert: true })
    });
  }

  // Compat: callers that set the invocation before logging. Prefer passing
  // the context directly to logEvent(eventData, context).
  setInvocation(invocation) {
    this.currentInvocation = invocation;
  }
}

export const HipaaLogger = new HipaaLoggerClass();

Meteor.startup(function() {
  HipaaLogger.initialize();
});

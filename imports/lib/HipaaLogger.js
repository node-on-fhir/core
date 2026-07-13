import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

/*
var hipaaEvent = {
  eventType: "",
  userId: "",
  userName: "",
  collectionName: "",
  recordId: "",
  patientId: "",
  patientName: "",
  message: ""
};
*/


const HipaaLogger = {
  /**
  * @summary Logs a FHIR AuditEvent
  * @locus Client
  * @memberOf HipaaLogger
  * @name logAuditEvent
  * @param AuditEvent
  * @version 1.2.3
  */
  logAuditEvent: function(auditEvent){
    check(auditEvent, Object);

    process.env.DEBUG && console.log('auditEvent', auditEvent);

    // Check if HIPAA package is available and use its enhanced logger
    // (registered on the Package registry by the workflow loaders —
    // .claude/rules/fhir/package-registry.md)
    const hipaaPackage = globalThis.Package && globalThis.Package['@node-on-fhir/hipaa-compliance'];
    if (hipaaPackage) {
      const packageLogger = hipaaPackage.HipaaLogger;
      if (packageLogger && packageLogger.logAuditEvent) {
        return packageLogger.logAuditEvent(auditEvent);
      }
    }

    // Fallback to core audit logging
    if (Meteor.isServer) {
      return Meteor.callAsync("auditEvents.log", 'audit', null, null, 'FHIR AuditEvent logged', {
        fhirResource: auditEvent
      });
    }
    return Meteor.call("auditEvents.log", 'audit', null, null, 'FHIR AuditEvent logged', {
      fhirResource: auditEvent
    });
  },

  /**
  * @summary Logs a HIPAA event
  * @locus Client
  * @memberOf HipaaLogger
  * @name logEvent
  * @param hipaaEvent
  * @version 1.2.3
  * @example
  * ```js
  * var hipaaEvent = {
  *   eventType: "update",
  *   userId: Meteor.userId(),
  *   userName: Meteor.user().fullName(),
  *   collectionName: "Medications",
  *   recordId: Random.id(),
  *   patientId: Session.get('currentPatientId'),
  *   patientName: Session.get('currentPatientName')
  * };
  * HipaaLogger.logEvent(hipaaEvent);
  * ```
  */
  logEvent: function(hipaaEvent){
    check(hipaaEvent, Object);

    // Check if HIPAA package is available and use its enhanced logger
    const hipaaPackage = globalThis.Package && globalThis.Package['@node-on-fhir/hipaa-compliance'];
    if (hipaaPackage) {
      const packageLogger = hipaaPackage.HipaaLogger;
      if (packageLogger && packageLogger.logEvent) {
        return packageLogger.logEvent(hipaaEvent);
      }
    }

    // Fallback to core audit logging
    const resourceId = hipaaEvent.recordId ?
      `${hipaaEvent.collectionName}/${hipaaEvent.recordId}` : null;
    const args = [
      hipaaEvent.eventType || 'access',
      hipaaEvent.userId || Meteor.userId(),
      resourceId,
      hipaaEvent.message || `${hipaaEvent.eventType} on ${hipaaEvent.collectionName}`,
      {
        userName: hipaaEvent.userName,
        collectionName: hipaaEvent.collectionName,
        patientId: hipaaEvent.patientId,
        patientName: hipaaEvent.patientName
      }
    ];

    if (Meteor.isServer) {
      return Meteor.callAsync("auditEvents.log", ...args);
    }
    return Meteor.call("auditEvents.log", ...args);
  }
};

// Make it globally available for backward compatibility
if (typeof window !== 'undefined') {
  window.HipaaLogger = HipaaLogger;
}
if (typeof global !== 'undefined') {
  global.HipaaLogger = HipaaLogger;
}

// Export for ES6 module compatibility
export { HipaaLogger };
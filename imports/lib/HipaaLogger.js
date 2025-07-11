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


HipaaLogger = {
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
    if (Package['clinical:hipaa-compliance']) {
      const packageLogger = Package['clinical:hipaa-compliance'].HipaaLogger;
      if (packageLogger && packageLogger.logAuditEvent) {
        return packageLogger.logAuditEvent(auditEvent);
      }
    }

    // Fallback to core audit logging
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
    if (Package['clinical:hipaa-compliance']) {
      const packageLogger = Package['clinical:hipaa-compliance'].HipaaLogger;
      if (packageLogger && packageLogger.logEvent) {
        return packageLogger.logEvent(hipaaEvent);
      }
    }

    // Fallback to core audit logging
    const resourceId = hipaaEvent.recordId ? 
      `${hipaaEvent.collectionName}/${hipaaEvent.recordId}` : null;
    
    return Meteor.call("auditEvents.log", 
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
    );
  }
};
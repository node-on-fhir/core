// packages/e-prescribing/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import { createNCPDPMessage, parseNCPDPMessage } from './ncpdp-script';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

Meteor.methods({
  /**
   * Send NCPDP SCRIPT message
   */
  'ePrescribing.sendMessage': async function(messageData) {
    console.log('EPrescribing.sendMessage', messageData.messageType);
    
    check(messageData, {
      messageType: Match.OneOf('NewRx', 'RxChangeRequest', 'CancelRx', 'RxFill', 'RxRenewalRequest'),
      prescription: Object,
      timestamp: String
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to send prescriptions');
    }
    
    // Generate NCPDP SCRIPT message based on type
    let ncpdpMessage;
    switch(messageData.messageType) {
      case 'NewRx':
        ncpdpMessage = await createNewRxMessage(messageData.prescription);
        break;
      case 'RxChangeRequest':
        ncpdpMessage = await createRxChangeRequestMessage(messageData.prescription);
        break;
      case 'CancelRx':
        ncpdpMessage = await createCancelRxMessage(messageData.prescription);
        break;
      case 'RxFill':
        ncpdpMessage = await createRxFillMessage(messageData.prescription);
        break;
      case 'RxRenewalRequest':
        ncpdpMessage = await createRxRenewalRequestMessage(messageData.prescription);
        break;
    }
    
    // Create FHIR MedicationRequest
    const medicationRequest = await createFHIRMedicationRequest(messageData.prescription);
    
    // Store the prescription
    let prescriptionId;
    if (global.Collections?.MedicationRequests) {
      const MedicationRequests = await global.Collections.MedicationRequests;
      if (MedicationRequests && typeof MedicationRequests.insertAsync === 'function') {
        prescriptionId = await MedicationRequests.insertAsync(medicationRequest);
      }
    } else {
      prescriptionId = medicationRequest.id;
    }
    
    // Log the transaction
    await logPrescriptionTransaction({
      userId: this.userId,
      prescriptionId: prescriptionId,
      messageType: messageData.messageType,
      ncpdpMessage: ncpdpMessage,
      timestamp: new Date()
    });
    
    // In production, would transmit to pharmacy via Surescripts or similar
    const transmissionResult = await transmitToPharmacy(ncpdpMessage, messageData.prescription.pharmacy);
    
    return {
      success: true,
      prescriptionId: prescriptionId,
      messageId: ncpdpMessage.header.messageId,
      transmissionStatus: transmissionResult.status
    };
  },

  /**
   * Process incoming NCPDP SCRIPT message
   */
  'ePrescribing.receiveMessage': async function(ncpdpXml) {
    console.log('EPrescribing.receiveMessage');
    
    check(ncpdpXml, String);
    
    // Parse NCPDP SCRIPT message
    const parsedMessage = await parseNCPDPMessage(ncpdpXml);
    
    // Process based on message type
    let result;
    switch(parsedMessage.messageType) {
      case 'RxFill':
        result = await processRxFillMessage(parsedMessage);
        break;
      case 'RxRenewalRequest':
        result = await processRxRenewalRequest(parsedMessage);
        break;
      case 'RxChangeRequest':
        result = await processRxChangeRequest(parsedMessage);
        break;
      case 'Status':
        result = await processStatusMessage(parsedMessage);
        break;
      case 'Error':
        result = await processErrorMessage(parsedMessage);
        break;
    }
    
    // Log incoming message
    await logIncomingMessage({
      messageType: parsedMessage.messageType,
      messageId: parsedMessage.header.messageId,
      fromPharmacy: parsedMessage.header.from,
      timestamp: new Date(),
      result: result
    });
    
    return result;
  },

  /**
   * Get prescription history for a patient
   */
  'ePrescribing.getPatientPrescriptions': async function(patientId) {
    log.debug('EPrescribing.getPatientPrescriptions', { patientId });
    
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const prescriptions = [];
    
    if (global.Collections?.MedicationRequests) {
      const MedicationRequests = await global.Collections.MedicationRequests;
      if (MedicationRequests && typeof MedicationRequests.findAsync === 'function') {
        const patientRx = await MedicationRequests.findAsync({
          'subject.reference': `Patient/${patientId}`
        }).fetchAsync();
        
        prescriptions.push(...patientRx);
      }
    }
    
    return prescriptions;
  },

  /**
   * Get pharmacy directory
   */
  'ePrescribing.getPharmacyDirectory': async function(zipCode) {
    console.log('EPrescribing.getPharmacyDirectory', zipCode);
    
    check(zipCode, Match.Optional(String));
    
    // In production, would query NCPDP pharmacy database
    // For demo, return mock data
    return [
      {
        ncpdpId: '1234567',
        name: 'CVS Pharmacy #2401',
        address: {
          street: '123 Main St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02134'
        },
        phone: '617-555-0100',
        fax: '617-555-0101',
        hours: '8am-10pm Daily',
        services: ['retail', '24hour', 'compounding']
      },
      {
        ncpdpId: '2345678',
        name: 'Walgreens #8456',
        address: {
          street: '456 Oak Ave',
          city: 'Boston',
          state: 'MA',
          postalCode: '02135'
        },
        phone: '617-555-0200',
        fax: '617-555-0201',
        hours: '24 hours',
        services: ['retail', '24hour', 'drive-thru']
      }
    ];
  },

  /**
   * Check drug formulary status
   */
  'ePrescribing.checkFormulary': async function(medicationCode, insurancePlan) {
    console.log('EPrescribing.checkFormulary', medicationCode, insurancePlan);
    
    check(medicationCode, String);
    check(insurancePlan, Match.Optional(String));
    
    // In production, would check real formulary database
    // For demo, return mock formulary data
    return {
      medicationCode: medicationCode,
      formularyStatus: 'preferred', // preferred, non-preferred, non-formulary
      copayTier: 1,
      requiresPriorAuth: false,
      stepTherapyRequired: false,
      quantityLimits: {
        maxQuantity: 90,
        maxDaysSupply: 30
      },
      alternatives: [
        {
          code: '12345',
          name: 'Generic Alternative',
          formularyStatus: 'preferred',
          copayTier: 1
        }
      ]
    };
  },

  /**
   * Submit prior authorization
   */
  'ePrescribing.submitPriorAuth': async function(priorAuthData) {
    console.log('EPrescribing.submitPriorAuth', priorAuthData);
    
    check(priorAuthData, {
      prescriptionId: String,
      diagnosis: String,
      clinicalJustification: String,
      supportingDocuments: Match.Optional([String])
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    // Create prior auth request
    const priorAuthRequest = {
      id: Random.id(),
      prescriptionId: priorAuthData.prescriptionId,
      requestDate: new Date(),
      status: 'pending',
      diagnosis: priorAuthData.diagnosis,
      justification: priorAuthData.clinicalJustification,
      prescriber: this.userId,
      reviewDeadline: new Date(Date.now() + 72 * 3600000) // 72 hours
    };
    
    // In production, would submit to PBM
    const paNumber = 'PA' + Random.id().substring(0, 8).toUpperCase();
    
    return {
      success: true,
      priorAuthNumber: paNumber,
      status: 'pending',
      message: 'Prior authorization submitted successfully'
    };
  }
});

// Helper function to create NewRx message
async function createNewRxMessage(prescription) {
  return createNCPDPMessage('NewRx', {
    patient: {
      identification: prescription.patient,
      name: { last: 'Doe', first: 'John' }, // Would get from patient record
      dateOfBirth: '19700101',
      gender: 'M',
      address: {
        addressLine1: '123 Main St',
        city: 'Boston',
        state: 'MA',
        postalCode: '02134'
      }
    },
    prescriber: {
      identification: {
        ncpdpId: '1234567890',
        npi: '1234567890',
        dea: 'BM1234567'
      },
      name: { last: 'Smith', first: 'Jane', prefix: 'Dr.' },
      address: {
        addressLine1: '100 Medical Plaza',
        city: 'Boston',
        state: 'MA',
        postalCode: '02135'
      },
      phoneNumbers: {
        business: '6175550100'
      }
    },
    pharmacy: {
      identification: {
        ncpdpId: prescription.pharmacy?.ncpdpId || '1234567'
      }
    },
    medicationPrescribed: {
      drugDescription: prescription.medication?.name + ' ' + prescription.strength,
      drugCoded: {
        productCode: prescription.medication?.ndc,
        productCodeQualifier: 'ND'
      },
      quantity: {
        value: prescription.quantity,
        codeListQualifier: '38',
        unitOfMeasure: 'EA'
      },
      directions: prescription.sig,
      substitutions: prescription.substitution === 'allowed' ? '0' : '1',
      refills: {
        qualifier: 'R',
        value: prescription.refills
      }
    }
  });
}

// Helper function to create RxChangeRequest message
async function createRxChangeRequestMessage(prescription) {
  return createNCPDPMessage('RxChangeRequest', {
    referenceNumber: prescription.originalRxNumber,
    changeType: prescription.changeType || 'dosageChange',
    requestedChange: prescription.requestedChange,
    reason: prescription.changeReason
  });
}

// Helper function to create CancelRx message
async function createCancelRxMessage(prescription) {
  return createNCPDPMessage('CancelRx', {
    referenceNumber: prescription.rxNumber,
    cancelReason: prescription.cancelReason || 'Prescriber request'
  });
}

// Helper function to create RxFill message
async function createRxFillMessage(prescription) {
  return createNCPDPMessage('RxFill', {
    referenceNumber: prescription.rxNumber,
    fillNumber: prescription.fillNumber || '1',
    quantityDispensed: prescription.quantityDispensed,
    daysSupply: prescription.daysSupply || '30',
    fillDate: new Date().toISOString()
  });
}

// Helper function to create RxRenewalRequest message  
async function createRxRenewalRequestMessage(prescription) {
  return createNCPDPMessage('RxRenewalRequest', {
    referenceNumber: prescription.rxNumber,
    renewalReason: prescription.renewalReason || 'Continuation of therapy'
  });
}

// Helper function to create FHIR MedicationRequest
async function createFHIRMedicationRequest(prescription) {
  return {
    resourceType: 'MedicationRequest',
    id: Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString()
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [{
        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
        code: prescription.medication?.rxnorm || '000000',
        display: prescription.medication?.name
      }],
      text: prescription.medication?.name + ' ' + prescription.strength
    },
    subject: {
      reference: `Patient/${prescription.patient}`
    },
    authoredOn: new Date().toISOString(),
    requester: {
      reference: `Practitioner/${Meteor.userId()}`
    },
    dosageInstruction: [{
      text: prescription.sig,
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: 'd'
        }
      }
    }],
    dispenseRequest: {
      validityPeriod: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 365 * 24 * 3600000).toISOString()
      },
      numberOfRepeatsAllowed: parseInt(prescription.refills) || 0,
      quantity: {
        value: parseInt(prescription.quantity),
        unit: 'EA'
      }
    },
    substitution: {
      allowedBoolean: prescription.substitution === 'allowed'
    }
  };
}

// Helper function to transmit to pharmacy
async function transmitToPharmacy(ncpdpMessage, pharmacy) {
  // In production, would use Surescripts or direct pharmacy connection
  // For demo, simulate transmission
  console.log('Transmitting to pharmacy:', pharmacy?.name);
  
  return {
    status: 'transmitted',
    timestamp: new Date().toISOString(),
    confirmationNumber: 'TRX' + Random.id().substring(0, 10).toUpperCase()
  };
}

// Helper function to process RxFill message
async function processRxFillMessage(message) {
  // Update prescription fill status
  const fillData = message.body.rxFill;
  
  // In production, would update MedicationDispense resource
  return {
    success: true,
    fillNumber: fillData.fillNumber,
    quantityDispensed: fillData.quantityDispensed,
    status: 'dispensed'
  };
}

// Helper function to process renewal request
async function processRxRenewalRequest(message) {
  // Create task for prescriber to review
  const renewalData = message.body.renewalRequest;
  
  return {
    success: true,
    taskCreated: true,
    renewalRequestId: message.header.messageId,
    requiresReview: true
  };
}

// Helper function to process change request
async function processRxChangeRequest(message) {
  // Create task for prescriber to review
  const changeData = message.body.changeRequest;
  
  return {
    success: true,
    changeRequestId: message.header.messageId,
    requestedChange: changeData.requestedChange,
    requiresReview: true
  };
}

// Helper function to process status message
async function processStatusMessage(message) {
  return {
    success: true,
    status: message.body.status,
    timestamp: message.header.sentTime
  };
}

// Helper function to process error message
async function processErrorMessage(message) {
  console.error('NCPDP Error:', message.body.error);
  
  return {
    success: false,
    error: message.body.error,
    code: message.body.errorCode
  };
}

// Helper function to log prescription transaction
async function logPrescriptionTransaction(data) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Electronic Prescription'
    },
    subtype: [{
      system: 'http://ncpdp.org/SCRIPT',
      code: data.messageType,
      display: data.messageType
    }],
    action: 'C',
    recorded: data.timestamp.toISOString(),
    outcome: '0',
    agent: [{
      who: {
        reference: `Practitioner/${data.userId}`
      },
      requestor: true
    }],
    entity: [{
      what: {
        reference: `MedicationRequest/${data.prescriptionId}`
      },
      detail: [{
        type: 'messageId',
        valueString: data.ncpdpMessage.header.messageId
      }]
    }]
  };
  
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
    }
  }
}

// Helper function to log incoming messages
async function logIncomingMessage(data) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'NCPDP Message Received'
    },
    subtype: [{
      system: 'http://ncpdp.org/SCRIPT',
      code: data.messageType
    }],
    action: 'R',
    recorded: data.timestamp.toISOString(),
    outcome: data.result.success ? '0' : '8',
    source: {
      observer: {
        display: data.fromPharmacy
      }
    },
    entity: [{
      detail: [{
        type: 'messageId',
        valueString: data.messageId
      }]
    }]
  };
  
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
    }
  }
}
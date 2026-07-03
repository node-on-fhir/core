// packages/e-prescribing/server/ncpdp-script.js

import { Random } from 'meteor/random';

/**
 * NCPDP SCRIPT 2017071 Message Generator
 * Implements core message types for electronic prescribing
 */

// NCPDP SCRIPT Version
const SCRIPT_VERSION = '2017071';

/**
 * Create NCPDP SCRIPT message
 */
export function createNCPDPMessage(messageType, data) {
  const message = {
    header: createMessageHeader(messageType),
    body: {}
  };
  
  switch(messageType) {
    case 'NewRx':
      message.body = createNewRxBody(data);
      break;
    case 'RxChangeRequest':
      message.body = createRxChangeRequestBody(data);
      break;
    case 'CancelRx':
      message.body = createCancelRxBody(data);
      break;
    case 'RxFill':
      message.body = createRxFillBody(data);
      break;
    case 'RxRenewalRequest':
      message.body = createRxRenewalRequestBody(data);
      break;
  }
  
  // Convert to XML format (simplified for demo)
  return convertToXML(message);
}

/**
 * Parse incoming NCPDP SCRIPT message
 */
export function parseNCPDPMessage(xmlString) {
  // In production, would use proper XML parser
  // For demo, return parsed structure
  return {
    messageType: extractMessageType(xmlString),
    header: {
      messageId: Random.id(),
      version: SCRIPT_VERSION,
      sentTime: new Date().toISOString(),
      from: extractSender(xmlString),
      to: extractRecipient(xmlString)
    },
    body: extractMessageBody(xmlString)
  };
}

// Create message header
function createMessageHeader(messageType) {
  return {
    messageId: generateMessageId(),
    version: SCRIPT_VERSION,
    releaseNumber: '006',
    transactionDomain: 'SCRIPT',
    transactionVersion: SCRIPT_VERSION,
    transactionType: messageType,
    sentTime: new Date().toISOString(),
    senderSoftware: {
      vendorName: 'Honeycomb Health',
      softwareName: 'Honeycomb EHR',
      softwareVersion: '3.0'
    }
  };
}

// Generate unique message ID
function generateMessageId() {
  const timestamp = Date.now().toString(36);
  const random = Random.id().substring(0, 6);
  return `MSG-${timestamp}-${random}`.toUpperCase();
}

// Create NewRx message body
function createNewRxBody(data) {
  return {
    newRx: {
      patient: {
        humanPatient: {
          name: data.patient.name,
          gender: data.patient.gender,
          dateOfBirth: {
            date: data.patient.dateOfBirth
          },
          address: data.patient.address,
          identification: {
            medicalRecordIdentificationNumberEHR: data.patient.identification
          }
        }
      },
      prescriber: {
        humanPrescriber: {
          identification: {
            npi: data.prescriber.identification.npi,
            deaNumber: data.prescriber.identification.dea,
            ncpdpId: data.prescriber.identification.ncpdpId
          },
          name: data.prescriber.name,
          address: data.prescriber.address,
          phoneNumbers: data.prescriber.phoneNumbers
        }
      },
      pharmacy: {
        identification: {
          ncpdpId: data.pharmacy.identification.ncpdpId
        }
      },
      medicationPrescribed: {
        drugDescription: data.medicationPrescribed.drugDescription,
        drugCoded: data.medicationPrescribed.drugCoded,
        quantity: data.medicationPrescribed.quantity,
        daysSupply: '30',
        directions: {
          sigText: data.medicationPrescribed.directions
        },
        refills: data.medicationPrescribed.refills,
        substitutions: data.medicationPrescribed.substitutions,
        writtenDate: {
          date: new Date().toISOString().split('T')[0].replace(/-/g, '')
        }
      }
    }
  };
}

// Create RxChangeRequest message body
function createRxChangeRequestBody(data) {
  return {
    rxChangeRequest: {
      rxReferenceNumber: data.referenceNumber,
      prescriberOrderNumber: generatePrescriberOrderNumber(),
      changeRequest: {
        changeType: data.changeType,
        changeReason: {
          code: '001',
          description: data.reason
        },
        requestedValue: data.requestedChange
      }
    }
  };
}

// Create CancelRx message body
function createCancelRxBody(data) {
  return {
    cancelRx: {
      rxReferenceNumber: data.referenceNumber,
      cancelReason: {
        code: '001',
        description: data.cancelReason
      },
      cancelDate: new Date().toISOString().split('T')[0].replace(/-/g, '')
    }
  };
}

// Create RxFill message body
function createRxFillBody(data) {
  return {
    rxFill: {
      rxReferenceNumber: data.referenceNumber,
      fillNumber: data.fillNumber,
      dispensedDate: {
        date: data.fillDate.split('T')[0].replace(/-/g, '')
      },
      writtenDate: {
        date: new Date().toISOString().split('T')[0].replace(/-/g, '')
      },
      quantityDispensed: {
        value: data.quantityDispensed,
        codeListQualifier: '38',
        unitOfMeasure: 'EA'
      },
      daysSupply: data.daysSupply,
      drugDispensed: {
        drugCoded: {
          productCode: data.ndc || '00000000000',
          productCodeQualifier: 'ND'
        }
      },
      fillStatus: {
        code: 'DF',
        description: 'Dispensed'
      }
    }
  };
}

// Create RxRenewalRequest message body
function createRxRenewalRequestBody(data) {
  return {
    rxRenewalRequest: {
      rxReferenceNumber: data.referenceNumber,
      renewalRequestInfo: {
        requestDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        reason: data.renewalReason,
        numberOfRefills: '3'
      }
    }
  };
}

// Generate prescriber order number
function generatePrescriberOrderNumber() {
  return 'RX' + Date.now().toString(36).toUpperCase();
}

// Convert message object to XML format
function convertToXML(message) {
  // Simplified XML generation for demo
  // In production, use proper XML builder
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<Message xmlns="http://www.ncpdp.org/schema/SCRIPT" version="${SCRIPT_VERSION}" release="006">\n`;
  
  // Add header
  xml += '  <Header>\n';
  xml += `    <To Qualifier="P">${message.header.to || 'PHARMACY'}</To>\n`;
  xml += `    <From Qualifier="D">${message.header.from || 'PRESCRIBER'}</From>\n`;
  xml += `    <MessageID>${message.header.messageId}</MessageID>\n`;
  xml += `    <SentTime>${message.header.sentTime}</SentTime>\n`;
  xml += '  </Header>\n';
  
  // Add body based on message type
  xml += '  <Body>\n';
  xml += serializeBody(message.body);
  xml += '  </Body>\n';
  
  xml += '</Message>';
  
  return xml;
}

// Serialize message body to XML
function serializeBody(body) {
  // Simplified serialization for demo
  let xml = '';
  
  if (body.newRx) {
    xml += '    <NewRx>\n';
    xml += '      <Patient>\n';
    if (body.newRx.patient?.humanPatient) {
      const patient = body.newRx.patient.humanPatient;
      xml += `        <HumanPatient>\n`;
      xml += `          <Name>\n`;
      xml += `            <LastName>${patient.name.last}</LastName>\n`;
      xml += `            <FirstName>${patient.name.first}</FirstName>\n`;
      xml += `          </Name>\n`;
      xml += `          <Gender>${patient.gender}</Gender>\n`;
      xml += `          <DateOfBirth>${patient.dateOfBirth.date}</DateOfBirth>\n`;
      xml += `        </HumanPatient>\n`;
    }
    xml += '      </Patient>\n';
    
    xml += '      <Prescriber>\n';
    if (body.newRx.prescriber?.humanPrescriber) {
      const prescriber = body.newRx.prescriber.humanPrescriber;
      xml += `        <HumanPrescriber>\n`;
      xml += `          <Identification>\n`;
      xml += `            <NPI>${prescriber.identification.npi}</NPI>\n`;
      if (prescriber.identification.deaNumber) {
        xml += `            <DEANumber>${prescriber.identification.deaNumber}</DEANumber>\n`;
      }
      xml += `          </Identification>\n`;
      xml += `          <Name>\n`;
      xml += `            <LastName>${prescriber.name.last}</LastName>\n`;
      xml += `            <FirstName>${prescriber.name.first}</FirstName>\n`;
      xml += `          </Name>\n`;
      xml += `        </HumanPrescriber>\n`;
    }
    xml += '      </Prescriber>\n';
    
    xml += '      <MedicationPrescribed>\n';
    const med = body.newRx.medicationPrescribed;
    xml += `        <DrugDescription>${med.drugDescription}</DrugDescription>\n`;
    xml += `        <Quantity>\n`;
    xml += `          <Value>${med.quantity.value}</Value>\n`;
    xml += `          <CodeListQualifier>${med.quantity.codeListQualifier}</CodeListQualifier>\n`;
    xml += `          <UnitOfMeasure>${med.quantity.unitOfMeasure}</UnitOfMeasure>\n`;
    xml += `        </Quantity>\n`;
    xml += `        <Directions>${med.directions.sigText || med.directions}</Directions>\n`;
    xml += `        <Refills>\n`;
    xml += `          <Qualifier>${med.refills.qualifier}</Qualifier>\n`;
    xml += `          <Value>${med.refills.value}</Value>\n`;
    xml += `        </Refills>\n`;
    xml += `        <Substitutions>${med.substitutions}</Substitutions>\n`;
    xml += '      </MedicationPrescribed>\n';
    xml += '    </NewRx>\n';
  } else if (body.rxChangeRequest) {
    xml += '    <RxChangeRequest>\n';
    xml += `      <RxReferenceNumber>${body.rxChangeRequest.rxReferenceNumber}</RxReferenceNumber>\n`;
    xml += `      <PrescriberOrderNumber>${body.rxChangeRequest.prescriberOrderNumber}</PrescriberOrderNumber>\n`;
    xml += '    </RxChangeRequest>\n';
  } else if (body.cancelRx) {
    xml += '    <CancelRx>\n';
    xml += `      <RxReferenceNumber>${body.cancelRx.rxReferenceNumber}</RxReferenceNumber>\n`;
    xml += `      <CancelReason>${body.cancelRx.cancelReason.description}</CancelReason>\n`;
    xml += '    </CancelRx>\n';
  } else if (body.rxFill) {
    xml += '    <RxFill>\n';
    xml += `      <RxReferenceNumber>${body.rxFill.rxReferenceNumber}</RxReferenceNumber>\n`;
    xml += `      <FillNumber>${body.rxFill.fillNumber}</FillNumber>\n`;
    xml += `      <QuantityDispensed>\n`;
    xml += `        <Value>${body.rxFill.quantityDispensed.value}</Value>\n`;
    xml += `      </QuantityDispensed>\n`;
    xml += `      <DaysSupply>${body.rxFill.daysSupply}</DaysSupply>\n`;
    xml += '    </RxFill>\n';
  } else if (body.rxRenewalRequest) {
    xml += '    <RxRenewalRequest>\n';
    xml += `      <RxReferenceNumber>${body.rxRenewalRequest.rxReferenceNumber}</RxReferenceNumber>\n`;
    xml += '    </RxRenewalRequest>\n';
  }
  
  return xml;
}

// Extract message type from XML
function extractMessageType(xmlString) {
  // Simplified extraction for demo
  if (xmlString.includes('<NewRx>')) return 'NewRx';
  if (xmlString.includes('<RxFill>')) return 'RxFill';
  if (xmlString.includes('<RxChangeRequest>')) return 'RxChangeRequest';
  if (xmlString.includes('<RxRenewalRequest>')) return 'RxRenewalRequest';
  if (xmlString.includes('<CancelRx>')) return 'CancelRx';
  if (xmlString.includes('<Status>')) return 'Status';
  if (xmlString.includes('<Error>')) return 'Error';
  return 'Unknown';
}

// Extract sender from XML
function extractSender(xmlString) {
  const match = xmlString.match(/<From[^>]*>([^<]+)<\/From>/);
  return match ? match[1] : 'Unknown';
}

// Extract recipient from XML
function extractRecipient(xmlString) {
  const match = xmlString.match(/<To[^>]*>([^<]+)<\/To>/);
  return match ? match[1] : 'Unknown';
}

// Extract message body from XML
function extractMessageBody(xmlString) {
  // Simplified extraction for demo
  // In production, use proper XML parser
  return {
    raw: xmlString
  };
}

// Validate NCPDP message
export function validateNCPDPMessage(message) {
  const errors = [];
  
  // Check required header fields
  if (!message.header?.messageId) {
    errors.push('Missing message ID');
  }
  
  if (!message.header?.transactionType) {
    errors.push('Missing transaction type');
  }
  
  // Check body based on message type
  if (message.header?.transactionType === 'NewRx') {
    if (!message.body?.newRx?.patient) {
      errors.push('Missing patient information');
    }
    if (!message.body?.newRx?.prescriber) {
      errors.push('Missing prescriber information');
    }
    if (!message.body?.newRx?.medicationPrescribed) {
      errors.push('Missing medication information');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Format NCPDP date
export function formatNCPDPDate(date) {
  // NCPDP uses YYYYMMDD format
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Parse NCPDP date
export function parseNCPDPDate(dateString) {
  // YYYYMMDD format
  if (dateString.length !== 8) return null;
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  return new Date(`${year}-${month}-${day}`);
}
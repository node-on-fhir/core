// packages/clinical-documents/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// Mock FHIR to CCDA conversion (in production, use the fhir2ccda library)
const generateCCDAFromFHIR = async (bundle, options) => {
  // In production, this would use the fhir2ccda library:
  // const fhir2ccda = require('../../../workzone/legacy-pkgs/fhir2ccda');
  // return fhir2ccda.convert(bundle, options);
  
  // For demonstration, return a mock CCDA document
  const documentType = options.documentType || 'CCD';
  const patientName = bundle.patient?.name || 'Unknown Patient';
  
  const ccdaXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <!-- C-CDA R2.1 ${documentType} -->
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  
  <!-- Document Type -->
  <templateId root="2.16.840.1.113883.10.20.22.1.1" extension="2015-08-01"/>
  <templateId root="2.16.840.1.113883.10.20.22.1.2" extension="2015-08-01"/>
  
  <id root="${Random.id()}"/>
  <code code="${options.loincCode}" codeSystem="2.16.840.1.113883.6.1" displayName="${documentType}"/>
  <title>${documentType} for ${patientName}</title>
  <effectiveTime value="${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <languageCode code="en-US"/>
  
  <!-- Patient -->
  <recordTarget>
    <patientRole>
      <id root="2.16.840.1.113883.3.1" extension="${bundle.patient?.id || Random.id()}"/>
      <patient>
        <name>
          <given>${bundle.patient?.firstName || 'John'}</given>
          <family>${bundle.patient?.lastName || 'Doe'}</family>
        </name>
        <administrativeGenderCode code="${bundle.patient?.gender || 'M'}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${bundle.patient?.birthDate || '19700101'}"/>
      </patient>
    </patientRole>
  </recordTarget>
  
  <!-- Author -->
  <author>
    <time value="${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}"/>
    <assignedAuthor>
      <id root="2.16.840.1.113883.3.1"/>
      <assignedPerson>
        <name>
          <prefix>Dr.</prefix>
          <given>System</given>
          <family>Generated</family>
        </name>
      </assignedPerson>
    </assignedAuthor>
  </author>
  
  <!-- Custodian -->
  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id root="2.16.840.1.113883.3.1"/>
        <name>Honeycomb Health System</name>
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>
  
  <!-- Document Body -->
  <component>
    <structuredBody>
      ${generateSections(bundle, options.sections)}
    </structuredBody>
  </component>
</ClinicalDocument>`;

  return ccdaXml;
};

// Generate sections based on selected options
const generateSections = (bundle, sections) => {
  let sectionsXml = '';
  
  if (sections.Allergies) {
    sectionsXml += generateAllergiesSection(bundle.allergies);
  }
  if (sections.Medications) {
    sectionsXml += generateMedicationsSection(bundle.medications);
  }
  if (sections.Problems) {
    sectionsXml += generateProblemsSection(bundle.problems);
  }
  if (sections.Procedures) {
    sectionsXml += generateProceduresSection(bundle.procedures);
  }
  if (sections.Results) {
    sectionsXml += generateResultsSection(bundle.results);
  }
  if (sections['Vital Signs']) {
    sectionsXml += generateVitalSignsSection(bundle.vitalSigns);
  }
  
  return sectionsXml;
};

// Generate Allergies section
const generateAllergiesSection = (allergies = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.6.1" extension="2015-08-01"/>
        <code code="48765-2" codeSystem="2.16.840.1.113883.6.1" displayName="Allergies and Adverse Reactions"/>
        <title>Allergies and Adverse Reactions</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Allergen</th>
                <th>Reaction</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${allergies.map(a => `
                <tr>
                  <td>${a.allergen || 'Unknown'}</td>
                  <td>${a.reaction || 'Unknown'}</td>
                  <td>${a.severity || 'Moderate'}</td>
                  <td>${a.status || 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

// Generate Medications section
const generateMedicationsSection = (medications = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.1.1" extension="2014-06-09"/>
        <code code="10160-0" codeSystem="2.16.840.1.113883.6.1" displayName="Medications"/>
        <title>Medications</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${medications.map(m => `
                <tr>
                  <td>${m.name || 'Unknown'}</td>
                  <td>${m.dose || 'Unknown'}</td>
                  <td>${m.frequency || 'Unknown'}</td>
                  <td>${m.status || 'Active'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

// Generate Problems section
const generateProblemsSection = (problems = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.5.1" extension="2015-08-01"/>
        <code code="11450-4" codeSystem="2.16.840.1.113883.6.1" displayName="Problem List"/>
        <title>Problem List</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Problem</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${problems.map(p => `
                <tr>
                  <td>${p.name || 'Unknown'}</td>
                  <td>${p.status || 'Active'}</td>
                  <td>${p.date || 'Unknown'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

// Generate Procedures section
const generateProceduresSection = (procedures = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.7.1" extension="2014-06-09"/>
        <code code="47519-4" codeSystem="2.16.840.1.113883.6.1" displayName="Procedures"/>
        <title>Procedures</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Procedure</th>
                <th>Date</th>
                <th>Provider</th>
              </tr>
            </thead>
            <tbody>
              ${procedures.map(p => `
                <tr>
                  <td>${p.name || 'Unknown'}</td>
                  <td>${p.date || 'Unknown'}</td>
                  <td>${p.provider || 'Unknown'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

// Generate Results section
const generateResultsSection = (results = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.3.1" extension="2015-08-01"/>
        <code code="30954-2" codeSystem="2.16.840.1.113883.6.1" displayName="Results"/>
        <title>Results</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Units</th>
                <th>Reference Range</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(r => `
                <tr>
                  <td>${r.test || 'Unknown'}</td>
                  <td>${r.value || 'Unknown'}</td>
                  <td>${r.units || ''}</td>
                  <td>${r.reference || ''}</td>
                  <td>${r.date || 'Unknown'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

// Generate Vital Signs section  
const generateVitalSignsSection = (vitalSigns = []) => {
  return `
    <component>
      <section>
        <templateId root="2.16.840.1.113883.10.20.22.2.4.1" extension="2015-08-01"/>
        <code code="8716-3" codeSystem="2.16.840.1.113883.6.1" displayName="Vital Signs"/>
        <title>Vital Signs</title>
        <text>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>BP</th>
                <th>Pulse</th>
                <th>Temp</th>
                <th>Resp</th>
                <th>O2 Sat</th>
              </tr>
            </thead>
            <tbody>
              ${vitalSigns.map(v => `
                <tr>
                  <td>${v.date || 'Unknown'}</td>
                  <td>${v.bp || '-'}</td>
                  <td>${v.pulse || '-'}</td>
                  <td>${v.temp || '-'}</td>
                  <td>${v.resp || '-'}</td>
                  <td>${v.o2sat || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </text>
      </section>
    </component>`;
};

Meteor.methods({
  /**
   * Generate C-CDA document from FHIR resources
   */
  'clinicalDocuments.generateCCDA': async function(options) {
    console.log('ClinicalDocuments.generateCCDA', options);
    
    check(options, {
      patientId: String,
      documentType: String,
      format: Match.OneOf('xml', 'json'),
      includeNarrative: Boolean,
      validateDocument: Boolean,
      sections: Object
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to generate documents');
    }
    
    try {
      // Gather patient data from FHIR resources
      const bundle = await gatherPatientData(options.patientId);
      
      // Generate CCDA document
      const ccdaContent = await generateCCDAFromFHIR(bundle, {
        documentType: getDocumentTypeName(options.documentType),
        loincCode: options.documentType,
        sections: options.sections,
        includeNarrative: options.includeNarrative
      });
      
      // Validate if requested
      let validationResults = { isValid: true };
      if (options.validateDocument) {
        validationResults = await validateCCDA(ccdaContent);
      }
      
      // Convert to JSON if requested
      let finalContent = ccdaContent;
      if (options.format === 'json') {
        // In production, convert XML to FHIR JSON
        // For now, return a mock JSON structure
        finalContent = JSON.stringify({
          resourceType: 'Bundle',
          type: 'document',
          entry: [{
            resource: {
              resourceType: 'Composition',
              title: getDocumentTypeName(options.documentType),
              date: new Date().toISOString(),
              subject: { reference: `Patient/${options.patientId}` }
            }
          }]
        }, null, 2);
      }
      
      // Store document reference
      const documentId = await storeDocumentReference({
        patientId: options.patientId,
        documentType: options.documentType,
        format: options.format,
        content: finalContent,
        userId: this.userId
      });
      
      // Log for audit compliance
      await logDocumentGeneration({
        userId: this.userId,
        patientId: options.patientId,
        documentType: options.documentType,
        documentId: documentId,
        timestamp: new Date()
      });
      
      return {
        success: true,
        documentId: documentId,
        content: finalContent,
        validation: validationResults,
        filename: `CCDA_${options.patientId}_${new Date().toISOString()}.${options.format}`
      };
      
    } catch (error) {
      console.error('Error generating CCDA:', error);
      throw new Meteor.Error('generation-failed', error.message);
    }
  },
  
  /**
   * Validate C-CDA document against schematron
   */
  'clinicalDocuments.validateCCDA': async function(ccdaContent) {
    console.log('ClinicalDocuments.validateCCDA');
    
    check(ccdaContent, String);
    
    // In production, use actual schematron validation
    // For demonstration, return mock validation results
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    // Simulate basic validation checks
    if (!ccdaContent.includes('<ClinicalDocument')) {
      validationResults.isValid = false;
      validationResults.errors.push({
        type: 'Structure Error',
        message: 'Missing ClinicalDocument root element'
      });
    }
    
    if (!ccdaContent.includes('templateId')) {
      validationResults.warnings.push('Missing template ID declarations');
    }
    
    return validationResults;
  },
  
  /**
   * Get list of generated documents for a patient
   */
  'clinicalDocuments.getPatientDocuments': async function(patientId) {
    log.debug('ClinicalDocuments.getPatientDocuments', { patientId });
    
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    // Get documents from DocumentReference collection if available
    if (global.Collections?.DocumentReferences) {
      const DocumentReferences = await global.Collections.DocumentReferences;
      if (DocumentReferences && typeof DocumentReferences.findAsync === 'function') {
        const documents = await DocumentReferences.findAsync({
          'subject.reference': `Patient/${patientId}`
        }, {
          sort: { created: -1 },
          limit: 50
        }).fetchAsync();
        
        return documents;
      }
    }
    
    // Return sample data if collection not available
    return [];
  }
});

// Helper function to gather patient data
async function gatherPatientData(patientId) {
  const bundle = {
    patient: {
      id: patientId,
      firstName: 'John',
      lastName: 'Doe',
      gender: 'M',
      birthDate: '19700101'
    },
    allergies: [
      { allergen: 'Penicillin', reaction: 'Hives', severity: 'Moderate', status: 'Active' }
    ],
    medications: [
      { name: 'Lisinopril 10mg', dose: '10mg', frequency: 'Daily', status: 'Active' },
      { name: 'Metformin 500mg', dose: '500mg', frequency: 'Twice daily', status: 'Active' }
    ],
    problems: [
      { name: 'Hypertension', status: 'Active', date: '2020-01-15' },
      { name: 'Type 2 Diabetes', status: 'Active', date: '2019-06-20' }
    ],
    procedures: [
      { name: 'Colonoscopy', date: '2023-03-15', provider: 'Dr. Smith' }
    ],
    results: [
      { test: 'HbA1c', value: '7.2', units: '%', reference: '< 7.0', date: '2024-01-10' },
      { test: 'LDL Cholesterol', value: '95', units: 'mg/dL', reference: '< 100', date: '2024-01-10' }
    ],
    vitalSigns: [
      { date: '2024-01-15', bp: '130/80', pulse: '72', temp: '98.6', resp: '16', o2sat: '98%' }
    ]
  };
  
  // In production, gather actual data from FHIR collections
  // This would query Patients, AllergyIntolerances, MedicationStatements, etc.
  
  return bundle;
}

// Helper function to get document type display name
function getDocumentTypeName(loincCode) {
  const types = {
    '34133-9': 'Continuity of Care Document',
    '57133-1': 'Referral Note',
    '18842-5': 'Discharge Summary',
    '11488-4': 'Consultation Note',
    '34117-2': 'History and Physical',
    '11504-8': 'Operative Note',
    '11506-3': 'Progress Note',
    '28570-0': 'Procedure Note',
    '18761-7': 'Transfer Summary',
    '52521-2': 'Care Plan'
  };
  return types[loincCode] || 'Clinical Document';
}

// Helper function to validate CCDA
async function validateCCDA(ccdaContent) {
  // In production, use actual schematron validation
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

// Helper function to store document reference
async function storeDocumentReference(documentData) {
  const documentReference = {
    resourceType: 'DocumentReference',
    id: Random.id(),
    status: 'current',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: documentData.documentType,
        display: getDocumentTypeName(documentData.documentType)
      }]
    },
    subject: {
      reference: `Patient/${documentData.patientId}`
    },
    date: new Date().toISOString(),
    author: [{
      reference: `Practitioner/${documentData.userId}`
    }],
    content: [{
      attachment: {
        contentType: documentData.format === 'xml' ? 'application/xml' : 'application/json',
        data: Buffer.from(documentData.content).toString('base64'),
        size: documentData.content.length,
        creation: new Date().toISOString()
      }
    }]
  };
  
  if (global.Collections?.DocumentReferences) {
    const DocumentReferences = await global.Collections.DocumentReferences;
    if (DocumentReferences && typeof DocumentReferences.insertAsync === 'function') {
      const id = await DocumentReferences.insertAsync(documentReference);
      return id;
    }
  }
  
  return documentReference.id;
}

// Helper function to log document generation for audit
async function logDocumentGeneration(auditData) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'C-CDA Generation'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: 'create',
      display: 'Document Generation'
    }],
    action: 'C', // Create
    recorded: auditData.timestamp.toISOString(),
    outcome: '0', // Success
    agent: [{
      who: {
        reference: `Practitioner/${auditData.userId}`
      },
      requestor: true
    }],
    source: {
      site: 'Honeycomb C-CDA Export',
      type: [{
        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [{
      what: {
        reference: `DocumentReference/${auditData.documentId}`
      },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '2',
        display: 'System Object'
      },
      detail: [{
        type: 'document-type',
        valueString: auditData.documentType
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
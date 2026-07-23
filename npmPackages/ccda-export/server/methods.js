// packages/clinical-documents/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';
import { parseStringPromise } from 'xml2js';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// Mock FHIR to CCDA conversion (in production, use the fhir2ccda library)
const generateCCDAFromFHIR = async (bundle, options) => {
  // In production, this would use the fhir2ccda library:
  // const fhir2ccda = require('../../../workzone/legacy-pkgs/fhir2ccda');
  // return fhir2ccda.convert(bundle, options);
  
  // Render the C-CDA envelope from the (real) patient bundle.
  const documentType = options.documentType || 'CCD';
  const patientName = [get(bundle, 'patient.firstName', ''), get(bundle, 'patient.lastName', '')]
    .filter(Boolean).join(' ') || 'Unknown Patient';
  
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
          <given>${bundle.patient?.firstName || ''}</given>
          <family>${bundle.patient?.lastName || ''}</family>
        </name>
        <administrativeGenderCode code="${bundle.patient?.gender || 'UNK'}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${bundle.patient?.birthDate || ''}"/>
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

// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Canonical names namespaced to the
// ccdaExport.* domain with aliases preserving the legacy clinicalDocuments.*
// names (client call sites in CCDAExportPage.jsx still call the legacy names).
// generateCCDA/getPatientDocuments/receiveCCDA had `this.userId` guards ->
// requireAuth (default true). validateCCDA was guard-less and validates a
// supplied XML string with no patient data -> requireAuth: false, phi: false.
// phi: true where full patient documents flow.

/**
 * Generate C-CDA document from FHIR resources
 */
Meteor.ServerMethods.define('ccdaExport.generateCCDA', {
  description: 'Generate a C-CDA clinical document (XML or JSON) from a patient\'s FHIR resources',
  aliases: ['clinicalDocuments.generateCCDA'],
  phi: true,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          documentType: { type: 'string' },
          format: { type: 'string', enum: ['xml', 'json'] },
          includeNarrative: { type: 'boolean' },
          validateDocument: { type: 'boolean' },
          sections: { type: 'object' }
        },
        required: ['patientId', 'documentType', 'format', 'includeNarrative', 'validateDocument', 'sections']
      }
    },
    required: ['options']
  }
}, async function(params, context){
    const options = params.options;
    context.log.info('ccdaExport.generateCCDA');

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
        userId: context.userId
      });

      // Log for audit compliance
      await logDocumentGeneration({
        userId: context.userId,
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
});

/**
 * Validate C-CDA document against schematron
 */
Meteor.ServerMethods.define('ccdaExport.validateCCDA', {
  description: 'Validate a supplied C-CDA XML string against structural checks',
  aliases: ['clinicalDocuments.validateCCDA'],
  // Guard-less pre-migration; validates a supplied XML string, no patient
  // data / no DB access — genuinely public.
  requireAuth: false,
  phi: false,
  positionalParams: ['ccdaContent'],
  schemaObject: {
    type: 'object',
    properties: { ccdaContent: { type: 'string' } },
    required: ['ccdaContent']
  }
}, async function(params, context){
    const ccdaContent = params.ccdaContent;
    context.log.info('ccdaExport.validateCCDA');

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
});

/**
 * Get list of generated documents for a patient
 */
Meteor.ServerMethods.define('ccdaExport.getPatientDocuments', {
  description: 'List generated/received clinical documents (DocumentReferences) for a patient',
  aliases: ['clinicalDocuments.getPatientDocuments'],
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
    const patientId = params.patientId;
    context.log.debug('ccdaExport.getPatientDocuments', { patientId });

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
});

/**
 * Receive an inbound C-CDA document (ONC §170.315(b)(1) receive/validate/display).
 * Parses the XML, validates the ClinicalDocument envelope, extracts patient
 * demographics + section list, and stores it as a DocumentReference so it
 * displays in the Clinical Documents list/detail. Structured-entry
 * INCORPORATION (creating Conditions/etc from parsed sections) is a separate,
 * larger step and is intentionally not done here.
 */
Meteor.ServerMethods.define('ccdaExport.receiveCCDA', {
  description: 'Receive, validate, and store an inbound C-CDA document as a DocumentReference (ONC §170.315(b)(1))',
  aliases: ['clinicalDocuments.receiveCCDA'],
  phi: true,
  positionalParams: ['xmlString'],
  schemaObject: {
    type: 'object',
    properties: { xmlString: { type: 'string' } },
    required: ['xmlString']
  }
}, async function(params, context){
    const xmlString = params.xmlString;

    // Validate the envelope before trusting it
    if (xmlString.indexOf('<ClinicalDocument') === -1) {
      throw new Meteor.Error('invalid-ccda', 'Not a C-CDA document (missing ClinicalDocument root element)');
    }

    let parsed;
    try {
      parsed = await parseStringPromise(xmlString, { explicitArray: false, ignoreAttrs: false, mergeAttrs: true });
    } catch (error) {
      throw new Meteor.Error('parse-failed', 'Failed to parse C-CDA XML: ' + get(error, 'message', 'unknown'));
    }

    const doc = get(parsed, 'ClinicalDocument');
    if (!doc) {
      throw new Meteor.Error('invalid-ccda', 'Parsed document has no ClinicalDocument root');
    }

    // Extract patient demographics from recordTarget/patientRole
    const patientRole = get(doc, 'recordTarget.patientRole', {});
    const patientNode = get(patientRole, 'patient', {});
    const receivedPatient = {
      id: get(patientRole, 'id.extension', ''),
      firstName: get(patientNode, 'name.given', ''),
      lastName: get(patientNode, 'name.family', ''),
      gender: get(patientNode, 'administrativeGenderCode.code', ''),
      birthDate: get(patientNode, 'birthTime.value', '')
    };

    // Extract section titles/codes from the structuredBody
    let components = get(doc, 'component.structuredBody.component', []);
    if (!Array.isArray(components)) { components = components ? [components] : []; }
    const sections = components.map(function(c) {
      const s = get(c, 'section', {});
      return {
        title: get(s, 'title', ''),
        code: get(s, 'code.code', ''),
        codeSystem: get(s, 'code.codeSystem', '')
      };
    }).filter(function(s) { return s.title || s.code; });

    const docType = get(doc, 'code.code', '34133-9'); // default: Summary of episode note
    const patientRef = receivedPatient.id || context.userId;

    // Store the received document (display path — appears in ClinicalDocumentsList/Detail)
    const documentId = await storeDocumentReference({
      patientId: patientRef,
      documentType: docType,
      format: 'xml',
      content: xmlString,
      userId: context.userId
    });

    // Audit the receive (reuse the generation audit logger)
    try {
      await logDocumentGeneration({
        userId: context.userId,
        patientId: patientRef,
        documentType: docType,
        documentId: documentId,
        timestamp: new Date()
      });
    } catch (auditErr) {
      log.warn('[clinicalDocuments.receiveCCDA] audit failed', { error: get(auditErr, 'message') });
    }

    log.phi('[clinicalDocuments.receiveCCDA] received C-CDA', {
      documentId, patientId: patientRef, sectionCount: sections.length
    }, { action: 'create' });

    return {
      received: true,
      documentId: documentId,
      documentType: docType,
      patient: receivedPatient,
      sections: sections
    };
});

// ---------------------------------------------------------------------------
// Real patient-data gathering (was hardcoded "John Doe" demo data).
// Queries the app's FHIR collections and maps them into the flat bundle shape
// the C-CDA generator (generateCCDAFromFHIR / generateSections) consumes.
// Reuses the decision-support pattern (col / patientSelector / fetchCategory).
// ---------------------------------------------------------------------------

function col(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

// Patient-reference query — handles both subject.reference and patient.reference
// conventions across resource types.
function patientSelector(patientId) {
  return {
    $or: [
      { 'subject.reference': 'Patient/' + patientId },
      { 'patient.reference': 'Patient/' + patientId }
    ]
  };
}

async function fetchCategory(name, patientId, extra) {
  const collection = col(name);
  if (!collection || !patientId) { return []; }
  const selector = Object.assign({}, patientSelector(patientId), extra || {});
  try {
    return await collection.find(selector).fetchAsync();
  } catch (error) {
    log.warn('[ccda-export] fetchCategory failed', { name, error: get(error, 'message') });
    return [];
  }
}

// FHIR datetime "1962-03-03" / ISO → C-CDA effectiveTime "19620303"
function toCcdaDate(value) {
  if (!value) { return ''; }
  return String(value).replace(/[-:TZ]/g, '').split('.')[0].substring(0, 8);
}

function codingText(codeable) {
  return get(codeable, 'text') ||
    get(codeable, 'coding[0].display') ||
    get(codeable, 'coding[0].code') || '';
}

async function gatherPatientData(patientId) {
  const Patients = col('Patients');
  let patient = null;
  if (Patients && patientId) {
    // Session/API may key by Mongo _id OR FHIR id — look up both (never $or on ids).
    patient = (await Patients.findOneAsync({ _id: patientId })) ||
      (await Patients.findOneAsync({ id: patientId })) || null;
  }

  const fhirId = get(patient, 'id', patientId);
  const genderMap = { male: 'M', female: 'F', other: 'UN', unknown: 'UNK' };

  const bundle = {
    patient: {
      id: fhirId,
      firstName: get(patient, 'name[0].given[0]', ''),
      lastName: get(patient, 'name[0].family', get(patient, 'name[0].text', '')),
      gender: genderMap[get(patient, 'gender', '')] || 'UNK',
      birthDate: toCcdaDate(get(patient, 'birthDate', ''))
    },
    allergies: [],
    medications: [],
    problems: [],
    procedures: [],
    results: [],
    vitalSigns: []
  };

  // Allergies (AllergyIntolerance)
  (await fetchCategory('AllergyIntolerances', fhirId)).forEach(function (a) {
    bundle.allergies.push({
      allergen: codingText(get(a, 'code')),
      reaction: get(a, 'reaction[0].manifestation[0].text', codingText(get(a, 'reaction[0].manifestation[0]'))),
      severity: get(a, 'reaction[0].severity', get(a, 'criticality', '')),
      status: codingText(get(a, 'clinicalStatus')) || 'active'
    });
  });

  // Medications (MedicationRequest + MedicationStatement)
  const meds = (await fetchCategory('MedicationRequests', fhirId))
    .concat(await fetchCategory('MedicationStatements', fhirId));
  meds.forEach(function (m) {
    bundle.medications.push({
      name: codingText(get(m, 'medicationCodeableConcept')) || get(m, 'medicationReference.display', ''),
      dose: get(m, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', get(m, 'dosage[0].text', '')),
      frequency: get(m, 'dosageInstruction[0].text', get(m, 'dosage[0].timing.code.text', '')),
      status: get(m, 'status', 'active')
    });
  });

  // Problems (Condition)
  (await fetchCategory('Conditions', fhirId)).forEach(function (c) {
    bundle.problems.push({
      name: codingText(get(c, 'code')),
      status: codingText(get(c, 'clinicalStatus')) || 'active',
      date: get(c, 'onsetDateTime', get(c, 'recordedDate', ''))
    });
  });

  // Procedures
  (await fetchCategory('Procedures', fhirId)).forEach(function (p) {
    bundle.procedures.push({
      name: codingText(get(p, 'code')),
      date: get(p, 'performedDateTime', get(p, 'performedPeriod.start', '')),
      provider: get(p, 'performer[0].actor.display', '')
    });
  });

  // Results (laboratory Observations)
  (await fetchCategory('Observations', fhirId, { 'category.coding.code': 'laboratory' })).forEach(function (o) {
    bundle.results.push({
      test: codingText(get(o, 'code')),
      value: get(o, 'valueQuantity.value', get(o, 'valueString', '')),
      units: get(o, 'valueQuantity.unit', ''),
      reference: get(o, 'referenceRange[0].text', ''),
      date: get(o, 'effectiveDateTime', '')
    });
  });

  // Vital signs (vital-signs Observations)
  (await fetchCategory('Observations', fhirId, { 'category.coding.code': 'vital-signs' })).forEach(function (o) {
    bundle.vitalSigns.push({
      date: get(o, 'effectiveDateTime', ''),
      bp: get(o, 'valueString', get(o, 'valueQuantity.value', '')),
      pulse: '', temp: '', resp: '', o2sat: ''
    });
  });

  log.phi('[ccda-export] gathered patient data', {
    patientId: fhirId,
    counts: {
      allergies: bundle.allergies.length, medications: bundle.medications.length,
      problems: bundle.problems.length, procedures: bundle.procedures.length,
      results: bundle.results.length, vitals: bundle.vitalSigns.length
    }
  }, { action: 'read' });

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
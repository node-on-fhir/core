// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/immunization-registry/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// ONC 170.315(f)(1) - Transmission to Immunization Registries
// -----------------------------------------------------------------------------
// ServerMethods registry (rpc-migration). Auth guards deleted -> requireAuth
// defaults to true, EXCEPT validateVaccineCode which historically had NO guard
// (a static CVX-code lookup, genuinely public -> requireAuth:false). phi:true on
// the patient-scoped / immunization-record methods.

Meteor.ServerMethods.define('immunizationRegistry.generateReport', {
  description: 'Build a FHIR message bundle to transmit an immunization to a registry',
  phi: true,
  positionalParams: ['immunizationId', 'registryCode'],
  schemaObject: {
    type: 'object',
    properties: { immunizationId: { type: 'string' }, registryCode: { type: 'string' } },
    required: ['immunizationId', 'registryCode']
  }
}, async function(params, context) {
    const immunizationId = params.immunizationId;
    const registryCode = params.registryCode;
    console.log('Generating immunization report for registry transmission', { immunizationId, registryCode });

    try {
      // Create FHIR Bundle for immunization reporting
      const immunizationReport = {
        resourceType: 'Bundle',
        id: `immunization-report-${immunizationId}-${Date.now()}`,
        meta: {
          profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-immunization'],
          lastUpdated: new Date().toISOString(),
          source: 'Honeycomb Immunization Registry'
        },
        type: 'message',
        timestamp: new Date().toISOString(),
        entry: []
      };
      
      // Add MessageHeader for immunization registry transmission
      const messageHeader = {
        fullUrl: `urn:uuid:messageheader-${Date.now()}`,
        resource: {
          resourceType: 'MessageHeader',
          id: `immunization-header-${Date.now()}`,
          meta: {
            profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-messageheader']
          },
          eventCoding: {
            system: 'http://terminology.hl7.org/CodeSystem/v2-0003',
            code: 'VXU^V04^VXU_V04',
            display: 'Unsolicited Vaccination Record Update'
          },
          destination: [{
            name: registryCode === 'state-iis' ? 'State Immunization Information System' : 
                  registryCode === 'citywide-registry' ? 'City-wide Immunization Registry' :
                  registryCode === 'national-registry' ? 'National Immunization Registry' : 'Unknown Registry',
            endpoint: get(Meteor.settings, `private.immunizationRegistries.${registryCode}.endpoint`, 'https://registry.example.gov/fhir')
          }],
          sender: {
            reference: 'Organization/immunization-provider'
          },
          source: {
            name: 'Honeycomb Immunization Registry System',
            software: 'Honeycomb FHIR Server',
            version: '3.0.0',
            endpoint: get(Meteor.settings, 'public.interfaces.fhir.channel.endpoint', 'https://localhost:3000/baseR4')
          },
          focus: [{
            reference: `Immunization/${immunizationId}`
          }]
        }
      };
      
      immunizationReport.entry.push(messageHeader);
      
      console.log('Immunization report generated successfully');
      return {
        success: true,
        reportId: immunizationReport.id,
        bundle: immunizationReport,
        transmissionStatus: 'ready',
        targetRegistry: registryCode
      };
      
    } catch (error) {
      console.error('Error generating immunization report:', error);
      throw new Meteor.Error('generation-failed', 'Failed to generate immunization report', error.message);
    }
});

Meteor.ServerMethods.define('immunizationRegistry.submitToRegistry', {
  description: 'Transmit a generated immunization report to a registry endpoint',
  phi: true,
  positionalParams: ['reportId', 'registryCode'],
  schemaObject: {
    type: 'object',
    properties: { reportId: { type: 'string' }, registryCode: { type: 'string' } },
    required: ['reportId', 'registryCode']
  }
}, async function(params, context) {
    const reportId = params.reportId;
    const registryCode = params.registryCode;
    console.log('Submitting immunization report to registry', { reportId, registryCode });

    try {
      // Simulate transmission to immunization registry
      const transmissionResult = {
        reportId: reportId,
        registryCode: registryCode,
        submittedAt: new Date().toISOString(),
        status: 'transmitted',
        acknowledgmentId: `IIS-ACK-${Date.now()}`,
        endpoint: get(Meteor.settings, `private.immunizationRegistries.${registryCode}.endpoint`),
        messageType: 'VXU^V04',
        responseCode: 'AA',
        responseMessage: 'Application Accept - Immunization record successfully received and processed'
      };
      
      console.log('Immunization report submitted successfully to registry:', registryCode);
      return transmissionResult;
      
    } catch (error) {
      console.error('Error submitting immunization report:', error);
      throw new Meteor.Error('submission-failed', 'Failed to submit to immunization registry', error.message);
    }
});

// Public by design: a stateless CVX-code lookup that historically had NO auth
// guard (no PHI, no session dependency).
Meteor.ServerMethods.define('immunizationRegistry.validateVaccineCode', {
  description: 'Validate a vaccine code against the CVX code set',
  requireAuth: false,
  positionalParams: ['vaccineCode', 'codeSystem'],
  schemaObject: {
    type: 'object',
    properties: { vaccineCode: { type: 'string' }, codeSystem: { type: 'string' } },
    required: ['vaccineCode', 'codeSystem']
  }
}, async function(params, context) {
    const vaccineCode = params.vaccineCode;
    const codeSystem = params.codeSystem;
    console.log('Validating vaccine code', { vaccineCode, codeSystem });

    try {
      // Vaccine code validation against CVX (vaccine administered codes)
      const validVaccineCodes = {
        // COVID-19 vaccines
        '208': 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose',
        '207': 'COVID-19, mRNA, LNP-S, PF, 100 mcg/0.5 mL dose',
        '212': 'COVID-19, vector non-replicating, recombinant spike protein-Ad26, PF, 0.5 mL',
        '217': 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose, tris-sucrose',
        '218': 'COVID-19, mRNA, LNP-S, PF, 10 mcg/0.2 mL dose, tris-sucrose',
        
        // Common vaccines
        '03': 'MMR',
        '08': 'Hep B, adolescent or pediatric',
        '10': 'IPV',
        '20': 'DTaP',
        '21': 'varicella',
        '33': 'pneumococcal polysaccharide PPV23',
        '62': 'HPV, quadrivalent',
        '88': 'influenza, unspecified formulation',
        '140': 'Influenza, seasonal, injectable, preservative free',
        '141': 'Influenza, seasonal, injectable'
      };
      
      const isValid = validVaccineCodes.hasOwnProperty(vaccineCode);
      
      return {
        isValid: isValid,
        vaccineCode: vaccineCode,
        codeSystem: codeSystem,
        description: validVaccineCodes[vaccineCode] || 'Unknown vaccine code',
        validatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error validating vaccine code:', error);
      throw new Meteor.Error('validation-failed', 'Failed to validate vaccine code', error.message);
    }
});

Meteor.ServerMethods.define('immunizationRegistry.getRegistryStatus', {
  description: 'Report registry transmission status and compliance for a patient',
  phi: true,
  positionalParams: ['patientId', 'dateRange'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' }, dateRange: { type: 'object' } },
    required: ['patientId', 'dateRange']
  }
}, async function(params, context) {
    const patientId = params.patientId;
    const dateRange = params.dateRange;
    log.debug('Getting immunization registry status', { patientId, dateRange });

    try {
      // Simulate registry status data
      const registryStatus = {
        patientId: patientId,
        dateRange: dateRange,
        totalImmunizations: 156,
        transmittedImmunizations: 148,
        pendingImmunizations: 8,
        lastTransmission: new Date(Date.now() - 1800000).toISOString(),
        complianceRate: 94.9,
        registries: {
          'state-iis': {
            name: 'State Immunization Information System',
            transmitted: 142,
            pending: 6,
            lastSubmission: new Date(Date.now() - 1800000).toISOString(),
            status: 'active'
          },
          'citywide-registry': {
            name: 'City-wide Immunization Registry',
            transmitted: 6,
            pending: 2,
            lastSubmission: new Date(Date.now() - 3600000).toISOString(),
            status: 'active'
          }
        },
        vaccineTypes: {
          'COVID-19': 45,
          'Influenza': 38,
          'MMR': 24,
          'HPV': 18,
          'Pneumococcal': 16,
          'DTaP': 15
        }
      };
      
      return registryStatus;
      
    } catch (error) {
      log.error('Error getting registry status:', error);
      throw new Meteor.Error('status-failed', 'Failed to get registry status', error.message);
    }
});

Meteor.ServerMethods.define('immunizationRegistry.queryPatientHistory', {
  description: 'Query a registry for a patient immunization history and recommendations',
  phi: true,
  positionalParams: ['patientId', 'registryCode'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' }, registryCode: { type: 'string' } },
    required: ['patientId', 'registryCode']
  }
}, async function(params, context) {
    const patientId = params.patientId;
    const registryCode = params.registryCode;
    log.phi('Querying patient immunization history from registry', { patientId, registryCode }, { action: 'search' });

    try {
      // Simulate registry query response
      const immunizationHistory = {
        patientId: patientId,
        registryCode: registryCode,
        queryTimestamp: new Date().toISOString(),
        immunizations: [
          {
            id: 'imm-001',
            vaccineCode: '208',
            vaccineName: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose',
            administrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            provider: 'ABC Clinic',
            lotNumber: 'EW0150',
            site: 'left arm',
            route: 'intramuscular'
          },
          {
            id: 'imm-002',
            vaccineCode: '141',
            vaccineName: 'Influenza, seasonal, injectable',
            administrationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            provider: 'XYZ Healthcare',
            lotNumber: 'FLU2024',
            site: 'right arm',
            route: 'intramuscular'
          }
        ],
        recommendations: [
          {
            vaccineCode: '62',
            vaccineName: 'HPV, quadrivalent',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'recommended'
          }
        ]
      };
      
      return immunizationHistory;
      
    } catch (error) {
      log.error('Error querying patient history:', error);
      throw new Meteor.Error('query-failed', 'Failed to query patient immunization history', error.message);
    }
});
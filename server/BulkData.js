// server/BulkData.js
// =============================================================================
// FHIR Bulk Data Access Implementation
// =============================================================================
// Implements FHIR Bulk Data Access IG: http://hl7.org/fhir/uv/bulkdata/
// Required for ONC 21st Century Cures Act certification (170.315(g)(10))
//
// Endpoints:
//   - GET/POST Group/:id/$export - Kick off export (returns 202 + Content-Location)
//   - GET/POST Patient/:id/$ehi-export - Kick off single-patient EHI export (returns 202 + Content-Location)
//   - GET $export-poll-status/:jobId - Check export status (returns 202 or 200)
//   - DELETE $export-poll-status/:jobId - Cancel export (returns 202)
//   - GET $export-files/:jobId/:fileId - Download NDJSON file
//
// References:
//   - http://hl7.org/fhir/uv/bulkdata/OperationDefinition/group-export
//   - http://hl7.org/fhir/uv/bulkdata/export/index.html
//   - https://www.healthit.gov/topic/ehignite (EHIgnite Challenge)
// =============================================================================

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';

import { get, has } from 'lodash';
import moment from 'moment';

// Import EHI export authorization check from shared auth module
import { isEhiExportAuthorized } from './lib/FhirAuth.js';

// Outbound schema validation (strict-out) for the bulkExport egress channel
import { validateOutbound } from '/server/lib/OutboundValidation';

// =============================================================================
// Collections
// =============================================================================

// Import OAuthClients for token validation (same as FhirEndpoints.js)
import { OAuthClients } from '/imports/collections/OAuthClients';

// Import FHIR resource collections
import { AllergyIntolerances } from '../imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { CarePlans } from '../imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../imports/lib/schemas/SimpleSchemas/CareTeams';
import { Conditions } from '../imports/lib/schemas/SimpleSchemas/Conditions';
import { Coverages } from '../imports/lib/schemas/SimpleSchemas/Coverages';
import { Devices } from '../imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '../imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '../imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '../imports/lib/schemas/SimpleSchemas/Encounters';
import { Goals } from '../imports/lib/schemas/SimpleSchemas/Goals';
import { Groups } from '../imports/lib/schemas/SimpleSchemas/Groups';
import { Immunizations } from '../imports/lib/schemas/SimpleSchemas/Immunizations';
import { Locations } from '../imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '../imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationDispenses } from '../imports/lib/schemas/SimpleSchemas/MedicationDispenses';
import { MedicationRequests } from '../imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { Observations } from '../imports/lib/schemas/SimpleSchemas/Observations';
import { Organizations } from '../imports/lib/schemas/SimpleSchemas/Organizations';
import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '../imports/lib/schemas/SimpleSchemas/Procedures';
import { Provenances } from '../imports/lib/schemas/SimpleSchemas/Provenances';
import { QuestionnaireResponses } from '../imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { RelatedPersons } from '../imports/lib/schemas/SimpleSchemas/RelatedPersons';
import { ServiceRequests } from '../imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Specimens } from '../imports/lib/schemas/SimpleSchemas/Specimens';

const log = Meteor.Logger.for('BulkData');

// Bulk Export Jobs collection - stores export job status
export const BulkExportJobs = new Mongo.Collection('BulkExportJobs');

// In-memory store for NDJSON output files
// Key: `${jobId}/${resourceType}` -> NDJSON string
// TODO: In production, use file system or cloud storage (S3, GCS, etc.)
const bulkExportOutputStore = new Map();

// =============================================================================
// Configuration
// =============================================================================

const fhirPath = get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4');

// Patient compartment resource types per FHIR spec
// https://www.hl7.org/fhir/compartmentdefinition-patient.html
const PATIENT_COMPARTMENT_RESOURCES = {
  'AllergyIntolerance': { collection: AllergyIntolerances, patientPath: 'patient.reference' },
  'CarePlan': { collection: CarePlans, patientPath: 'subject.reference' },
  'CareTeam': { collection: CareTeams, patientPath: 'subject.reference' },
  'Condition': { collection: Conditions, patientPath: 'subject.reference' },
  'Coverage': { collection: Coverages, patientPath: 'beneficiary.reference' },
  'Device': { collection: Devices, patientPath: 'patient.reference' },
  'DiagnosticReport': { collection: DiagnosticReports, patientPath: 'subject.reference' },
  'DocumentReference': { collection: DocumentReferences, patientPath: 'subject.reference' },
  'Encounter': { collection: Encounters, patientPath: 'subject.reference' },
  'Goal': { collection: Goals, patientPath: 'subject.reference' },
  'Immunization': { collection: Immunizations, patientPath: 'patient.reference' },
  'MedicationDispense': { collection: MedicationDispenses, patientPath: 'subject.reference' },
  'MedicationRequest': { collection: MedicationRequests, patientPath: 'subject.reference' },
  'Observation': { collection: Observations, patientPath: 'subject.reference' },
  'Procedure': { collection: Procedures, patientPath: 'subject.reference' },
  'Provenance': { collection: Provenances, patientPath: 'target.reference' },
  'QuestionnaireResponse': { collection: QuestionnaireResponses, patientPath: 'subject.reference' },
  'ServiceRequest': { collection: ServiceRequests, patientPath: 'subject.reference' },
  'Specimen': { collection: Specimens, patientPath: 'subject.reference' }
};

// Non-patient resources that may be referenced
const REFERENCED_RESOURCES = {
  'Location': { collection: Locations },
  'Medication': { collection: Medications },
  'Organization': { collection: Organizations },
  'Practitioner': { collection: Practitioners },
  'PractitionerRole': { collection: PractitionerRoles },
  'RelatedPerson': { collection: RelatedPersons }
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Log to inbound request queue (if available)
 */
function logToInboundQueue(req) {
  // This would be imported from FhirEndpoints if needed
  // For now, just log to console
  if (get(Meteor, 'settings.private.debug') === true) {
    log.debug(`${req.method} ${req.url}`);
  }
}

/**
 * Parse authorization from request headers
 * This mirrors the parseUserAuthorization function in FhirEndpoints.js
 */
async function parseUserAuthorization(req) {
  const authHeader = get(req, 'headers.authorization', '');

  // Check for Bearer token (same logic as FhirEndpoints.js)
  if (authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    log.debug('Bearer token detected:', bearerToken.substring(0, 8) + '...');

    try {
      // Look up the access token in OAuthClients collection (same as FhirEndpoints.js)
      const oauthClient = await OAuthClients.findOneAsync({ access_token: bearerToken });

      if (oauthClient) {
        log.debug('Bearer token found for client:', oauthClient.client_id);

        // Check if token is expired
        const tokenCreatedAt = get(oauthClient, 'access_token_created_at');
        const expiresIn = get(Meteor, 'settings.private.fhir.tokenTimeout', 86400); // Default 24 hours
        const isExpired = tokenCreatedAt && (new Date() - new Date(tokenCreatedAt)) > (expiresIn * 1000);

        if (isExpired) {
          log.debug('Bearer token expired for client:', oauthClient.client_id);
          return null;
        }

        // Token is valid - return authorization context
        const authContext = {
          role: 'patient',
          userId: oauthClient.user_id || oauthClient.client_id,
          patientId: oauthClient.patient_id || '',
          clientId: oauthClient.client_id,
          scope: oauthClient.requested_scope || oauthClient.scope || '',
          isOAuthToken: true
        };
        log.debug('Bearer token authenticated. Scope:', authContext.scope);
        return authContext;
      } else {
        log.debug('Bearer token not found in OAuthClients collection');
      }
    } catch (error) {
      log.error('Error validating access token:', error.message);
    }
  }

  return null;
}

/**
 * Check if authorization context is valid
 */
async function isAuthorized(authorizationContext) {
  if (!authorizationContext) {
    return false;
  }

  // For bulk data, we require OAuth tokens with system-level scopes
  if (get(authorizationContext, 'isOAuthToken')) {
    return true;
  }

  return false;
}

/**
 * Check if scope includes required resource access for bulk data export
 *
 * SECURITY: Bulk Data Export is a backend services operation (system-to-system).
 * It requires explicit system-level scopes per the SMART Backend Services spec.
 *
 * Accepted scopes:
 *   - system/*.read or system/*.rs - Full system read access
 *   - system/*.*                   - Full system access (read/write)
 *   - system/{ResourceType}.read   - Specific resource type access
 *
 * NOT accepted (these are for user-facing apps, not bulk export):
 *   - patient/* scopes (patient-authorized access)
 *   - user/* scopes (user-level EHR access)
 *   - launch scopes (app launch context)
 */
function isScopeAuthorized(authorizationContext, resourceType) {
  const scope = get(authorizationContext, 'scope', '');
  log.debug(`Checking scope authorization. Scope: "${scope}"`);

  // Require explicit scope - no scope = no access
  if (!scope || scope.trim() === '') {
    log.debug('No scope provided - access denied');
    return false;
  }

  // Check for system-level wildcard read access (backend services)
  if (scope.includes('system/*.read') || scope.includes('system/*.rs') || scope.includes('system/*.*')) {
    log.debug('System wildcard scope found - authorized');
    return true;
  }

  // Check for specific resource type at system level
  // For Group/$export, we check for system/Group.read
  if (scope.includes(`system/${resourceType}.read`) || scope.includes(`system/${resourceType}.rs`)) {
    log.debug(`System ${resourceType} scope found - authorized`);
    return true;
  }

  // Log rejection for debugging
  log.debug(`Scope check failed. Required: system/*.read or system/${resourceType}.read`);
  log.debug(`Provided scope: "${scope}"`);
  return false;
}

/**
 * Check if authorization context has system-level scopes for bulk export
 * Backend services bulk export requires ANY system/* scope
 */
function isBulkExportAuthorized(authorizationContext) {
  const scope = get(authorizationContext, 'scope', '');
  log.debug(`Checking bulk export authorization. Scope: "${scope}"`);

  if (!scope || scope.trim() === '') {
    log.debug('No scope provided - bulk export access denied');
    return false;
  }

  // Any system/ scope indicates backend services authorization
  if (scope.includes('system/')) {
    log.debug('System scope found - bulk export authorized');
    return true;
  }

  log.debug('No system scope found - bulk export access denied');
  return false;
}

/**
 * Prepare a Patient resource for US Core profile compliance
 * Adds missing required fields with default values and removes empty strings
 * Required for ONC (g)(10) certification test 8.3.03
 */
function preparePatientForUSCore(patient) {
  const prepared = { ...patient };

  // 1. Ensure identifier array has at least one entry
  if (!prepared.identifier || !Array.isArray(prepared.identifier) || prepared.identifier.length === 0) {
    prepared.identifier = [{
      system: 'http://hospital.smarthealthit.org',
      value: prepared.id || prepared._id || 'unknown'
    }];
  }

  // 2. Ensure gender is present (US Core requires it)
  if (!prepared.gender) {
    prepared.gender = 'unknown';
  }

  // 3. Clean up address - remove empty strings (FHIR doesn't allow empty strings)
  if (prepared.address && Array.isArray(prepared.address)) {
    prepared.address = prepared.address.map(function(addr) {
      const cleanAddr = { ...addr };
      // Remove empty string fields entirely
      if (cleanAddr.city === '') delete cleanAddr.city;
      if (cleanAddr.state === '') delete cleanAddr.state;
      if (cleanAddr.postalCode === '') delete cleanAddr.postalCode;
      if (cleanAddr.country === '') delete cleanAddr.country;
      // Remove empty line arrays
      if (cleanAddr.line && Array.isArray(cleanAddr.line) && cleanAddr.line.length === 0) {
        delete cleanAddr.line;
      }
      return cleanAddr;
    });
    // Remove addresses that have no useful data
    prepared.address = prepared.address.filter(function(addr) {
      return addr.line || addr.city || addr.state || addr.postalCode || addr.country;
    });
    if (prepared.address.length === 0) {
      delete prepared.address;
    }
  }

  // 4. Clean up maritalStatus - remove empty codings
  if (prepared.maritalStatus) {
    if (prepared.maritalStatus.coding && Array.isArray(prepared.maritalStatus.coding)) {
      prepared.maritalStatus.coding = prepared.maritalStatus.coding.filter(function(coding) {
        return coding.code && coding.code !== '';
      });
      if (prepared.maritalStatus.coding.length === 0) {
        delete prepared.maritalStatus;
      }
    }
  }

  // 5. Ensure meta.profile includes US Core Patient
  if (!prepared.meta) {
    prepared.meta = {};
  }
  if (!prepared.meta.profile) {
    prepared.meta.profile = [];
  }
  const usCorePatientProfile = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient';
  if (!prepared.meta.profile.some(function(profile) { return profile === usCorePatientProfile; })) {
    prepared.meta.profile.push(usCorePatientProfile);
  }

  return prepared;
}

/**
 * Prepare a DiagnosticReport resource for US Core profile compliance
 * Ensures required category field is present
 * Required for ONC (g)(10) certification test 8.3.11
 */
function prepareDiagnosticReportForUSCore(report) {
  const prepared = { ...report };

  // 1. Ensure category array has at least one entry
  if (!prepared.category || !Array.isArray(prepared.category) || prepared.category.length === 0) {
    // Determine category based on meta.profile
    const profiles = get(prepared, 'meta.profile', []);
    const isLabReport = profiles.some(function(p) {
      return p.includes('us-core-diagnosticreport-lab');
    });

    if (isLabReport) {
      // Lab report category
      prepared.category = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0074',
          code: 'LAB',
          display: 'Laboratory'
        }]
      }];
    } else {
      // Clinical note category - copy from code if available, else use default
      if (prepared.code && prepared.code.coding && prepared.code.coding.length > 0) {
        prepared.category = [{
          coding: prepared.code.coding.map(function(c) {
            return { ...c };
          })
        }];
      } else {
        // Default to general clinical note
        prepared.category = [{
          coding: [{
            system: 'http://loinc.org',
            code: '34117-2',
            display: 'History and physical note'
          }]
        }];
      }
    }
  }

  return prepared;
}

/**
 * Convert a FHIR resource to NDJSON line (single JSON object per line)
 * Applies US Core profile decorators based on resource type
 */
function resourceToNdjsonLine(resource) {
  // Remove MongoDB _id field if present, keep FHIR id
  let cleanResource = { ...resource };
  delete cleanResource._id;
  delete cleanResource._document;

  // Apply US Core decorators based on resource type
  if (cleanResource.resourceType === 'Patient') {
    cleanResource = preparePatientForUSCore(cleanResource);
  } else if (cleanResource.resourceType === 'DiagnosticReport') {
    cleanResource = prepareDiagnosticReportForUSCore(cleanResource);
  }

  return JSON.stringify(cleanResource);
}

/**
 * Filter a resource array per the bulkExport egress policy.
 * Invalid resources: 'warn' keeps them; 'annotate' keeps them and records an
 * OperationOutcome line; 'block' drops them and records the line.
 * outcomeLines: array collector of NDJSON strings for the job's error file.
 */
function applyEgressValidation(resources, jobId, outcomeLines) {
  return resources.filter(function(resource) {
    const outboundCheck = validateOutbound(resource, 'bulkExport');
    if (outboundCheck.action === 'pass') { return true; }
    outcomeLines.push(resourceToNdjsonLine(outboundCheck.operationOutcome));
    if (outboundCheck.action === 'block') {
      log.phi('dropping non-conformant resource from export job ' + jobId, null, { action: 'export' });
      return false;
    }
    return true; // annotate: keep the resource, error file records the issue
  });
}

/**
 * Get patient IDs from a Group resource
 */
async function getPatientIdsFromGroup(groupId) {
  const patientIds = [];

  // Try to find by FHIR id first, then by MongoDB _id
  let group = await Groups.findOneAsync({ id: groupId });
  if (!group) {
    group = await Groups.findOneAsync({ _id: groupId });
  }

  if (!group) {
    log.debug(`Group not found: ${groupId}`);
    return patientIds;
  }

  // Extract patient references from group.member
  const members = get(group, 'member', []);
  for (const member of members) {
    const reference = get(member, 'entity.reference', '');
    if (reference.startsWith('Patient/')) {
      patientIds.push(reference.replace('Patient/', ''));
    }
  }

  log.phi(`Found ${patientIds.length} patients in Group ${groupId}`, null, { action: 'export' });
  return patientIds;
}

/**
 * Fetch resources for a list of patients
 */
async function fetchPatientCompartmentResources(patientIds, resourceTypes, since) {
  const results = {};

  for (const resourceType of resourceTypes) {
    const config = PATIENT_COMPARTMENT_RESOURCES[resourceType];
    if (!config) {
      log.phi(`Unknown resource type: ${resourceType}`, null, { action: 'export' });
      continue;
    }

    const { collection, patientPath } = config;

    // Build query for patients
    const patientReferences = patientIds.map(id => `Patient/${id}`);
    const query = {
      [patientPath]: { $in: patientReferences }
    };

    // Add _since filter if provided
    if (since) {
      query['meta.lastUpdated'] = { $gte: new Date(since) };
    }

    try {
      const resources = await collection.find(query).fetchAsync();
      if (resources.length > 0) {
        results[resourceType] = resources;
        log.debug(`Found ${resources.length} ${resourceType} resources`);
      }
    } catch (error) {
      log.error(`Error fetching ${resourceType}:`, error.message);
    }
  }

  return results;
}

/**
 * Fetch Patient resources
 */
async function fetchPatients(patientIds, since) {
  const query = {
    $or: [
      { id: { $in: patientIds } },
      { _id: { $in: patientIds } }
    ]
  };

  if (since) {
    query['meta.lastUpdated'] = { $gte: new Date(since) };
  }

  try {
    const patients = await Patients.find(query).fetchAsync();
    console.log(`[BulkData] Found ${patients.length} Patient resources`);  // phi-audit: ok
    return patients;
  } catch (error) {
    log.phi('Error fetching patients', null, { action: 'export', error: error.message });
    return [];
  }
}

/**
 * Collect referenced resources (Organization, Practitioner, Location, etc.)
 */
async function collectReferencedResources(patientCompartmentResources) {
  const referencedIds = {
    Organization: new Set(),
    Practitioner: new Set(),
    PractitionerRole: new Set(),
    Location: new Set(),
    Medication: new Set(),
    RelatedPerson: new Set()
  };

  // Scan all resources for references
  for (const [resourceType, resources] of Object.entries(patientCompartmentResources)) {
    for (const resource of resources) {
      // Extract references based on resource type
      extractReferences(resource, referencedIds);
    }
  }

  const results = {};

  // Fetch each referenced resource type
  for (const [refType, ids] of Object.entries(referencedIds)) {
    if (ids.size === 0) continue;

    const config = REFERENCED_RESOURCES[refType];
    if (!config) continue;

    const idArray = Array.from(ids);
    const query = {
      $or: [
        { id: { $in: idArray } },
        { _id: { $in: idArray } }
      ]
    };

    try {
      const resources = await config.collection.find(query).fetchAsync();
      if (resources.length > 0) {
        results[refType] = resources;
        log.debug(`Found ${resources.length} referenced ${refType} resources`);
      }
    } catch (error) {
      log.error(`Error fetching referenced ${refType}:`, error.message);
    }
  }

  return results;
}

/**
 * Extract reference IDs from a resource
 */
function extractReferences(resource, referencedIds) {
  // Common reference paths
  const referencePaths = [
    'performer.reference',
    'recorder.reference',
    'asserter.reference',
    'requester.reference',
    'author.reference',
    'managingOrganization.reference',
    'organization.reference',
    'participant.individual.reference',
    'participant.member.reference',
    'serviceProvider.reference',
    'location.location.reference',
    'medicationReference.reference',
    'relationship.reference'
  ];

  for (const path of referencePaths) {
    const value = get(resource, path);
    if (value) {
      categorizeReference(value, referencedIds);
    }
  }

  // Handle arrays
  const arrayPaths = ['performer', 'author', 'participant', 'location'];
  for (const arrayPath of arrayPaths) {
    const arr = get(resource, arrayPath, []);
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const ref = get(item, 'reference') || get(item, 'individual.reference') || get(item, 'member.reference') || get(item, 'location.reference');
        if (ref) {
          categorizeReference(ref, referencedIds);
        }
      }
    }
  }
}

/**
 * Categorize a reference string and add to appropriate set
 */
function categorizeReference(reference, referencedIds) {
  if (!reference || typeof reference !== 'string') return;

  const [resourceType, id] = reference.split('/');

  if (referencedIds[resourceType] && id) {
    referencedIds[resourceType].add(id);
  }
}

/**
 * Process a Patient/$ehi-export job (runs asynchronously)
 * Simplified single-patient version of processExportJob
 */
async function processPatientEhiExportJob(jobId) {
  log.phi(`Processing Patient EHI export job: ${jobId}`, null, { action: 'export' });

  const job = await BulkExportJobs.findOneAsync({ _id: jobId });
  if (!job) {
    log.error(`EHI export job not found: ${jobId}`);
    return;
  }

  if (job.status === 'cancelled') {
    log.debug(`EHI export job was cancelled: ${jobId}`);
    return;
  }

  try {
    const { patientId, _type, _since, _outputFormat } = job.request;

    // Determine which resource types to export
    let resourceTypes = Object.keys(PATIENT_COMPARTMENT_RESOURCES);
    if (_type) {
      resourceTypes = _type.split(',').filter(t => PATIENT_COMPARTMENT_RESOURCES[t] || t === 'Patient');
    }

    // Fetch patient resource
    const patients = await fetchPatients([patientId], _since);

    if (patients.length === 0) {
      await BulkExportJobs.updateAsync(
        { _id: jobId, status: { $ne: 'cancelled' } },
        {
          $set: {
            status: 'complete',
            transactionTime: new Date().toISOString(),
            output: [],
            error: [{
              type: 'OperationOutcome',
              url: null,
              details: `Patient not found: ${patientId}`
            }]
          }
        }
      );
      log.phi(`EHI export job ${jobId} complete - patient not found`, null, { action: 'export' });
      return;
    }

    // Fetch patient compartment resources
    const patientResources = await fetchPatientCompartmentResources([patientId], resourceTypes, _since);

    // Collect referenced resources (Organization, Practitioner, etc.)
    const referencedResources = await collectReferencedResources(patientResources);

    // Generate NDJSON files
    const output = [];
    const outcomeLines = [];   // NDJSON OperationOutcome lines from egress validation
    const baseUrl = Meteor.absoluteUrl() + fhirPath;

    // Add Patient resources
    if (patients.length > 0) {
      const validPatients = applyEgressValidation(patients, jobId, outcomeLines);
      const ndjson = validPatients.map(resourceToNdjsonLine).join('\n');
      const fileKey = `${jobId}/Patient`;
      bulkExportOutputStore.set(fileKey, ndjson);

      output.push({
        type: 'Patient',
        count: validPatients.length,
        url: `${baseUrl}/$export-files/${jobId}/Patient`
      });
    }

    // Add patient compartment resources
    for (const [resourceType, resources] of Object.entries(patientResources)) {
      if (resources.length > 0) {
        const validResources = applyEgressValidation(resources, jobId, outcomeLines);
        const ndjson = validResources.map(resourceToNdjsonLine).join('\n');
        const fileKey = `${jobId}/${resourceType}`;
        bulkExportOutputStore.set(fileKey, ndjson);

        output.push({
          type: resourceType,
          count: validResources.length,
          url: `${baseUrl}/$export-files/${jobId}/${resourceType}`
        });
      }
    }

    // Add referenced resources
    for (const [resourceType, resources] of Object.entries(referencedResources)) {
      if (resources.length > 0) {
        const validResources = applyEgressValidation(resources, jobId, outcomeLines);
        const ndjson = validResources.map(resourceToNdjsonLine).join('\n');
        const fileKey = `${jobId}/${resourceType}`;
        bulkExportOutputStore.set(fileKey, ndjson);

        output.push({
          type: resourceType,
          count: validResources.length,
          url: `${baseUrl}/$export-files/${jobId}/${resourceType}`
        });
      }
    }

    // Record egress-validation failures as a bulk-export error file
    // (FHIR bulk-export-native error mechanism: OperationOutcome NDJSON in `error`)
    const errorEntries = [];
    if (outcomeLines.length > 0) {
      bulkExportOutputStore.set(`${jobId}/OperationOutcome`, outcomeLines.join('\n'));
      errorEntries.push({
        type: 'OperationOutcome',
        count: outcomeLines.length,
        url: `${baseUrl}/$export-files/${jobId}/OperationOutcome`
      });
      log.warn(`export job ${jobId}: ${outcomeLines.length} egress-validation issue(s) recorded in OperationOutcome file`);
    }

    // Update job as complete — guarded so a DELETE cancellation that landed
    // mid-processing isn't clobbered (cancelled jobs must poll as 404)
    const finalized = await BulkExportJobs.updateAsync(
      { _id: jobId, status: { $ne: 'cancelled' } },
      {
        $set: {
          status: 'complete',
          transactionTime: new Date().toISOString(),
          output: output,
          error: errorEntries
        }
      }
    );

    if (finalized === 0) {
      // Cancelled while processing — the cancel handler's file cleanup ran
      // before these files were stored, so remove them here
      for (const outputFile of [...output, ...errorEntries]) {
        bulkExportOutputStore.delete(`${jobId}/${outputFile.type}`);
      }
      log.debug(`EHI export job ${jobId} was cancelled during processing; output discarded`);
      return;
    }

    log.debug(`EHI export job ${jobId} complete with ${output.length} files`);

  } catch (error) {
    log.error(`Error processing EHI export job ${jobId}:`, error);

    await BulkExportJobs.updateAsync(
      { _id: jobId, status: { $ne: 'cancelled' } },
      {
        $set: {
          status: 'error',
          error: [{
            type: 'OperationOutcome',
            url: null,
            details: error.message
          }]
        }
      }
    );
  }
}

/**
 * Process an export job (runs asynchronously)
 */
async function processExportJob(jobId) {
  log.debug(`Processing export job: ${jobId}`);

  const job = await BulkExportJobs.findOneAsync({ _id: jobId });
  if (!job) {
    log.error(`Job not found: ${jobId}`);
    return;
  }

  if (job.status === 'cancelled') {
    log.debug(`Job was cancelled: ${jobId}`);
    return;
  }

  try {
    const { groupId, _type, _since, _outputFormat } = job.request;

    // Get patient IDs from group
    const patientIds = await getPatientIdsFromGroup(groupId);

    if (patientIds.length === 0) {
      // No patients in group - complete with empty output
      await BulkExportJobs.updateAsync(jobId, {
        $set: {
          status: 'complete',
          transactionTime: new Date().toISOString(),
          output: [],
          error: []
        }
      });
      log.phi(`Job ${jobId} complete with no patients`, null, { action: 'export' });
      return;
    }

    // Determine which resource types to export
    let resourceTypes = Object.keys(PATIENT_COMPARTMENT_RESOURCES);
    if (_type) {
      resourceTypes = _type.split(',').filter(t => PATIENT_COMPARTMENT_RESOURCES[t] || t === 'Patient');
    }

    // Fetch patient resources
    const patients = await fetchPatients(patientIds, _since);

    // Fetch patient compartment resources
    const patientResources = await fetchPatientCompartmentResources(patientIds, resourceTypes, _since);

    // Collect referenced resources
    const referencedResources = await collectReferencedResources(patientResources);

    // Generate NDJSON files
    const output = [];
    const outcomeLines = [];   // NDJSON OperationOutcome lines from egress validation
    const baseUrl = Meteor.absoluteUrl() + fhirPath;

    // Add Patient resources
    if (patients.length > 0) {
      const validPatients = applyEgressValidation(patients, jobId, outcomeLines);
      const ndjson = validPatients.map(resourceToNdjsonLine).join('\n');
      const fileKey = `${jobId}/Patient`;
      bulkExportOutputStore.set(fileKey, ndjson);

      output.push({
        type: 'Patient',
        count: validPatients.length,
        url: `${baseUrl}/$export-files/${jobId}/Patient`
      });
    }

    // Add patient compartment resources
    for (const [resourceType, resources] of Object.entries(patientResources)) {
      if (resources.length > 0) {
        const validResources = applyEgressValidation(resources, jobId, outcomeLines);
        const ndjson = validResources.map(resourceToNdjsonLine).join('\n');
        const fileKey = `${jobId}/${resourceType}`;
        bulkExportOutputStore.set(fileKey, ndjson);

        output.push({
          type: resourceType,
          count: validResources.length,
          url: `${baseUrl}/$export-files/${jobId}/${resourceType}`
        });
      }
    }

    // Add referenced resources
    for (const [resourceType, resources] of Object.entries(referencedResources)) {
      if (resources.length > 0) {
        const validResources = applyEgressValidation(resources, jobId, outcomeLines);
        const ndjson = validResources.map(resourceToNdjsonLine).join('\n');
        const fileKey = `${jobId}/${resourceType}`;
        bulkExportOutputStore.set(fileKey, ndjson);

        output.push({
          type: resourceType,
          count: validResources.length,
          url: `${baseUrl}/$export-files/${jobId}/${resourceType}`
        });
      }
    }

    // Record egress-validation failures as a bulk-export error file
    // (FHIR bulk-export-native error mechanism: OperationOutcome NDJSON in `error`)
    const errorEntries = [];
    if (outcomeLines.length > 0) {
      bulkExportOutputStore.set(`${jobId}/OperationOutcome`, outcomeLines.join('\n'));
      errorEntries.push({
        type: 'OperationOutcome',
        count: outcomeLines.length,
        url: `${baseUrl}/$export-files/${jobId}/OperationOutcome`
      });
      log.warn(`export job ${jobId}: ${outcomeLines.length} egress-validation issue(s) recorded in OperationOutcome file`);
    }

    // Update job as complete — guarded so a DELETE cancellation that landed
    // mid-processing isn't clobbered (cancelled jobs must poll as 404)
    const finalized = await BulkExportJobs.updateAsync(
      { _id: jobId, status: { $ne: 'cancelled' } },
      {
        $set: {
          status: 'complete',
          transactionTime: new Date().toISOString(),
          output: output,
          error: errorEntries
        }
      }
    );

    if (finalized === 0) {
      // Cancelled while processing — the cancel handler's file cleanup ran
      // before these files were stored, so remove them here
      for (const outputFile of [...output, ...errorEntries]) {
        bulkExportOutputStore.delete(`${jobId}/${outputFile.type}`);
      }
      log.debug(`Job ${jobId} was cancelled during processing; output discarded`);
      return;
    }

    log.debug(`Job ${jobId} complete with ${output.length} files`);

  } catch (error) {
    log.error(`Error processing job ${jobId}:`, error);

    await BulkExportJobs.updateAsync(
      { _id: jobId, status: { $ne: 'cancelled' } },
      {
        $set: {
          status: 'error',
          error: [{
            type: 'OperationOutcome',
            url: null,
            details: error.message
          }]
        }
      }
    );
  }
}

// =============================================================================
// Endpoint Handlers
// =============================================================================

/**
 * Handle Group/$export request (GET or POST)
 */
async function handleGroupExport(req, res) {
  const groupId = req.params.id;
  log.debug(`${req.method} Group/${groupId}/$export`);

  logToInboundQueue(req);

  res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check authorization
  const authorizationContext = await parseUserAuthorization(req);

  if (!authorizationContext || !await isAuthorized(authorizationContext)) {
    log.debug('Unauthorized request rejected');
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: { text: 'Authorization required for bulk data export' },
        diagnostics: 'A valid access token with appropriate scopes is required to initiate bulk data export.'
      }]
    });
  }

  // Check for required Prefer header
  const preferHeader = req.headers['prefer'];
  if (!preferHeader || !preferHeader.includes('respond-async')) {
    log.debug('Missing Prefer: respond-async header');
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'required',
        details: { text: 'Prefer header with respond-async is required' },
        diagnostics: 'Bulk data export requires the Prefer: respond-async header.'
      }]
    });
  }

  // Check scope authorization - bulk export requires any system/ scope
  if (!isBulkExportAuthorized(authorizationContext)) {
    log.debug('Insufficient scope');
    return res.status(403).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'forbidden',
        details: { text: 'Insufficient scope for bulk data export' },
        diagnostics: 'The access token does not have sufficient scope for bulk export.'
      }]
    });
  }

  // Parse query parameters
  const _type = req.query._type;
  const _since = req.query._since;
  const _outputFormat = req.query._outputFormat || 'application/fhir+ndjson';

  // Validate _outputFormat
  const validFormats = ['application/fhir+ndjson', 'application/ndjson', 'ndjson'];
  if (!validFormats.includes(_outputFormat)) {
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'invalid',
        details: { text: 'Unsupported output format' },
        diagnostics: `Supported formats: ${validFormats.join(', ')}`
      }]
    });
  }

  // Create export job
  const jobId = Random.id();
  const baseUrl = Meteor.absoluteUrl() + fhirPath;
  const pollingUrl = `${baseUrl}/$export-poll-status/${jobId}`;

  await BulkExportJobs.insertAsync({
    _id: jobId,
    status: 'in-progress',
    request: {
      groupId: groupId,
      _type: _type,
      _since: _since,
      _outputFormat: _outputFormat
    },
    requestTime: new Date().toISOString(),
    clientId: get(authorizationContext, 'clientId'),
    requireAccessToken: true,
    output: [],
    error: []
  });

  log.debug(`Created job ${jobId}, polling URL: ${pollingUrl}`);

  // Start async processing
  // Use setImmediate to return 202 immediately while processing continues
  setImmediate(() => {
    processExportJob(jobId).catch(err => {
      log.error(`Async job error for ${jobId}:`, err);
    });
  });

  // Return 202 Accepted with Content-Location
  res.setHeader('Content-Location', pollingUrl);
  return res.status(202).end();
}

/**
 * Handle Patient/$ehi-export request (GET or POST)
 *
 * Unlike Group/$export which requires system-level scopes,
 * $ehi-export also accepts patient-level scopes (patients can export their own data)
 * and elevated roles (healthcare providers, admins).
 */
async function handlePatientEhiExport(req, res) {
  const patientId = req.params.id;
  log.debug(`${req.method} Patient/${patientId}/$ehi-export`);

  logToInboundQueue(req);

  res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check authorization
  const authorizationContext = await parseUserAuthorization(req);

  if (!authorizationContext || !await isAuthorized(authorizationContext)) {
    log.debug('Unauthorized EHI export request rejected');
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: { text: 'Authorization required for EHI export' },
        diagnostics: 'A valid access token is required to initiate a patient EHI export.'
      }]
    });
  }

  // Check EHI export authorization (accepts broader set of roles/scopes than Group/$export)
  if (!isEhiExportAuthorized(authorizationContext)) {
    log.debug('Insufficient scope for EHI export');
    return res.status(403).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'forbidden',
        details: { text: 'Insufficient scope for EHI export' },
        diagnostics: 'The access token does not have sufficient scope for patient EHI export.'
      }]
    });
  }

  // For patient-scoped tokens, verify they can only export their own data
  if (get(authorizationContext, 'role') === 'patient' && get(authorizationContext, 'isOAuthToken')) {
    const authorizedPatientId = get(authorizationContext, 'patientId', '');
    if (authorizedPatientId && authorizedPatientId !== patientId) {
      log.debug(`Patient ${authorizedPatientId} attempted to export Patient/${patientId}`);
      return res.status(403).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'forbidden',
          details: { text: 'Cannot export another patient\'s data' },
          diagnostics: 'Patient-scoped tokens can only export the authorized patient\'s own data.'
        }]
      });
    }
  }

  // Check for required Prefer header
  const preferHeader = req.headers['prefer'];
  if (!preferHeader || !preferHeader.includes('respond-async')) {
    log.debug('Missing Prefer: respond-async header');
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'required',
        details: { text: 'Prefer header with respond-async is required' },
        diagnostics: 'EHI export requires the Prefer: respond-async header.'
      }]
    });
  }

  // Parse query parameters
  const _type = req.query._type;
  const _since = req.query._since;
  const _outputFormat = req.query._outputFormat || 'application/fhir+ndjson';

  // Validate _outputFormat
  const validFormats = ['application/fhir+ndjson', 'application/ndjson', 'ndjson'];
  if (!validFormats.includes(_outputFormat)) {
    return res.status(400).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'invalid',
        details: { text: 'Unsupported output format' },
        diagnostics: `Supported formats: ${validFormats.join(', ')}`
      }]
    });
  }

  // Create export job
  const jobId = Random.id();
  const baseUrl = Meteor.absoluteUrl() + fhirPath;
  const pollingUrl = `${baseUrl}/$export-poll-status/${jobId}`;

  await BulkExportJobs.insertAsync({
    _id: jobId,
    status: 'in-progress',
    exportType: 'patient-ehi-export',
    request: {
      patientId: patientId,
      _type: _type,
      _since: _since,
      _outputFormat: _outputFormat
    },
    requestTime: new Date().toISOString(),
    clientId: get(authorizationContext, 'clientId'),
    userId: get(authorizationContext, 'userId'),
    requireAccessToken: true,
    output: [],
    error: []
  });

  log.debug(`Created EHI export job ${jobId} for Patient/${patientId}, polling URL: ${pollingUrl}`);

  // Start async processing
  setImmediate(() => {
    processPatientEhiExportJob(jobId).catch(err => {
      log.error(`Async EHI export job error for ${jobId}:`, err);
    });
  });

  // Return 202 Accepted with Content-Location
  res.setHeader('Content-Location', pollingUrl);
  return res.status(202).end();
}

/**
 * Handle export status polling request
 */
async function handleExportStatus(req, res) {
  const jobId = req.params.jobId;
  log.debug(`GET $export-poll-status/${jobId}`);

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check authorization
  const authorizationContext = await parseUserAuthorization(req);

  if (!authorizationContext || !await isAuthorized(authorizationContext)) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: { text: 'Authorization required' }
      }]
    });
  }

  // Find the job
  const job = await BulkExportJobs.findOneAsync({ _id: jobId });

  if (!job) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        details: { text: 'Export job not found' },
        diagnostics: `No export job found with ID: ${jobId}`
      }]
    });
  }

  // Check if cancelled
  if (job.status === 'cancelled') {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'deleted',
        details: { text: 'Export job was cancelled' }
      }]
    });
  }

  // Check if still processing
  if (job.status === 'in-progress') {
    res.setHeader('X-Progress', 'Processing export...');
    return res.status(202).end();
  }

  // Check if error
  if (job.status === 'error') {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'exception',
        details: { text: 'Export job failed' },
        diagnostics: get(job, 'error[0].details', 'Unknown error')
      }]
    });
  }

  // Job is complete - return 200 with output manifest
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Expires', moment().add(1, 'hour').toISOString());

  // Build the request URL based on export type
  let requestUrl;
  if (job.exportType === 'patient-ehi-export') {
    requestUrl = `${Meteor.absoluteUrl()}${fhirPath}/Patient/${job.request.patientId}/$ehi-export`;
  } else {
    requestUrl = `${Meteor.absoluteUrl()}${fhirPath}/Group/${job.request.groupId}/$export`;
  }

  return res.status(200).json({
    transactionTime: job.transactionTime,
    request: requestUrl,
    requiresAccessToken: job.requireAccessToken,
    output: job.output || [],
    error: job.error || []
  });
}

/**
 * Handle export cancellation request
 */
async function handleExportCancel(req, res) {
  const jobId = req.params.jobId;
  log.debug(`DELETE $export-poll-status/${jobId}`);

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check authorization
  const authorizationContext = await parseUserAuthorization(req);

  if (!authorizationContext || !await isAuthorized(authorizationContext)) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(401).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'security',
        details: { text: 'Authorization required' }
      }]
    });
  }

  // Find and cancel the job
  const job = await BulkExportJobs.findOneAsync({ _id: jobId });

  if (!job) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        details: { text: 'Export job not found' }
      }]
    });
  }

  // Mark as cancelled
  await BulkExportJobs.updateAsync(jobId, {
    $set: { status: 'cancelled' }
  });

  // Clean up any stored files
  for (const outputFile of (job.output || [])) {
    const fileKey = `${jobId}/${outputFile.type}`;
    bulkExportOutputStore.delete(fileKey);
  }

  log.debug(`Job ${jobId} cancelled`);

  return res.status(202).end();
}

/**
 * Handle NDJSON file download
 */
async function handleFileDownload(req, res) {
  const { jobId, fileType } = req.params;
  log.debug(`GET $export-files/${jobId}/${fileType}`);

  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check authorization
  const authorizationContext = await parseUserAuthorization(req);

  // Find the job to check if access token is required
  const job = await BulkExportJobs.findOneAsync({ _id: jobId });

  if (!job) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        details: { text: 'Export job not found' }
      }]
    });
  }

  // Check authorization if required
  if (job.requireAccessToken) {
    if (!authorizationContext || !await isAuthorized(authorizationContext)) {
      res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
      return res.status(401).json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'security',
          details: { text: 'Authorization required to download export files' }
        }]
      });
    }
  }

  // Get the NDJSON content
  const fileKey = `${jobId}/${fileType}`;
  const ndjsonContent = bulkExportOutputStore.get(fileKey);

  if (!ndjsonContent) {
    res.setHeader('Content-Type', 'application/fhir+json;charset=utf-8');
    return res.status(404).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'not-found',
        details: { text: 'Export file not found' },
        diagnostics: `File not found: ${fileType}`
      }]
    });
  }

  // Return NDJSON content
  res.setHeader('Content-Type', 'application/fhir+ndjson');
  return res.status(200).send(ndjsonContent);
}

// =============================================================================
// Route Registration
// =============================================================================

export function registerBulkDataEndpoints() {
  log.debug('Registering bulk data endpoints...');

  // Patient/$ehi-export - GET (register before Group to avoid route conflicts)
  WebApp.handlers.get('/' + fhirPath + '/Patient/:id/\\$ehi-export', handlePatientEhiExport);

  // Patient/$ehi-export - POST
  WebApp.handlers.post('/' + fhirPath + '/Patient/:id/\\$ehi-export', handlePatientEhiExport);

  // Group/$export - GET
  WebApp.handlers.get('/' + fhirPath + '/Group/:id/\\$export', handleGroupExport);

  // Group/$export - POST
  WebApp.handlers.post('/' + fhirPath + '/Group/:id/\\$export', handleGroupExport);

  // Export status polling (shared by Group/$export and Patient/$ehi-export)
  WebApp.handlers.get('/' + fhirPath + '/\\$export-poll-status/:jobId', handleExportStatus);

  // Export cancellation (shared)
  WebApp.handlers.delete('/' + fhirPath + '/\\$export-poll-status/:jobId', handleExportCancel);

  // NDJSON file download (shared)
  WebApp.handlers.get('/' + fhirPath + '/\\$export-files/:jobId/:fileType', handleFileDownload);

  log.debug('Bulk data endpoints registered:');
  log.debug(`  - GET/POST /${fhirPath}/Patient/:id/$ehi-export`);
  log.debug(`  - GET/POST /${fhirPath}/Group/:id/$export`);
  log.debug(`  - GET /${fhirPath}/$export-poll-status/:jobId`);
  log.debug(`  - DELETE /${fhirPath}/$export-poll-status/:jobId`);
  log.debug(`  - GET /${fhirPath}/$export-files/:jobId/:fileType`);
}

// Register endpoints immediately at module load (not in Meteor.startup)
// This ensures routes are registered BEFORE FhirEndpoints.js catch-all handler
registerBulkDataEndpoints();

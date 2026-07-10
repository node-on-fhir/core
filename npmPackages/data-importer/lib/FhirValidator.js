// packages/data-importer/lib/FhirValidator.js
//
// Pure utility for validating FHIR JSON/NDJSON payloads.
// No Meteor dependencies — can be used from client or server.

import { resolveBundleReferences } from './BundleReferenceResolver.js';

var KNOWN_RESOURCE_TYPES = new Set([
  'Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance',
  'Appointment', 'AppointmentResponse', 'AuditEvent', 'Basic',
  'Binary', 'BiologicallyDerivedProduct', 'BodyStructure', 'Bundle',
  'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry',
  'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse',
  'ClinicalImpression', 'CodeSystem', 'Communication', 'CommunicationRequest',
  'CompartmentDefinition', 'Composition', 'ConceptMap', 'Condition',
  'Consent', 'Contract', 'Coverage', 'CoverageEligibilityRequest',
  'CoverageEligibilityResponse', 'DetectedIssue', 'Device', 'DeviceDefinition',
  'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement', 'DiagnosticReport',
  'DocumentManifest', 'DocumentReference', 'EffectEvidenceSynthesis',
  'Encounter', 'Endpoint', 'EnrollmentRequest', 'EnrollmentResponse',
  'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable',
  'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory',
  'Flag', 'Goal', 'GraphDefinition', 'Group', 'GuidanceResponse',
  'HealthcareService', 'ImagingStudy', 'Immunization',
  'ImmunizationEvaluation', 'ImmunizationRecommendation',
  'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library',
  'Linkage', 'List', 'Location', 'Measure', 'MeasureReport',
  'Media', 'Medication', 'MedicationAdministration',
  'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest',
  'MedicationStatement', 'MedicinalProduct', 'MedicinalProductAuthorization',
  'MedicinalProductContraindication', 'MedicinalProductIndication',
  'MedicinalProductIngredient', 'MedicinalProductInteraction',
  'MedicinalProductManufactured', 'MedicinalProductPackaged',
  'MedicinalProductPharmaceutical', 'MedicinalProductUndesirableEffect',
  'MessageDefinition', 'MessageHeader', 'MolecularSequence',
  'NamingSystem', 'NutritionOrder', 'Observation',
  'ObservationDefinition', 'OperationDefinition', 'OperationOutcome',
  'Organization', 'OrganizationAffiliation', 'Parameters', 'Patient',
  'PaymentNotice', 'PaymentReconciliation', 'Person', 'PlanDefinition',
  'Practitioner', 'PractitionerRole', 'Procedure', 'Provenance',
  'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson',
  'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition',
  'ResearchStudy', 'ResearchSubject', 'RiskAssessment',
  'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter',
  'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition',
  'StructureDefinition', 'StructureMap', 'Subscription',
  'SubstanceSpecification', 'Substance', 'SubstanceNucleicAcid',
  'SubstancePolymer', 'SubstanceProtein', 'SubstanceReferenceInformation',
  'SubstanceSourceMaterial', 'SupplyDelivery', 'SupplyRequest',
  'Task', 'TerminologyCapabilities', 'TestReport', 'TestScript',
  'ValueSet', 'VerificationResult', 'VisionPrescription'
]);

/**
 * Validate a FHIR payload string (JSON or NDJSON).
 *
 * @param {string} text - Raw text to validate
 * @returns {{ resources: Array, issues: Array, format: string|null, parseError: string|null }}
 */
function validateFhirPayload(text) {
  var result = {
    resources: [],
    issues: [],
    format: null,
    parseError: null
  };

  if (!text || !text.trim()) {
    result.parseError = 'Input is empty';
    return result;
  }

  var trimmed = text.replace(/^\uFEFF/, '').trim();

  // Try JSON first
  var jsonResult = tryParseJson(trimmed);
  if (jsonResult) {
    result.resources = jsonResult.resources;
    result.format = jsonResult.format;
    validateResources(result.resources, result.issues);
    return result;
  }

  // Try NDJSON
  var ndjsonResult = tryParseNdjson(trimmed);
  if (ndjsonResult) {
    result.resources = ndjsonResult.resources;
    result.format = 'ndjson';
    if (ndjsonResult.lineErrors.length > 0) {
      ndjsonResult.lineErrors.forEach(function(lineErr) {
        result.issues.push({
          severity: 'error',
          resourceIndex: -1,
          field: 'line ' + lineErr.line,
          message: 'JSON parse error: ' + lineErr.message
        });
      });
    }
    validateResources(result.resources, result.issues);
    return result;
  }

  // Neither worked
  try {
    JSON.parse(trimmed);
  } catch (e) {
    result.parseError = 'JSON syntax error: ' + e.message;
  }
  if (!result.parseError) {
    result.parseError = 'Unrecognized format — expected FHIR Bundle JSON, NDJSON, or single resource';
  }

  return result;
}

function tryParseJson(text) {
  var parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return null;
  }

  var resources = [];

  // FHIR Bundle — resolve intra-bundle urn:uuid/fullUrl references to
  // relative form before flattening (self-contained document bundles;
  // entry.fullUrl doesn't survive the resource list)
  if (parsed && parsed.resourceType === 'Bundle' && Array.isArray(parsed.entry)) {
    var resolved = resolveBundleReferences(parsed);
    if (resolved.resolvedCount > 0) {
      console.log('[FhirValidator] Resolved ' + resolved.resolvedCount + ' intra-bundle references via the fullUrl index');
    }
    resources = resolved.resources.slice();
    return { resources: resources, format: 'bundle' };
  }

  // Array of resources
  if (Array.isArray(parsed)) {
    return { resources: parsed, format: 'json' };
  }

  // Single resource or object
  if (parsed && typeof parsed === 'object') {
    return { resources: [parsed], format: 'json' };
  }

  return null;
}

function tryParseNdjson(text) {
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  if (lines.length < 2) return null;

  var resources = [];
  var lineErrors = [];
  var failures = 0;

  lines.forEach(function(line, idx) {
    try {
      resources.push(JSON.parse(line));
    } catch (e) {
      failures++;
      lineErrors.push({ line: idx + 1, message: e.message });
    }
  });

  // Accept if we parsed at least one resource and the majority succeeded
  if (resources.length > 0 && resources.length >= failures) {
    return { resources: resources, lineErrors: lineErrors };
  }

  return null;
}

function validateResources(resources, issues) {
  resources.forEach(function(resource, idx) {
    // Check resourceType exists
    if (!resource.resourceType) {
      issues.push({
        severity: 'error',
        resourceIndex: idx,
        field: 'resourceType',
        message: 'Missing required field "resourceType"'
      });
      return;
    }

    // Check resourceType is known
    if (!KNOWN_RESOURCE_TYPES.has(resource.resourceType)) {
      issues.push({
        severity: 'warning',
        resourceIndex: idx,
        field: 'resourceType',
        message: 'Unknown resource type "' + resource.resourceType + '"'
      });
    }

    // Check id field
    if (!resource.id) {
      issues.push({
        severity: 'info',
        resourceIndex: idx,
        field: 'id',
        message: resource.resourceType + ' is missing "id" — one will be assigned on import'
      });
    }
  });
}

export { validateFhirPayload, KNOWN_RESOURCE_TYPES };
export default validateFhirPayload;

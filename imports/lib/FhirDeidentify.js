// imports/lib/FhirDeidentify.js
//
// Pure de-identification transforms for parsed FHIR resources, applied
// client-side before import. Shared by the Apple Health importer today and
// intended for the PDF / Data / Social-Media importers (the FHIR-resource
// sibling of imports/ui/DICOM/components/DicomDeidentifyControls.jsx +
// DicomProcessing.js, following the same controls-bag idiom).
//
// Isomorphic and dependency-free: runs under Meteor (client or server) and
// plain `node --test` (tests/unit/imports/lib/FhirDeidentify.test.mjs).
//
// Philosophy: permissive-in/strict-out. Resources and fields the transforms
// don't understand pass through untouched; the one hard failure is asking for
// anonymous reassignment without an anonymous identity to assign (silently
// keeping the real identity would be a privacy failure).

export const DEFAULT_FHIR_DEID_CONTROLS = {
  deidentifyEnabled: false,
  assignAnonymousPatient: false,   // subject/patient → anonymous Patient reference
  stripDemographics: false,        // drop demographics + device/source metadata
  dateHandling: 'none',            // 'none' | 'truncateToDate' | 'shiftRandom'
  dateShiftDays: null              // set once per import session when 'shiftRandom'
};

// Datetime-valued fields coarsened/shifted by dateHandling. Period-valued
// fields are handled via PERIOD_FIELDS (start/end within).
const DATETIME_FIELDS = [
  'effectiveDateTime', 'issued', 'recordedDate', 'onsetDateTime',
  'abatementDateTime', 'authoredOn', 'date', 'occurrenceDateTime', 'performedDateTime'
];
const PERIOD_FIELDS = ['effectivePeriod', 'period', 'occurrencePeriod', 'performedPeriod'];

function hasActiveTransforms(controls) {
  if (!controls || !controls.deidentifyEnabled) {
    return false;
  }
  return !!controls.assignAnonymousPatient
    || !!controls.stripDemographics
    || (controls.dateHandling && controls.dateHandling !== 'none');
}

function referenceId(reference) {
  if (typeof reference !== 'string') {
    return null;
  }
  const slash = reference.lastIndexOf('/');
  return slash === -1 ? reference : reference.slice(slash + 1);
}

function assignAnonymous(resource, anonymousPatientRef) {
  if (resource.resourceType === 'Patient') {
    // Replace the identity wholesale — carrying any original Patient fields
    // forward would defeat the reassignment.
    return {
      resourceType: 'Patient',
      id: referenceId(anonymousPatientRef.reference),
      name: [{ text: anonymousPatientRef.display || 'Anonymous Patient' }]
    };
  }
  if (resource.subject && typeof resource.subject.reference === 'string'
      && resource.subject.reference.indexOf('Patient/') === 0) {
    resource.subject = {
      reference: anonymousPatientRef.reference,
      display: anonymousPatientRef.display
    };
  }
  if (resource.patient && typeof resource.patient.reference === 'string') {
    resource.patient = {
      reference: anonymousPatientRef.reference,
      display: anonymousPatientRef.display
    };
  }
  return resource;
}

function stripDemographicFields(resource) {
  // Device / source metadata identifies the person's hardware and household
  // naming (e.g. "Camila's iPhone"); extensions carry demographics like
  // birthsex and importer source names.
  delete resource.device;
  delete resource.extension;
  if (resource.resourceType === 'Patient') {
    delete resource.birthDate;
    delete resource.gender;
  }
  return resource;
}

function transformDatetime(value, controls) {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  if (controls.dateHandling === 'truncateToDate') {
    // Only datetime-precision values need coarsening; date-only stays put
    // (which also makes repeated application idempotent).
    if (value.indexOf('T') === -1) {
      return value;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return value;
    }
    return value.slice(0, 10);
  }
  if (controls.dateHandling === 'shiftRandom') {
    if (typeof controls.dateShiftDays !== 'number' || !isFinite(controls.dateShiftDays)) {
      return value;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return value;
    }
    const shifted = new Date(parsed.getTime() + controls.dateShiftDays * 86400000);
    // Preserve the original precision: date-only in, date-only out.
    return value.indexOf('T') === -1 ? shifted.toISOString().slice(0, 10) : shifted.toISOString();
  }
  return value;
}

function transformDates(resource, controls) {
  DATETIME_FIELDS.forEach(function(field) {
    if (resource[field] !== undefined) {
      resource[field] = transformDatetime(resource[field], controls);
    }
  });
  PERIOD_FIELDS.forEach(function(field) {
    const period = resource[field];
    if (period && typeof period === 'object') {
      if (period.start !== undefined) {
        period.start = transformDatetime(period.start, controls);
      }
      if (period.end !== undefined) {
        period.end = transformDatetime(period.end, controls);
      }
    }
  });
  return resource;
}

/**
 * Apply the selected de-identification transforms to an array of FHIR
 * resources. Never mutates the input; returns transformed deep copies.
 *
 * @param {Array<Object>} resources  parsed FHIR resources
 * @param {Object} controls          a DEFAULT_FHIR_DEID_CONTROLS-shaped bag
 * @param {Object} context           { anonymousPatientRef: { reference, display } }
 *                                   — required when assignAnonymousPatient is on
 */
export function applyFhirDeidentification(resources, controls, context) {
  if (!Array.isArray(resources)) {
    return [];
  }
  const clones = JSON.parse(JSON.stringify(resources));
  if (!hasActiveTransforms(controls)) {
    return clones;
  }

  const anonymousPatientRef = context && context.anonymousPatientRef;
  if (controls.assignAnonymousPatient
      && !(anonymousPatientRef && typeof anonymousPatientRef.reference === 'string')) {
    throw new Error('applyFhirDeidentification: assignAnonymousPatient requires context.anonymousPatientRef');
  }

  return clones.map(function(resource) {
    if (!resource || typeof resource !== 'object') {
      return resource;
    }
    let transformed = resource;
    if (controls.assignAnonymousPatient) {
      transformed = assignAnonymous(transformed, anonymousPatientRef);
    }
    if (controls.stripDemographics) {
      transformed = stripDemographicFields(transformed);
    }
    if (controls.dateHandling && controls.dateHandling !== 'none') {
      transformed = transformDates(transformed, controls);
    }
    return transformed;
  });
}

export default { DEFAULT_FHIR_DEID_CONTROLS, applyFhirDeidentification };

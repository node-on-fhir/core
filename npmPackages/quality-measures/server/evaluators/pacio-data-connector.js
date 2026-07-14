// packages/quality-measures/server/evaluators/pacio-data-connector.js
//
// Data access layer for PACIO measure evaluators.
// Queries Compositions, DocumentReferences, Encounters, Conditions,
// Procedures, and Patients from global.Collections (Meteor v3 async APIs).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('pacio-data-connector') : console);

function patientRefs(patientId) {
  return ['Patient/' + patientId, 'urn:uuid:' + patientId];
}

/**
 * Get TOC Compositions for a patient within a measurement period.
 * @param {string} patientId - Patient _id
 * @param {string} profileUrl - TOC profile URL to filter by (optional)
 * @param {string} periodStart - ISO date string
 * @param {string} periodEnd - ISO date string
 * @returns {Array} Array of Composition resources
 */
export async function getPatientCompositions(patientId, profileUrl, periodStart, periodEnd) {
  const Compositions = get(global, 'Collections.Compositions');
  if (!Compositions) {
    console.warn('[pacio-data-connector] Compositions collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) }
  };

  if (periodStart && periodEnd) {
    query.date = { $gte: periodStart, $lte: periodEnd };
  }

  if (profileUrl) {
    query['meta.profile'] = profileUrl;
  }

  return await Compositions.find(query).fetchAsync();
}

/**
 * Get DocumentReferences for a patient filtered by type LOINC codes.
 * Excludes revoked (entered-in-error) documents.
 * @param {string} patientId - Patient _id
 * @param {Array<string>} typeCodes - LOINC codes to filter by
 * @param {string} periodStart - ISO date string (optional)
 * @param {string} periodEnd - ISO date string (optional)
 * @returns {Array} Array of DocumentReference resources
 */
export async function getPatientDocumentReferences(patientId, typeCodes, periodStart, periodEnd) {
  const DocumentReferences = get(global, 'Collections.DocumentReferences');
  if (!DocumentReferences) {
    console.warn('[pacio-data-connector] DocumentReferences collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    status: { $nin: ['entered-in-error'] }
  };

  if (typeCodes && typeCodes.length > 0) {
    query['type.coding.code'] = { $in: typeCodes };
  }

  if (periodStart && periodEnd) {
    query.date = { $gte: periodStart, $lte: periodEnd };
  }

  return await DocumentReferences.find(query).fetchAsync();
}

/**
 * Get inpatient encounters with a discharge (period.end) inside the
 * measurement period. Used for CMS1317v1's initial population.
 * Matches the Encounter Inpatient value set via type codes (faithful, per
 * VS 2.16.840.1.113883.3.666.5.307) OR class codes (PACIO-pragmatic).
 * @param {string} patientId - Patient _id
 * @param {Array<string>} classCodes - Encounter class codes (e.g., ['IMP','ACUTE'])
 * @param {string} periodStart - ISO date string
 * @param {string} periodEnd - ISO date string
 * @param {Array<string>} typeCodes - Encounter type codes (Encounter Inpatient VS expansion)
 * @returns {Array} Array of Encounter resources
 */
export async function getInpatientDischargeEncounters(patientId, classCodes, periodStart, periodEnd, typeCodes) {
  const Encounters = get(global, 'Collections.Encounters');
  if (!Encounters) {
    console.warn('[pacio-data-connector] Encounters collection not available');
    return [];
  }

  const matchers = [{ 'class.code': { $in: classCodes } }];
  if (typeCodes && typeCodes.length > 0) {
    matchers.push({ 'type.coding.code': { $in: typeCodes } });
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    $or: matchers,
    status: { $in: ['finished', 'completed', 'discharged'] },
    'period.end': { $gte: periodStart, $lte: periodEnd }
  };

  return await Encounters.find(query).fetchAsync();
}

/**
 * Get Observations for a patient matching specific codes within a date window.
 * (QDM "Assessment, Performed" maps to FHIR Observation.)
 * @param {string} patientId - Patient _id
 * @param {Array<string>} codes - Observation codes (e.g., ['75773-2'])
 * @param {string} windowStart - ISO date string (optional)
 * @param {string} windowEnd - ISO date string (optional)
 * @returns {Array} Array of Observation resources
 */
export async function getPatientObservations(patientId, codes, windowStart, windowEnd) {
  const Observations = get(global, 'Collections.Observations');
  if (!Observations) {
    console.warn('[pacio-data-connector] Observations collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    'code.coding.code': { $in: codes },
    status: { $nin: ['entered-in-error', 'cancelled'] }
  };

  if (windowStart && windowEnd) {
    query.$or = [
      { effectiveDateTime: { $gte: windowStart, $lte: windowEnd } },
      { 'effectivePeriod.start': { $gte: windowStart, $lte: windowEnd } },
      { issued: { $gte: windowStart, $lte: windowEnd } }
    ];
  }

  return await Observations.find(query).fetchAsync();
}

/**
 * Get ServiceRequests for a patient matching specific codes within a date window.
 * (QDM "Intervention, Order" maps to FHIR ServiceRequest; date = authoredOn.)
 * @param {string} patientId - Patient _id
 * @param {Array<string>} codes - Order codes (e.g., ['Z66'])
 * @param {string} windowStart - ISO date string (optional)
 * @param {string} windowEnd - ISO date string (optional)
 * @returns {Array} Array of ServiceRequest resources
 */
export async function getPatientServiceRequests(patientId, codes, windowStart, windowEnd) {
  const ServiceRequests = get(global, 'Collections.ServiceRequests');
  if (!ServiceRequests) {
    console.warn('[pacio-data-connector] ServiceRequests collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    'code.coding.code': { $in: codes },
    status: { $nin: ['entered-in-error', 'revoked'] }
  };

  if (windowStart && windowEnd) {
    query.authoredOn = { $gte: windowStart, $lte: windowEnd };
  }

  return await ServiceRequests.find(query).fetchAsync();
}

/**
 * Get Conditions for a patient matching specific codes within a date window.
 * Matches recordedDate or onsetDateTime, or a direct encounter reference.
 * @param {string} patientId - Patient _id
 * @param {Array<string>} codes - Condition codes (e.g., ['Z66'])
 * @param {string} windowStart - ISO date string (optional)
 * @param {string} windowEnd - ISO date string (optional)
 * @param {string} encounterId - Encounter id for encounter-linked match (optional)
 * @returns {Array} Array of Condition resources
 */
export async function getPatientConditions(patientId, codes, windowStart, windowEnd, encounterId) {
  const Conditions = get(global, 'Collections.Conditions');
  if (!Conditions) {
    console.warn('[pacio-data-connector] Conditions collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    'code.coding.code': { $in: codes }
  };

  if (windowStart && windowEnd) {
    const dateClauses = [
      { recordedDate: { $gte: windowStart, $lte: windowEnd } },
      { onsetDateTime: { $gte: windowStart, $lte: windowEnd } }
    ];
    if (encounterId) {
      dateClauses.push({ 'encounter.reference': 'Encounter/' + encounterId });
    }
    query.$or = dateClauses;
  }

  return await Conditions.find(query).fetchAsync();
}

/**
 * Get Procedures for a patient matching specific codes within a date window.
 * @param {string} patientId - Patient _id
 * @param {Array<string>} codes - Procedure codes (CPT/SNOMED)
 * @param {string} windowStart - ISO date string (optional)
 * @param {string} windowEnd - ISO date string (optional)
 * @returns {Array} Array of Procedure resources
 */
export async function getPatientProcedures(patientId, codes, windowStart, windowEnd) {
  const Procedures = get(global, 'Collections.Procedures');
  if (!Procedures) {
    console.warn('[pacio-data-connector] Procedures collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    'code.coding.code': { $in: codes }
  };

  if (windowStart && windowEnd) {
    query.$or = [
      { performedDateTime: { $gte: windowStart, $lte: windowEnd } },
      { 'performedPeriod.start': { $gte: windowStart, $lte: windowEnd } }
    ];
  }

  return await Procedures.find(query).fetchAsync();
}

/**
 * Check if a Composition has all required sections populated with entries.
 * @param {Object} composition - FHIR Composition resource
 * @param {Array<string>} requiredSectionIds - Array of section codes that must have entries
 * @returns {{ complete: boolean, presentSections: Array, missingSections: Array, completionRate: number }}
 */
export function checkSectionCompleteness(composition, requiredSectionIds) {
  const sections = get(composition, 'section', []);
  const presentSections = [];
  const missingSections = [];

  requiredSectionIds.forEach(function(sectionId) {
    // Look for a section whose code matches the expected LOINC code
    const matchingSection = sections.find(function(s) {
      const sectionCode = get(s, 'code.coding[0].code', '');
      // Also check by title for backward compatibility
      const sectionTitle = get(s, 'title', '').toLowerCase().replace(/\s+/g, '-');
      return sectionCode === sectionId || sectionTitle === sectionId;
    });

    if (matchingSection && get(matchingSection, 'entry', []).length > 0) {
      presentSections.push(sectionId);
    } else {
      missingSections.push(sectionId);
    }
  });

  return {
    complete: missingSections.length === 0,
    presentSections: presentSections,
    missingSections: missingSections,
    completionRate: requiredSectionIds.length > 0
      ? presentSections.length / requiredSectionIds.length
      : 0
  };
}

/**
 * Calculate patient age from birthDate as of a given date.
 * MongoDB _id is the source of truth (loaders set _id = id).
 * @param {string} patientId - Patient _id
 * @param {string|Date} asOfDate - Date to calculate age as of
 * @returns {number} Age in years, or -1 if not determinable
 */
export async function getPatientAge(patientId, asOfDate) {
  const Patients = get(global, 'Collections.Patients');
  if (!Patients) {
    console.warn('[pacio-data-connector] Patients collection not available'); // phi-audit: ok
    return -1;
  }

  const patient = await Patients.findOneAsync({ _id: patientId });
  if (!patient) {
    log.warn('pacio-data-connector Patient not found', { patientId });
    return -1;
  }

  const birthDate = get(patient, 'birthDate');
  if (!birthDate) {
    return -1;
  }

  return calculateAge(birthDate, asOfDate);
}

/**
 * Get all patient _ids from the Patients collection.
 * @returns {Array<string>} Array of patient _ids
 */
export async function getAllPatientIds() {
  const Patients = get(global, 'Collections.Patients');
  if (!Patients) {
    return [];
  }

  const patients = await Patients.find({}, { fields: { _id: 1 } }).fetchAsync();
  return patients.map(function(p) { return p._id; });
}

/**
 * Get patient encounters within a measurement period.
 * @param {string} patientId - Patient _id
 * @param {string} periodStart - ISO date string
 * @param {string} periodEnd - ISO date string
 * @returns {Array} Array of Encounter resources
 */
export async function getPatientEncounters(patientId, periodStart, periodEnd) {
  const Encounters = get(global, 'Collections.Encounters');
  if (!Encounters) {
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) }
  };

  if (periodStart && periodEnd) {
    query['period.start'] = { $gte: periodStart, $lte: periodEnd };
  }

  return await Encounters.find(query).fetchAsync();
}

// Expansion lookups are hot during population runs (every patient resolves
// the same 4 OIDs, each transferring a full expansion document), so cache
// per-OID with a short TTL — long enough to cover a calculation run, short
// enough that a VSAC re-fetch is picked up promptly.
const VALUE_SET_CACHE_TTL_MS = 60 * 1000;
const valueSetCodeCache = new Map();

/**
 * Resolve a value set's expansion codes from the ValueSets collection by
 * VSAC OID. Vendored sets (specs/cms1317/valuesets/) carry the OID in
 * identifier[].value as 'urn:oid:<oid>'. Returns [] when unavailable.
 * @param {string} oid - VSAC OID (without urn:oid: prefix)
 * @returns {Array<string>} expansion codes
 */
export async function getValueSetCodes(oid) {
  const cached = valueSetCodeCache.get(oid);
  if (cached && (Date.now() - cached.fetchedAt) < VALUE_SET_CACHE_TTL_MS) {
    return cached.codes;
  }

  const ValueSets = get(global, 'Collections.ValueSets');
  if (!ValueSets) {
    return [];
  }

  const valueSet = await ValueSets.findOneAsync({
    'identifier.value': 'urn:oid:' + oid
  });
  if (!valueSet) {
    return [];
  }

  const contains = get(valueSet, 'expansion.contains', []);
  const codes = contains.map(function(entry) { return entry.code; }).filter(Boolean);
  valueSetCodeCache.set(oid, { codes: codes, fetchedAt: Date.now() });
  return codes;
}

// Helper: calculate age from birthDate
export function calculateAge(birthDate, asOfDate) {
  const birth = new Date(birthDate);
  const asOf = new Date(asOfDate);

  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

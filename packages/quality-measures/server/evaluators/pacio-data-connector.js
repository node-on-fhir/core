// packages/quality-measures/server/evaluators/pacio-data-connector.js
//
// Data access layer for PACIO measure evaluators.
// Queries Compositions, DocumentReferences, Encounters, Conditions,
// Procedures, and Patients from global.Collections (Meteor v3 async APIs).

import { get } from 'lodash';

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
 * @param {string} patientId - Patient _id
 * @param {Array<string>} classCodes - Encounter class codes (e.g., ['IMP','ACUTE'])
 * @param {string} periodStart - ISO date string
 * @param {string} periodEnd - ISO date string
 * @returns {Array} Array of Encounter resources
 */
export async function getInpatientDischargeEncounters(patientId, classCodes, periodStart, periodEnd) {
  const Encounters = get(global, 'Collections.Encounters');
  if (!Encounters) {
    console.warn('[pacio-data-connector] Encounters collection not available');
    return [];
  }

  const query = {
    'subject.reference': { $in: patientRefs(patientId) },
    'class.code': { $in: classCodes },
    status: { $in: ['finished', 'completed', 'discharged'] },
    'period.end': { $gte: periodStart, $lte: periodEnd }
  };

  return await Encounters.find(query).fetchAsync();
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
    console.warn('[pacio-data-connector] Patients collection not available');
    return -1;
  }

  const patient = await Patients.findOneAsync({ _id: patientId });
  if (!patient) {
    console.warn('[pacio-data-connector] Patient not found:', patientId);
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

// npmPackages/quality-measures/lib/screeningGuidelines.js
//
// Preventive-screening guideline table + care-gap evaluator — the "Gaps in
// Care Reporting" / "Care Gap Detection" algorithms researched for the
// Personal Health Records IG (see docs/PHR-ALGORITHMS-PLAN.md). This is the
// lightweight guideline-interval path that complements the CQL/eCQM engine:
// "colonoscopy every 10 years" needs a data table, not ELM execution.
//
// The IG expressed applicability as predicates (p => p.age >= 45); here it is
// DATA ({ minAge, gender }) so the table is reviewable, serializable, and can
// later be settings-overridden without touching the evaluator.
//
// Pure JS, zero imports, client-safe (Deduplicator.js precedent). The caller
// (server method, import-time report, UI) supplies the patient + candidate
// resources; nothing here touches a database or the clock (pass `now`).

const MS_PER_DAY = 86400000;

// Screening guidelines. `codes` are matched against the resource's primary
// coding (Procedure.code, Immunization.vaccineCode, Observation.code,
// DiagnosticReport.code) — any system, exact code match.
export const SCREENING_GUIDELINES = [
  {
    key: 'colonoscopy',
    name: 'Colonoscopy',
    resourceTypes: ['Procedure'],
    codes: ['73761001'],                        // SNOMED CT
    appliesTo: { minAge: 45 },
    intervalYears: 10
  },
  {
    key: 'mammogram',
    name: 'Mammogram',
    resourceTypes: ['Procedure', 'DiagnosticReport'],
    codes: ['71651007', '24606-6'],             // SNOMED CT, LOINC (MG screening)
    appliesTo: { minAge: 40, gender: 'female' },
    intervalYears: 2
  },
  {
    key: 'flu-vaccine',
    name: 'Influenza vaccine',
    resourceTypes: ['Immunization'],
    codes: ['86198006', '88', '140', '141', '150', '158', '197', '205'], // SNOMED + common CVX
    appliesTo: { minAge: 0 },
    intervalYears: 1
  },
  {
    key: 'lipid-panel',
    name: 'Lipid panel',
    resourceTypes: ['Observation', 'DiagnosticReport'],
    codes: ['24331-1', '57698-3'],              // LOINC
    appliesTo: { minAge: 35 },
    intervalYears: 5
  }
];

// How far past the interval before a gap escalates from medium to high.
const HIGH_PRIORITY_OVERDUE_FACTOR = 1.5;

export function calculateAge(birthDate, nowMs) {
  if (typeof birthDate !== 'string' || !birthDate) { return null; }
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) { return null; }
  const now = new Date(nowMs);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function guidelineApplies(guideline, patient, nowMs) {
  const applies = guideline.appliesTo || {};
  const age = calculateAge(patient && patient.birthDate, nowMs);
  if (typeof applies.minAge === 'number') {
    if (age === null || age < applies.minAge) { return false; }
  }
  if (typeof applies.maxAge === 'number') {
    if (age === null || age > applies.maxAge) { return false; }
  }
  if (applies.gender && (!patient || patient.gender !== applies.gender)) {
    return false;
  }
  return true;
}

function primaryCodes(resource) {
  const concept = resource.resourceType === 'Immunization'
    ? resource.vaccineCode
    : resource.code;
  const codings = (concept && Array.isArray(concept.coding)) ? concept.coding : [];
  return codings
    .map(function(coding) { return coding && coding.code; })
    .filter(Boolean);
}

export function resourceMatchesGuideline(resource, guideline) {
  if (!resource || guideline.resourceTypes.indexOf(resource.resourceType) < 0) {
    return false;
  }
  const codes = primaryCodes(resource);
  return guideline.codes.some(function(code) { return codes.indexOf(code) >= 0; });
}

function resourceDate(resource) {
  const raw = resource.performedDateTime
    || (resource.performedPeriod && resource.performedPeriod.start)
    || resource.occurrenceDateTime
    || resource.date
    || resource.effectiveDateTime
    || (resource.effectivePeriod && resource.effectivePeriod.start)
    || resource.issued;
  if (typeof raw !== 'string') { return null; }
  const ms = Date.parse(raw);
  return isNaN(ms) ? null : ms;
}

/**
 * Evaluate every applicable guideline for a patient against their resources.
 *
 * @param {Object} patient - FHIR Patient (birthDate + gender are read)
 * @param {Array} resources - candidate Procedures/Immunizations/Observations/
 *   DiagnosticReports (mixed is fine; matching filters by type + code)
 * @param {Object} [options]
 * @param {number} [options.now] - reference time in ms (defaults to Date.now())
 * @param {Array} [options.guidelines] - override SCREENING_GUIDELINES
 * @returns {Array} one entry per APPLICABLE guideline:
 *   { key, name, intervalYears, status: 'current'|'overdue'|'never_performed',
 *     lastDate?, daysOverdue?, dueDate?, priority? }
 *   sorted: never_performed/high first, then by daysOverdue desc, current last.
 */
export function evaluateScreenings(patient, resources, options) {
  const opts = options || {};
  const nowMs = typeof opts.now === 'number' ? opts.now : Date.now();
  const guidelines = Array.isArray(opts.guidelines) ? opts.guidelines : SCREENING_GUIDELINES;
  const list = Array.isArray(resources) ? resources : [];

  const results = [];
  guidelines.forEach(function(guideline) {
    if (!guidelineApplies(guideline, patient, nowMs)) { return; }

    let lastMs = null;
    list.forEach(function(resource) {
      if (!resourceMatchesGuideline(resource, guideline)) { return; }
      const ms = resourceDate(resource);
      if (ms !== null && ms <= nowMs && (lastMs === null || ms > lastMs)) {
        lastMs = ms;
      }
    });

    const intervalDays = guideline.intervalYears * 365;
    if (lastMs === null) {
      results.push({
        key: guideline.key,
        name: guideline.name,
        intervalYears: guideline.intervalYears,
        status: 'never_performed',
        priority: 'high'
      });
      return;
    }

    const daysSince = (nowMs - lastMs) / MS_PER_DAY;
    const entry = {
      key: guideline.key,
      name: guideline.name,
      intervalYears: guideline.intervalYears,
      lastDate: new Date(lastMs).toISOString(),
      dueDate: new Date(lastMs + intervalDays * MS_PER_DAY).toISOString()
    };
    if (daysSince > intervalDays) {
      entry.status = 'overdue';
      entry.daysOverdue = Math.floor(daysSince - intervalDays);
      entry.priority = daysSince > intervalDays * HIGH_PRIORITY_OVERDUE_FACTOR ? 'high' : 'medium';
    } else {
      entry.status = 'current';
    }
    results.push(entry);
  });

  const priorityRank = { high: 2, medium: 1 };
  results.sort(function(a, b) {
    const gapA = a.status !== 'current' ? 1 : 0;
    const gapB = b.status !== 'current' ? 1 : 0;
    if (gapA !== gapB) { return gapB - gapA; }
    const rankA = priorityRank[a.priority] || 0;
    const rankB = priorityRank[b.priority] || 0;
    if (rankA !== rankB) { return rankB - rankA; }
    return (b.daysOverdue || 0) - (a.daysOverdue || 0);
  });
  return results;
}

/** Just the gaps (never_performed + overdue). */
export function findCareGaps(patient, resources, options) {
  return evaluateScreenings(patient, resources, options).filter(function(entry) {
    return entry.status !== 'current';
  });
}

export default {
  SCREENING_GUIDELINES,
  calculateAge,
  guidelineApplies,
  resourceMatchesGuideline,
  evaluateScreenings,
  findCareGaps
};

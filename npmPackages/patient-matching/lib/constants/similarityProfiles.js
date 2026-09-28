// npmPackages/patient-matching/lib/constants/similarityProfiles.js
//
// Per-resource-type fuzzy-matching profiles — the resource-specific rules
// table researched for the Personal Health Records IG (see
// docs/PHR-ALGORITHMS-PLAN.md § Record Deduplication). Data, not code:
// operators can review and future work can settings-override without touching
// the scoring engine.
//
//   dateToleranceMs — τ (temporal proximity) reaches 0 at this distance
//   threshold       — θ: pairs scoring below it are not reported

const HOUR = 3600000;
const DAY = 86400000;

export const DEFAULT_WEIGHTS = {
  code: 0.4,     // δ — same clinical concept
  date: 0.3,     // τ — temporal proximity within tolerance
  value: 0.2,    // ν — value agreement (resource-type specific)
  context: 0.1   // same subject/patient
};

export const SIMILARITY_PROFILES = {
  'Condition': { dateToleranceMs: 30 * DAY, threshold: 0.85 },
  'AllergyIntolerance': { dateToleranceMs: 30 * DAY, threshold: 0.85 },
  'MedicationStatement': { dateToleranceMs: 7 * DAY, threshold: 0.90 },
  'MedicationRequest': { dateToleranceMs: 7 * DAY, threshold: 0.90 },
  'Procedure': { dateToleranceMs: 1 * DAY, threshold: 0.90 },
  'Immunization': { dateToleranceMs: 1 * DAY, threshold: 0.90 },
  'Observation:vital-signs': { dateToleranceMs: 1 * HOUR, threshold: 0.95 },
  'Observation:laboratory': { dateToleranceMs: 1 * DAY, threshold: 0.90 },
  'Observation': { dateToleranceMs: 1 * DAY, threshold: 0.90 },
  'default': { dateToleranceMs: 1 * DAY, threshold: 0.90 }
};

export default { DEFAULT_WEIGHTS, SIMILARITY_PROFILES };

// npmPackages/patient-matching/lib/resourceSimilarity.js
//
// Fuzzy similarity scoring for non-Patient FHIR resources — the weighted
// similarity function researched for the Personal Health Records IG:
//
//   similarity(r₁, r₂) = w₁·δ(code) + w₂·τ(date) + w₃·ν(value) + w₄·context
//
// with per-resource-type date tolerances and thresholds θ (see
// constants/similarityProfiles.js). This complements — never replaces — the
// Deduplicator's deterministic identity keys: identifier/fingerprint matches
// are certainties; fuzzy pairs are CANDIDATES for human review. The core
// dedup engine surfaces them report-only and never auto-reconciles them.
//
// Weight semantics: components absent on either side (no value to compare, no
// subject on either resource) have their weight zeroed and the score is
// re-normalized over the remaining weight — missing data must not penalize a
// pair (same philosophy as Deduplicator.pairWeights). The code component is
// the anchor: no shared coding concept → the pair is not comparable at all.
//
// Pure JS, zero imports beyond the profiles table, client-safe
// (Deduplicator.js precedent).

import { DEFAULT_WEIGHTS, SIMILARITY_PROFILES } from './constants/similarityProfiles.js';

const MAX_COMPARISONS_DEFAULT = 250000;

// ---------------------------------------------------------------------------
// Component extractors
// ---------------------------------------------------------------------------

function codingKeys(codeableConcept) {
  const keys = [];
  if (!codeableConcept) { return keys; }
  const codings = Array.isArray(codeableConcept.coding) ? codeableConcept.coding : [];
  codings.forEach(function(coding) {
    if (coding && coding.code) {
      keys.push((coding.system || '') + '|' + coding.code);
    }
  });
  if (typeof codeableConcept.text === 'string' && codeableConcept.text.trim()) {
    keys.push('text|' + codeableConcept.text.trim().toLowerCase());
  }
  return keys;
}

// The resource's primary CodeableConcept, by type convention.
function primaryCode(resource) {
  if (!resource) { return null; }
  switch (resource.resourceType) {
    case 'MedicationStatement':
    case 'MedicationRequest':
      return resource.medicationCodeableConcept || resource.code || null;
    case 'Immunization':
      return resource.vaccineCode || null;
    default:
      return resource.code || null;
  }
}

// δ — 1 when any coding (or normalized text) is shared, else 0.
function codeSimilarity(r1, r2) {
  const keys1 = codingKeys(primaryCode(r1));
  const keys2 = codingKeys(primaryCode(r2));
  if (keys1.length === 0 || keys2.length === 0) { return null; } // not comparable
  const set1 = {};
  keys1.forEach(function(k) { set1[k] = true; });
  for (let i = 0; i < keys2.length; i++) {
    if (set1[keys2[i]]) { return 1; }
  }
  return 0;
}

function parseMillis(value) {
  if (typeof value !== 'string' || !value) { return null; }
  const ms = Date.parse(value);
  return isNaN(ms) ? null : ms;
}

// The resource's clinically-primary timestamp, by type convention.
export function primaryDate(resource) {
  if (!resource) { return null; }
  switch (resource.resourceType) {
    case 'Condition':
    case 'AllergyIntolerance':
      return parseMillis(resource.onsetDateTime)
        || parseMillis(resource.recordedDate);
    case 'MedicationStatement':
      return parseMillis(resource.effectiveDateTime)
        || parseMillis(resource.effectivePeriod && resource.effectivePeriod.start)
        || parseMillis(resource.dateAsserted);
    case 'MedicationRequest':
      return parseMillis(resource.authoredOn);
    case 'Procedure':
      return parseMillis(resource.performedDateTime)
        || parseMillis(resource.performedPeriod && resource.performedPeriod.start);
    case 'Immunization':
      return parseMillis(resource.occurrenceDateTime) || parseMillis(resource.date);
    case 'Observation':
      return parseMillis(resource.effectiveDateTime)
        || parseMillis(resource.effectivePeriod && resource.effectivePeriod.start)
        || parseMillis(resource.issued);
    default:
      return parseMillis(resource.effectiveDateTime)
        || parseMillis(resource.date)
        || parseMillis(resource.recordedDate)
        || parseMillis(resource.authoredOn);
  }
}

// τ — 1 at identical timestamps, linear falloff to 0 at the tolerance edge.
function dateSimilarity(r1, r2, toleranceMs) {
  const d1 = primaryDate(r1);
  const d2 = primaryDate(r2);
  if (d1 === null || d2 === null) { return null; } // not comparable
  const diff = Math.abs(d1 - d2);
  if (diff > toleranceMs) { return 0; }
  return 1 - diff / toleranceMs;
}

// ν — value agreement. Numeric quantities compare by relative difference
// (unit-sensitive: mismatched units score 0, they are different measurements
// until a UCUM pass says otherwise); coded/string values compare exactly.
function valueSimilarity(r1, r2) {
  const q1 = r1 && r1.valueQuantity;
  const q2 = r2 && r2.valueQuantity;
  if (q1 && q2 && typeof q1.value === 'number' && typeof q2.value === 'number') {
    const unit1 = q1.unit || q1.code || '';
    const unit2 = q2.unit || q2.code || '';
    if (unit1 !== unit2) { return 0; }
    const denominator = Math.max(Math.abs(q1.value), Math.abs(q2.value));
    if (denominator === 0) { return 1; } // both zero
    const relative = Math.abs(q1.value - q2.value) / denominator;
    return Math.max(0, 1 - relative);
  }
  const c1 = codingKeys(r1 && r1.valueCodeableConcept);
  const c2 = codingKeys(r2 && r2.valueCodeableConcept);
  if (c1.length && c2.length) {
    const set1 = {};
    c1.forEach(function(k) { set1[k] = true; });
    return c2.some(function(k) { return set1[k]; }) ? 1 : 0;
  }
  const s1 = r1 && r1.valueString;
  const s2 = r2 && r2.valueString;
  if (typeof s1 === 'string' && typeof s2 === 'string') {
    return s1.trim().toLowerCase() === s2.trim().toLowerCase() ? 1 : 0;
  }
  return null; // neither side carries a comparable value → weight drops out
}

function subjectRefId(resource) {
  const ref = (resource && ((resource.subject && resource.subject.reference)
    || (resource.patient && resource.patient.reference))) || null;
  if (typeof ref !== 'string' || !ref) { return null; }
  if (ref.indexOf('urn:uuid:') === 0) { return ref.slice('urn:uuid:'.length); }
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

function contextSimilarity(r1, r2) {
  const id1 = subjectRefId(r1);
  const id2 = subjectRefId(r2);
  if (id1 === null || id2 === null) { return null; }
  return id1 === id2 ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

function observationCategory(resource) {
  const categories = Array.isArray(resource && resource.category) ? resource.category : [];
  for (let i = 0; i < categories.length; i++) {
    const codings = Array.isArray(categories[i] && categories[i].coding) ? categories[i].coding : [];
    for (let j = 0; j < codings.length; j++) {
      const code = codings[j] && codings[j].code;
      if (code === 'vital-signs' || code === 'laboratory') { return code; }
    }
  }
  return null;
}

/**
 * Resolve the similarity profile for a resource: Observation splits by
 * category (vital-signs vs laboratory), everything else by resourceType,
 * falling back to 'default'.
 * @returns {{ key, dateToleranceMs, threshold }}
 */
export function resolveProfile(resource) {
  const type = (resource && resource.resourceType) || 'default';
  let key = type;
  if (type === 'Observation') {
    const category = observationCategory(resource);
    if (category && SIMILARITY_PROFILES['Observation:' + category]) {
      key = 'Observation:' + category;
    }
  }
  const profile = SIMILARITY_PROFILES[key] || SIMILARITY_PROFILES['default'];
  return { key: key, dateToleranceMs: profile.dateToleranceMs, threshold: profile.threshold };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score a pair of same-type resources.
 *
 * @param {Object} r1
 * @param {Object} r2
 * @param {Object} [options]
 * @param {Object} [options.weights] - override DEFAULT_WEIGHTS
 * @param {number} [options.dateToleranceMs] - override the profile tolerance
 * @returns {{ comparable, score, components, profile }} — comparable is false
 *   (score 0) when resourceTypes differ or no coding concept is shared to
 *   anchor the comparison.
 */
export function similarity(r1, r2, options) {
  const opts = options || {};
  if (!r1 || !r2 || !r1.resourceType || r1.resourceType !== r2.resourceType
      || r1.resourceType === 'Patient') {
    return { comparable: false, score: 0, components: {}, profile: null };
  }

  const profile = resolveProfile(r1);
  const toleranceMs = typeof opts.dateToleranceMs === 'number' ? opts.dateToleranceMs : profile.dateToleranceMs;
  const weights = Object.assign({}, DEFAULT_WEIGHTS, opts.weights || {});

  const components = {
    code: codeSimilarity(r1, r2),
    date: dateSimilarity(r1, r2, toleranceMs),
    value: valueSimilarity(r1, r2),
    context: contextSimilarity(r1, r2)
  };

  // The code component anchors the comparison: no codings on a side → not
  // comparable; codings present but disjoint → comparable, scores toward 0.
  if (components.code === null) {
    return { comparable: false, score: 0, components: components, profile: profile };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  Object.keys(components).forEach(function(name) {
    const value = components[name];
    if (value === null) { return; } // absent on a side → weight drops out
    weightedSum += (weights[name] || 0) * value;
    weightTotal += (weights[name] || 0);
  });

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return { comparable: true, score: score, components: components, profile: profile };
}

// ---------------------------------------------------------------------------
// Pair finding (blocked O(n²): only pairs sharing a coding key are compared)
// ---------------------------------------------------------------------------

/**
 * Find candidate fuzzy-duplicate pairs across a resource list.
 *
 * Pairs must share resourceType and at least one coding key (blocking — keeps
 * the comparison count proportional to per-concept group sizes, not n²).
 * Patient resources are skipped entirely (they have their own probabilistic
 * clustering in the Deduplicator).
 *
 * @param {Array} resources
 * @param {Object} [options]
 * @param {number} [options.threshold] - override every profile's θ
 * @param {Object} [options.weights]
 * @param {number} [options.maxComparisons=250000] - hard guard; sets truncated
 * @returns {{ pairs: Array, comparisons: number, truncated: boolean }}
 *   pairs: [{ aIndex, bIndex, resourceType, score, components, profileKey, threshold }]
 *   sorted by score descending.
 */
export function findSimilarPairs(resources, options) {
  const opts = options || {};
  const list = Array.isArray(resources) ? resources : [];
  const maxComparisons = typeof opts.maxComparisons === 'number' ? opts.maxComparisons : MAX_COMPARISONS_DEFAULT;

  // Block by resourceType + coding key.
  const blocks = {};
  list.forEach(function(resource, index) {
    if (!resource || !resource.resourceType || resource.resourceType === 'Patient') { return; }
    codingKeys(primaryCode(resource)).forEach(function(key) {
      const blockKey = resource.resourceType + '#' + key;
      if (!blocks[blockKey]) { blocks[blockKey] = []; }
      blocks[blockKey].push(index);
    });
  });

  const seenPairs = {};
  const pairs = [];
  let comparisons = 0;
  let truncated = false;

  const blockKeys = Object.keys(blocks);
  for (let k = 0; k < blockKeys.length && !truncated; k++) {
    const indices = blocks[blockKeys[k]];
    for (let a = 0; a < indices.length && !truncated; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const ia = indices[a];
        const ib = indices[b];
        const pairKey = ia < ib ? ia + '|' + ib : ib + '|' + ia;
        if (seenPairs[pairKey]) { continue; }
        seenPairs[pairKey] = true;

        if (comparisons >= maxComparisons) { truncated = true; break; }
        comparisons++;

        const result = similarity(list[ia], list[ib], opts);
        if (!result.comparable) { continue; }
        const threshold = typeof opts.threshold === 'number' ? opts.threshold : result.profile.threshold;
        if (result.score >= threshold) {
          pairs.push({
            aIndex: ia,
            bIndex: ib,
            resourceType: list[ia].resourceType,
            score: result.score,
            components: result.components,
            profileKey: result.profile.key,
            threshold: threshold
          });
        }
      }
    }
  }

  pairs.sort(function(p1, p2) { return p2.score - p1.score; });
  return { pairs: pairs, comparisons: comparisons, truncated: truncated };
}

export default { similarity, findSimilarPairs, resolveProfile, primaryDate, DEFAULT_WEIGHTS, SIMILARITY_PROFILES };

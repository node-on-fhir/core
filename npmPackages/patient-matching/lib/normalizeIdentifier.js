// npmPackages/patient-matching/lib/normalizeIdentifier.js
//
// Patient-identifier normalization — the "Normalize Patient Identifiers"
// algorithm researched for the Personal Health Records IG (see
// docs/PHR-ALGORITHMS-PLAN.md): validate → case fold → strip whitespace →
// strip separators → apply system-specific rules → length/format check.
//
// Pure JS, zero imports, client-safe (Deduplicator.js precedent). Consumers:
// Deduplicator.identifierKey({ normalize: true }) opt-in, the core dedup
// engine, and importers that want cross-system identifier consistency at
// ingest time.
//
// IMPORTANT: normalization changes identity keys. Deduplicator.identifierKey
// keeps it OFF by default so persisted DedupFindings and import-time
// existence checks don't silently shift; turn it on deliberately, everywhere
// a given comparison set is built.

// System-specific normalization rules. Keyed by FHIR Identifier.system.
// pattern (post-normalization) is a hard validity gate for that system.
export const SYSTEM_RULES = {
  'http://hl7.org/fhir/sid/us-ssn': { keep: 'digits', pattern: /^[0-9]{9}$/ },
  'http://hl7.org/fhir/sid/us-npi': { keep: 'digits', pattern: /^[0-9]{10}$/ },
  'http://hl7.org/fhir/sid/us-mbi': { keep: 'alphanumeric', caseMode: 'upper', pattern: /^[0-9][A-Z][A-Z0-9][0-9][A-Z][A-Z0-9][0-9][A-Z]{2}[0-9]{2}$/ }
};

const DEFAULT_OPTIONS = {
  caseMode: 'upper',        // 'upper' | 'lower' | 'preserve'
  stripSeparators: true,    // remove -, ., /, spaces between characters
  minLength: 1,
  maxLength: 64
};

/**
 * Normalize a bare identifier value string.
 *
 * @param {string} rawValue
 * @param {Object} [options]
 * @param {string} [options.system] - FHIR Identifier.system; applies SYSTEM_RULES
 * @param {string} [options.caseMode='upper'] - 'upper' | 'lower' | 'preserve'
 * @param {boolean} [options.stripSeparators=true]
 * @param {number} [options.minLength=1]
 * @param {number} [options.maxLength=64]
 * @returns {{ value: string|null, valid: boolean, issues: string[] }}
 *   value is the normalized identifier, or null when invalid.
 */
export function normalizeIdentifierValue(rawValue, options) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options || {});
  const rule = opts.system && SYSTEM_RULES[opts.system] ? SYSTEM_RULES[opts.system] : null;
  const issues = [];

  // 1. Input validation
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    return { value: null, valid: false, issues: ['empty-or-non-string'] };
  }

  // 2-3. Whitespace: trim + collapse internal runs (separator handling below
  // may remove them entirely).
  let value = rawValue.trim().replace(/\s+/g, ' ');

  // 4-5. Separators and character classes
  if (rule && rule.keep === 'digits') {
    value = value.replace(/[^0-9]/g, '');
  } else if (rule && rule.keep === 'alphanumeric') {
    value = value.replace(/[^A-Za-z0-9]/g, '');
  } else if (opts.stripSeparators) {
    value = value.replace(/[\s\-./]/g, '');
  }

  // Charset check: after separator stripping only unambiguous identifier
  // characters may remain. Anything else is a validity failure, not silently
  // dropped — dropping unknown symbols could collide two distinct identifiers.
  if (!/^[A-Za-z0-9]*$/.test(value)) {
    issues.push('disallowed-characters');
    return { value: null, valid: false, issues: issues };
  }

  // 2. Case folding (after stripping so rules see canonical characters)
  const caseMode = (rule && rule.caseMode) || opts.caseMode;
  if (caseMode === 'upper') {
    value = value.toUpperCase();
  } else if (caseMode === 'lower') {
    value = value.toLowerCase();
  }

  // 6. Validation: length + system pattern
  if (value.length < opts.minLength || value.length > opts.maxLength) {
    issues.push('length-out-of-bounds');
    return { value: null, valid: false, issues: issues };
  }
  if (rule && rule.pattern && !rule.pattern.test(value)) {
    issues.push('system-pattern-mismatch');
    return { value: null, valid: false, issues: issues };
  }

  return { value: value, valid: true, issues: issues };
}

/**
 * Normalize a FHIR Identifier object. The system is preserved as-is (it is a
 * URI, already canonical by definition); only the value is normalized.
 *
 * @param {Object} identifier - FHIR Identifier { system?, value? }
 * @param {Object} [options] - see normalizeIdentifierValue
 * @returns {{ system: string, value: string|null, valid: boolean, issues: string[] }}
 */
export function normalizeIdentifier(identifier, options) {
  const system = (identifier && typeof identifier.system === 'string') ? identifier.system : '';
  const result = normalizeIdentifierValue(
    identifier ? identifier.value : undefined,
    Object.assign({}, options || {}, { system: system })
  );
  return { system: system, value: result.value, valid: result.valid, issues: result.issues };
}

export default { SYSTEM_RULES, normalizeIdentifierValue, normalizeIdentifier };

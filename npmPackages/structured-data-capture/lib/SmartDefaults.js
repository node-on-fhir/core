// npmPackages/structured-data-capture/lib/SmartDefaults.js
//
// Contextual defaults for questionnaire drafts: honors FHIR standard
// item.initial values plus an ALLOWLISTED subset of SDC initialExpression
// patterns (today()/now(), %patient demographics). Deliberately NOT a fhirpath
// engine — unrecognized expressions are skipped. Deterministic (injectable
// clock); results are plain answers with NO AI provenance chip.
// Genuine CJS (no ESM syntax): consumed by the Meteor client bundle AND
// directly by node --test (tests/unit/...); ESM .js breaks the node runner.

'use strict';

const { get, isArray } = require('lodash');

const INITIAL_EXPRESSION_URL = 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-initialExpression';

// FHIR initial[0].value[x] keys we translate, keyed by suffix.
const INITIAL_VALUE_KEYS = [
  'valueString', 'valueBoolean', 'valueInteger', 'valueDecimal',
  'valueDate', 'valueDateTime', 'valueTime', 'valueCoding'
];

function localIsoDate(date) {
  // YYYY-MM-DD in UTC — matches the tests' fixed-clock expectation and avoids
  // TZ-dependent off-by-one at day boundaries in a way that is at least stable.
  return date.toISOString().slice(0, 10);
}

// Collect linkIds that already carry at least one answer in a response.
function collectAnsweredLinkIds(response) {
  const answered = {};
  function walk(items) {
    if (!isArray(items)) { return; }
    items.forEach(function(item) {
      if (get(item, 'answer.length', 0) > 0) {
        answered[get(item, 'linkId')] = true;
      }
      walk(get(item, 'item'));
    });
  }
  walk(get(response, 'item', []));
  return answered;
}

// Match a raw string value against a choice item's answerOption by code or
// display (case-insensitive). Returns {code, display} or null.
function matchChoiceOption(item, rawValue) {
  const options = get(item, 'answerOption', []);
  if (!isArray(options)) { return null; }
  const needle = String(rawValue).toLowerCase();
  const found = options.find(function(o) {
    return String(get(o, 'valueCoding.code', '')).toLowerCase() === needle ||
           String(get(o, 'valueCoding.display', '')).toLowerCase() === needle;
  });
  return found ? { code: get(found, 'valueCoding.code'), display: get(found, 'valueCoding.display') } : null;
}

// Resolve the allowlisted initialExpression patterns to a raw value, or
// undefined when the expression (or its data) is unavailable.
function resolveExpression(expression, context) {
  const expr = String(expression || '').trim();
  const patient = get(context, 'patient');
  const now = get(context, 'now') || new Date();

  switch (expr) {
    case 'today()':
      return localIsoDate(now);
    case 'now()':
      return now.toISOString();
    case '%patient.birthDate':
      return get(patient, 'birthDate');
    case '%patient.gender':
      return get(patient, 'gender');
    case '%patient.name.family':
      return get(patient, 'name[0].family');
    case '%patient.name.given.first()':
      return get(patient, 'name[0].given[0]');
    case '%patient.name': {
      const text = get(patient, 'name[0].text');
      if (text) { return text; }
      const given = get(patient, 'name[0].given', []);
      const family = get(patient, 'name[0].family', '');
      const formatted = (isArray(given) ? given.join(' ') : '') + (family ? ' ' + family : '');
      return formatted.trim() || undefined;
    }
    default:
      return undefined;
  }
}

// Translate a FHIR initial[0] entry into the client answer-value shape used by
// ResponseUtils.createAnswerFromValue (choice -> {code, display} object).
function valueFromInitial(initialEntry) {
  for (let i = 0; i < INITIAL_VALUE_KEYS.length; i++) {
    const key = INITIAL_VALUE_KEYS[i];
    const raw = get(initialEntry, key);
    if (raw !== undefined && raw !== null) {
      if (key === 'valueCoding') {
        return { code: get(raw, 'code'), display: get(raw, 'display') };
      }
      return raw;
    }
  }
  return undefined;
}

// Coerce a resolved raw expression value into the answer shape for the item's
// type. Choice items must match an answerOption; no match -> skipped.
function coerceForType(item, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') { return undefined; }
  const type = get(item, 'type');
  if (type === 'choice' || type === 'open-choice') {
    return matchChoiceOption(item, rawValue) || undefined;
  }
  return rawValue;
}

/**
 * Compute deterministic default answers for a questionnaire.
 * @param {Object} questionnaire - FHIR Questionnaire
 * @param {Object} options - { patient, now, existingResponse }
 * @returns {Array} [{ linkId, value, type }] — apply via ResponseUtils.updateAnswer
 */
function computeDefaults(questionnaire, options) {
  const opts = options || {};
  const answered = collectAnsweredLinkIds(get(opts, 'existingResponse'));
  const answers = [];

  function walk(items) {
    if (!isArray(items)) { return; }
    items.forEach(function(item) {
      const type = get(item, 'type');
      const linkId = get(item, 'linkId');

      if (type && type !== 'group' && type !== 'display' && !answered[linkId]) {
        let value;

        // 1. FHIR standard initial values
        const initial = get(item, 'initial[0]');
        if (initial) {
          value = valueFromInitial(initial);
        }

        // 2. Allowlisted SDC initialExpression
        if (value === undefined) {
          const expressionExt = get(item, 'extension', []).find(function(e) {
            return get(e, 'url') === INITIAL_EXPRESSION_URL;
          });
          const expression = get(expressionExt, 'valueExpression.expression');
          if (expression) {
            const raw = resolveExpression(expression, opts);
            if (raw === undefined) {
              // Unknown expression or missing context — skip, never guess.
              if (typeof console !== 'undefined' && console.debug) {
                console.debug('[SmartDefaults] skipped expression:', expression, 'for', linkId);
              }
            } else {
              value = coerceForType(item, raw);
            }
          }
        }

        if (value !== undefined) {
          answers.push({ linkId: linkId, value: value, type: type });
        }
      }

      walk(get(item, 'item'));
    });
  }

  walk(get(questionnaire, 'item', []));
  return answers;
}

const SmartDefaults = {
  INITIAL_EXPRESSION_URL: INITIAL_EXPRESSION_URL,
  computeDefaults: computeDefaults
};

exports.SmartDefaults = SmartDefaults;

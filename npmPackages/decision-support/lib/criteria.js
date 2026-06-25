// npmPackages/decision-support/lib/criteria.js
//
// A small, testable JSON criteria model + matcher for evidence-based DSIs.
// Generalizes the radiology-workflow contraindication check
// (extensions/radiology-workflow/server/hooks.js evaluateContraindications)
// into a declarative trigger + conditions structure. Isomorphic, lodash only.
//
// Criteria shape:
//   {
//     trigger:    { categories: ['imaging'], codes: ['70450', ...] },  // gate on the order
//     conditions: [ <predicate>, ... ]                                 // ANDed patient-data tests
//   }
//
// Predicates:
//   { type: 'orderCode',     anyOf: ['70450'] }
//   { type: 'orderCategory', anyOf: ['imaging'] }
//   { type: 'patientData',   category: 'allergies', textContains: 'contrast' }
//   { type: 'patientData',   category: 'procedures', exists: true }
//   { type: 'age',           op: 'gte'|'lt', years: 50 }
//   { type: 'sex',           equals: 'female' }

import { get } from 'lodash';

// context = { serviceRequest, bundle }
// bundle  = { problems, medications, allergies, demographics, labs, vitals, devices, procedures }
const CATEGORY_TO_BUNDLE_KEY = {
  problems: 'problems',
  medications: 'medications',
  allergies: 'allergies',
  labs: 'labs',
  vitals: 'vitals',
  devices: 'devices',
  procedures: 'procedures'
};

function lc(value) {
  return String(value === undefined || value === null ? '' : value).toLowerCase();
}

function serviceRequestCodes(serviceRequest) {
  return get(serviceRequest, 'code.coding', []).map(function(c) { return lc(get(c, 'code')); });
}

function serviceRequestCategories(serviceRequest) {
  const out = [];
  get(serviceRequest, 'category', []).forEach(function(cat) {
    get(cat, 'coding', []).forEach(function(c) {
      out.push(lc(get(c, 'display')));
      out.push(lc(get(c, 'code')));
    });
  });
  return out;
}

// Does any resource in a bundle category have text/coding-display containing the term?
function categoryTextMatches(items, term) {
  const needle = lc(term);
  return (items || []).some(function(item) {
    const haystacks = [
      get(item, 'code.text'),
      get(item, 'code.coding.0.display'),
      get(item, 'medicationCodeableConcept.text'),
      get(item, 'medicationCodeableConcept.coding.0.display')
    ];
    return haystacks.some(function(h) { return lc(h).indexOf(needle) > -1; });
  });
}

function ageInYears(birthDate) {
  if (!birthDate) return null;
  const parts = String(birthDate).split('-');
  const year = parseInt(parts[0], 10);
  if (isNaN(year)) return null;
  // Coarse age (year-granularity) — avoids Date.now() determinism concerns in callers.
  const refYear = get(arguments, '1');
  return (refYear || new Date().getFullYear()) - year;
}

function evalPredicate(pred, context) {
  const serviceRequest = get(context, 'serviceRequest');
  const bundle = get(context, 'bundle', {});

  switch (get(pred, 'type')) {
    case 'orderCode': {
      const codes = serviceRequestCodes(serviceRequest);
      return get(pred, 'anyOf', []).some(function(c) { return codes.indexOf(lc(c)) > -1; });
    }
    case 'orderCategory': {
      const cats = serviceRequestCategories(serviceRequest);
      return get(pred, 'anyOf', []).some(function(c) { return cats.indexOf(lc(c)) > -1; });
    }
    case 'patientData': {
      const key = CATEGORY_TO_BUNDLE_KEY[get(pred, 'category')];
      const items = key ? get(bundle, key, []) : [];
      if (get(pred, 'textContains')) {
        return categoryTextMatches(items, get(pred, 'textContains'));
      }
      if (get(pred, 'exists') === true) return items.length > 0;
      if (get(pred, 'exists') === false) return items.length === 0;
      return items.length > 0;
    }
    case 'age': {
      const age = ageInYears(get(bundle, 'demographics.birthDate'), get(context, 'referenceYear'));
      if (age === null) return false;
      if (get(pred, 'op') === 'gte') return age >= get(pred, 'years', 0);
      if (get(pred, 'op') === 'lt') return age < get(pred, 'years', 0);
      return false;
    }
    case 'sex':
      return lc(get(bundle, 'demographics.gender')) === lc(get(pred, 'equals'));
    default:
      console.warn('[decision-support] unknown criteria predicate type:', get(pred, 'type'));
      return false;
  }
}

// Trigger gate: if a trigger is declared, the order must match a category and/or code.
export function matchesTrigger(criteria, serviceRequest) {
  const trigger = get(criteria, 'trigger');
  if (!trigger) return true;
  const codes = serviceRequestCodes(serviceRequest);
  const cats = serviceRequestCategories(serviceRequest);

  const codeList = get(trigger, 'codes', []).map(lc);
  const catList = get(trigger, 'categories', []).map(lc);

  const codeOk = codeList.length === 0 || codeList.some(function(c) { return codes.indexOf(c) > -1; });
  const catOk = catList.length === 0 || catList.some(function(c) { return cats.indexOf(c) > -1; });
  return codeOk && catOk;
}

// Full match: trigger gate passes AND every condition passes. Returns reasons.
export function matchCriteria(criteria, context) {
  const reasons = [];
  if (!matchesTrigger(criteria, get(context, 'serviceRequest'))) {
    return { matched: false, reasons: reasons };
  }
  const conditions = get(criteria, 'conditions', []);
  for (let i = 0; i < conditions.length; i++) {
    if (!evalPredicate(conditions[i], context)) {
      return { matched: false, reasons: reasons };
    }
    reasons.push(conditions[i]);
  }
  return { matched: true, reasons: reasons };
}

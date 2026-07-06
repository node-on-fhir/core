// imports/lib/referenceRanges/qualifiers.js
// Pure, isomorphic helpers for reference-range qualifier matching.
// NO Meteor / Mongo / Package / settings imports.
import get from 'lodash/get.js';

const BASE = 'https://nodeonfhir.org/fhir/StructureDefinition';

export const EXT = {
  bandProfile:  BASE + '/reference-range-band-profile',
  source:       BASE + '/reference-range-source',
  layer:        BASE + '/reference-range-layer',
  version:      BASE + '/reference-range-version',
  population:   BASE + '/reference-range-population',
  jurisdiction: BASE + '/reference-range-jurisdiction'
};

export const POPULATION_SYSTEM = 'https://nodeonfhir.org/fhir/CodeSystem/reference-population';
export const JURISDICTION_SYSTEM = 'urn:iso:std:iso:3166';

export const LAYER_PRECEDENCE = { patient: 3, deployment: 2, base: 1 };

function extCode(interval, url) {
  const exts = get(interval, 'extension', []) || [];
  const found = exts.find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCodeableConcept.coding.0.code', get(found, 'valueCode'));
}

export function intervalPopulation(interval) { return extCode(interval, EXT.population); }
export function intervalJurisdiction(interval) { return extCode(interval, EXT.jurisdiction); }

// The five qualifier dimensions an interval may declare. Each returns:
//   undefined  -> interval declares nothing on this axis (wildcard)
//   { ok }     -> declared; ok=true if it matches the context
function checks(interval, context) {
  const out = [];
  const gender = get(interval, 'gender');
  if (gender !== undefined) out.push(gender === get(context, 'sex'));

  const ageLow = get(interval, 'age.low.value');
  const ageHigh = get(interval, 'age.high.value');
  if (ageLow !== undefined || ageHigh !== undefined) {
    const a = get(context, 'ageYears');
    out.push(a !== undefined && (ageLow === undefined || a >= ageLow) && (ageHigh === undefined || a <= ageHigh));
  }

  const condCode = get(interval, 'condition.coding.0.code', get(interval, 'condition.0.coding.0.code'));
  if (condCode !== undefined) {
    const ctxConds = [].concat(get(context, 'condition', []) || []);
    out.push(ctxConds.indexOf(condCode) !== -1);
  }

  const pop = intervalPopulation(interval);
  if (pop !== undefined) out.push(pop === get(context, 'population'));

  const jur = intervalJurisdiction(interval);
  if (jur !== undefined) out.push(jur === get(context, 'jurisdiction'));

  return out;
}

export function matchesContext(interval, context) {
  return checks(interval, context || {}).every(Boolean);
}

export function specificity(interval) {
  return checks(interval, {}).length; // number of declared axes (context-independent count)
}

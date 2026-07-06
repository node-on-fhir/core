// imports/lib/sexForClinicalUse.js
// Pure, isomorphic reader of the base-FHIR Sex-Parameter-for-Clinical-Use extension.
// http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse
// NO Meteor / Mongo imports.
import get from 'lodash/get.js';

const SPCU_URL = 'http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse';
const DEFAULT_USE = 'reference-range-interpretation';

function sub(spcuExt, url) {
  const arr = get(spcuExt, 'extension', []) || [];
  return arr.filter(function (e) { return get(e, 'url') === url; });
}

function periodCovers(spcuExt, atTime) {
  if (!atTime) return true;
  const p = get(sub(spcuExt, 'period'), '0.valuePeriod');
  if (!p) return true;
  const t = Date.parse(atTime);
  if (get(p, 'start') && t < Date.parse(p.start)) return false;
  if (get(p, 'end') && t > Date.parse(p.end)) return false;
  return true;
}

function useMatches(spcuExt, intendedUse) {
  const uses = sub(spcuExt, 'intendedClinicalUse');
  if (uses.length === 0) return true; // unscoped applies to all uses
  return uses.some(function (u) {
    return get(u, 'valueCodeableConcept.coding.0.code') === intendedUse;
  });
}

function readSpcu(resource, atTime, intendedUse) {
  const exts = get(resource, 'extension', []) || [];
  const candidates = exts
    .filter(function (e) { return get(e, 'url') === SPCU_URL; })
    .filter(function (e) { return periodCovers(e, atTime) && useMatches(e, intendedUse); });
  if (candidates.length === 0) return null;
  const chosen = candidates[0];
  const code = get(sub(chosen, 'value'), '0.valueCodeableConcept.coding.0.code');
  const basis = sub(chosen, 'supportingInfo').map(function (s) {
    return get(s, 'valueReference') || get(s, 'valueCodeableConcept');
  });
  return { code, basis };
}

export function resolveSexForClinicalUse(patient, observation, options) {
  const opts = options || {};
  const atTime = opts.atTime;
  const intendedUse = opts.intendedUse || DEFAULT_USE;

  const fromObs = readSpcu(observation, atTime, intendedUse);
  const fromPatient = readSpcu(patient, atTime, intendedUse);
  const hit = fromObs
    ? { ...fromObs, source: 'observation-spcu' }
    : fromPatient
      ? { ...fromPatient, source: 'patient-spcu' }
      : null;

  if (hit) {
    const sex = (hit.code === 'male' || hit.code === 'female') ? hit.code : undefined;
    return { sex, source: hit.source, basis: hit.basis || [] };
  }

  const administrative = get(patient, 'gender');
  if (administrative === 'male' || administrative === 'female') {
    return { sex: administrative, source: 'administrative', basis: [] };
  }
  return { sex: undefined, source: 'none', basis: [] };
}

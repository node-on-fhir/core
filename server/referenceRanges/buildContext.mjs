// server/referenceRanges/buildContext.mjs
// Pure. No Meteor.
import get from 'lodash/get.js';

const POP_EXT = 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-population';
const JUR_EXT = 'https://nodeonfhir.org/fhir/StructureDefinition/reference-range-jurisdiction';

function tag(patient, url) {
  const found = (get(patient, 'extension', []) || []).find(function (e) { return get(e, 'url') === url; });
  return get(found, 'valueCodeableConcept.coding.0.code');
}

function ageYears(birthDate, atISO) {
  if (!birthDate || !atISO) return undefined; // age is age-at-observation; without a time, stay age-agnostic
  const at = new Date(atISO);
  const b = new Date(birthDate);
  let age = at.getUTCFullYear() - b.getUTCFullYear();
  const m = at.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < b.getUTCDate())) age--;
  return age >= 0 ? age : undefined;
}

export function buildContext({ patient, observation, spcu, deploymentDefaults }) {
  const dd = deploymentDefaults || {};
  const patientPop = tag(patient, POP_EXT);
  const patientJur = tag(patient, JUR_EXT);
  const population = patientPop || dd.population;
  const jurisdiction = patientJur || dd.jurisdiction;
  const overrideSource = (patientPop || patientJur) ? 'patient' : 'deployment';
  return {
    sex: get(spcu, 'sex'),
    sexSource: get(spcu, 'source'),
    sexBasis: get(spcu, 'basis', []),
    ageYears: ageYears(get(patient, 'birthDate'), get(observation, 'effectiveDateTime')),
    // Gestational-phase / Tanner condition codes are attached by the caller when known;
    // first cut leaves this undefined (phase-source wiring is a later sub-project).
    condition: undefined,
    population,
    jurisdiction,
    overrideSource
  };
}

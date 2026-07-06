// server/referenceRanges/methods.js
// Meteor methods: gather candidates + context, run the pure resolver.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { gatherCandidates } from './registry';
import { buildContext } from './buildContext.mjs';
import { resolveReferenceRange } from '/imports/lib/referenceRanges/resolveReferenceRange';
import { resolveSexForClinicalUse } from '/imports/lib/sexForClinicalUse';

async function resolveOne(loinc, patient, observation) {
  const spcu = resolveSexForClinicalUse(patient, observation, {
    atTime: get(observation, 'effectiveDateTime'),
    intendedUse: 'reference-range-interpretation'
  });
  const context = buildContext({
    patient, observation, spcu,
    deploymentDefaults: {
      population: get(Meteor, 'settings.public.referenceRanges.defaultPopulation'),
      jurisdiction: get(Meteor, 'settings.public.referenceRanges.defaultJurisdiction')
    }
  });
  const candidates = await gatherCandidates(loinc);
  return resolveReferenceRange({ loinc, candidates, context });
}

Meteor.methods({
  'referenceRanges.resolve': async function ({ loinc, patientId, observationId }) {
    check(loinc, String);
    check(patientId, Match.Maybe(String));
    check(observationId, Match.Maybe(String));
    const patient = patientId ? await Patients.findOneAsync({ _id: patientId }) : null;
    const observation = observationId ? await Observations.findOneAsync({ _id: observationId }) : null;
    return await resolveOne(loinc, patient, observation);
  },

  'referenceRanges.resolveBatch': async function ({ items, patientId, observationIds }) {
    check(items, [{ loinc: String, value: Match.Maybe(Match.Any) }]);
    check(patientId, Match.Maybe(String));
    check(observationIds, Match.Maybe([String]));
    const patient = patientId ? await Patients.findOneAsync({ _id: patientId }) : null;
    const obsById = {};
    for (const oid of (observationIds || [])) {
      obsById[oid] = await Observations.findOneAsync({ _id: oid });
    }
    const out = [];
    for (let i = 0; i < items.length; i++) {
      const observation = observationIds ? obsById[observationIds[i]] : null;
      out.push({
        loinc: items[i].loinc,
        value: items[i].value,
        resolved: await resolveOne(items[i].loinc, patient, observation)
      });
    }
    return out;
  }
});

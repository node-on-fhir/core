// server/referenceRanges/methods.js
// ServerMethods: gather candidates + context, run the pure resolver.
import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
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

// rpc migration: names were already dotted (canonicals unchanged, no aliases).
// Both methods historically had NO auth guard but read Patient/Observation
// records by id — treated as a latent bug; requireAuth now applies (default
// true — behavior change noted in the migration report). Callers already pass
// a single named-params object, so no positionalParams adapter is needed.
ServerMethods.define('referenceRanges.resolve', {
  description: 'Resolve the applicable reference range for a LOINC code given optional patient and observation context',
  phi: true,   // reads patient demographics for sex-for-clinical-use resolution
  schemaObject: {
    type: 'object',
    properties: {
      loinc: { type: 'string' },
      patientId: { type: 'string' },
      observationId: { type: 'string' }
    },
    required: ['loinc']
  }
}, async function(params, context) {
  const { loinc, patientId, observationId } = params;
  const patient = patientId ? await Patients.findOneAsync({ _id: patientId }) : null;
  const observation = observationId ? await Observations.findOneAsync({ _id: observationId }) : null;
  return await resolveOne(loinc, patient, observation);
});

ServerMethods.define('referenceRanges.resolveBatch', {
  description: 'Resolve reference ranges for a batch of LOINC codes sharing one patient context',
  phi: true,   // reads patient demographics for sex-for-clinical-use resolution
  schemaObject: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: { loinc: { type: 'string' } },
          required: ['loinc']
        }
      },
      patientId: { type: 'string' },
      observationIds: { type: 'array', items: { type: 'string' } }
    },
    required: ['items']
  }
}, async function(params, context) {
  const { items, patientId, observationIds } = params;
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
});

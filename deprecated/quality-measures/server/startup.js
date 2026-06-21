// packages/quality-measures/server/startup.js
//
// Seeds the PACIO measure definitions into the Measures collection (so they
// are queryable via getMeasureDefinition / qualityMeasures.getMeasures and
// visible through the FHIR REST API) and upserts the vendored CMS1317
// value sets into the ValueSets collection (evaluator code-list source;
// upgrade proxies to official via scripts/fetch-vsac-valuesets.js).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { PacioMeasures } from '../lib/pacio-measures';

// Vendored CMS1317 value sets (official / proxy / placeholder — see each
// resource's expansion-provenance extension)
import vsEncounterInpatient from '../specs/cms1317/valuesets/ValueSet-2.16.840.1.113883.3.666.5.307.json';
import vsAdvanceDirectiveDoc from '../specs/cms1317/valuesets/ValueSet-2.16.840.1.113762.1.4.1170.43.json';
import vsHealthcareAgent from '../specs/cms1317/valuesets/ValueSet-2.16.840.1.113762.1.4.1170.31.json';
import vsPortableMedicalOrder from '../specs/cms1317/valuesets/ValueSet-2.16.840.1.113762.1.4.1170.48.json';
import vsAcpDocumentation from '../specs/cms1317/valuesets/ValueSet-2.16.840.1.113762.1.4.1170.45.json';

const VENDORED_VALUE_SETS = [
  vsEncounterInpatient,
  vsAdvanceDirectiveDoc,
  vsHealthcareAgent,
  vsPortableMedicalOrder,
  vsAcpDocumentation
];

Meteor.startup(async function() {
  // Seed CMS1317 value sets
  const ValueSets = get(global, 'Collections.ValueSets');
  if (ValueSets && typeof ValueSets.updateAsync === 'function') {
    let valueSetCount = 0;
    for (const valueSet of VENDORED_VALUE_SETS) {
      try {
        await ValueSets.updateAsync(
          { _id: valueSet.id },
          { $set: Object.assign({}, valueSet, { _id: valueSet.id }) },
          { upsert: true }
        );
        valueSetCount++;
      } catch (error) {
        console.error('[quality-measures.startup] Failed to seed ValueSet', valueSet.id, '-', error.message);
      }
    }
    console.log('[quality-measures.startup] Seeded', valueSetCount, 'CMS1317 value sets');
  } else {
    console.warn('[quality-measures.startup] ValueSets collection not available; CMS1317 value sets not seeded');
  }

  const Measures = get(global, 'Collections.Measures');
  if (!Measures || typeof Measures.updateAsync !== 'function') {
    console.warn('[quality-measures.startup] Measures collection not available; PACIO measures not seeded');
    return;
  }

  let seededCount = 0;
  const measureIds = Object.keys(PacioMeasures);

  for (const measureId of measureIds) {
    const measure = PacioMeasures[measureId];
    try {
      await Measures.updateAsync(
        { _id: measure.id },
        { $set: Object.assign({}, measure, { _id: measure.id }) },
        { upsert: true }
      );
      seededCount++;
    } catch (error) {
      console.error('[quality-measures.startup] Failed to seed measure', measureId, '-', error.message);
    }
  }

  console.log('[quality-measures.startup] Seeded', seededCount, 'of', measureIds.length, 'PACIO measures');
});

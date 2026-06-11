// packages/quality-measures/server/startup.js
//
// Seeds the PACIO measure definitions into the Measures collection so they
// are queryable via getMeasureDefinition / qualityMeasures.getMeasures and
// visible through the FHIR REST API.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { PacioMeasures } from '../lib/pacio-measures';

Meteor.startup(async function() {
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

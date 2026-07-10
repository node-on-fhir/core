// packages/quality-measures/server/startup.js
//
// Seeds the PACIO measure definitions into the Measures collection (so they
// are queryable via getMeasureDefinition / qualityMeasures.getMeasures and
// visible through the FHIR REST API) and upserts the vendored CMS1317
// value sets into the ValueSets collection (evaluator code-list source;
// upgrade proxies to official via scripts/fetch-vsac-valuesets.js).
//
// Also autoloads measure bundles (MADiE exports) from a gitignored directory
// so licensed eCQM packages import on every boot without being committed.

import fs from 'fs';
import path from 'path';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { PacioMeasures } from '../lib/pacio-measures';
import { importMeasureBundleInternal } from './measure-bundle-methods';

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

// Under npm-workflow load order the host's global.Collections may not be
// populated yet when this package's Meteor.startup fires (it is by method
// time) — wait for registration instead of silently skipping the seed.
function waitForCollections(names, timeoutMs) {
  return new Promise(function(resolve) {
    const startedAt = Date.now();
    function poll() {
      const allPresent = names.every(function(name) {
        const collection = get(global, 'Collections.' + name);
        return collection && typeof collection.updateAsync === 'function';
      });
      if (allPresent) {
        resolve(true);
      } else if (Date.now() - startedAt > timeoutMs) {
        resolve(false);
      } else {
        Meteor.setTimeout(poll, 500);
      }
    }
    poll();
  });
}

Meteor.startup(async function() {
  const collectionsReady = await waitForCollections(['Measures', 'ValueSets'], 30000);
  if (!collectionsReady) {
    console.warn('[quality-measures.startup] Measures/ValueSets collections never registered; skipping seed + bundle autoload');
    return;
  }

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

  await autoloadMeasureBundles();
});

// Import every *.json measure bundle from the configured autoload directory.
// Resolution: settings.private.qualityMeasures.bundleDirectory →
// MEASURE_BUNDLES_DIR env → ./measure-bundles (gitignored repo-root default).
// MADiE exports contain VSAC-licensed value sets, so they live on disk per
// deployment instead of in git; dropping files here imports them every boot.
async function autoloadMeasureBundles() {
  let bundleDir = get(Meteor, 'settings.private.qualityMeasures.bundleDirectory', '') ||
    process.env.MEASURE_BUNDLES_DIR || '';

  if (!bundleDir) {
    const defaultDir = path.resolve(process.cwd(), 'measure-bundles');
    if (fs.existsSync(defaultDir)) {
      bundleDir = defaultDir;
    } else {
      console.log('[quality-measures.startup] No measure-bundle autoload directory configured (settings.private.qualityMeasures.bundleDirectory / MEASURE_BUNDLES_DIR / ./measure-bundles); skipping autoload');
      return;
    }
  }

  bundleDir = path.resolve(process.cwd(), bundleDir);
  if (!fs.existsSync(bundleDir)) {
    console.warn('[quality-measures.startup] Measure-bundle directory not found:', bundleDir);
    return;
  }

  const files = fs.readdirSync(bundleDir).filter(function(name) {
    return name.toLowerCase().endsWith('.json');
  });

  if (files.length === 0) {
    console.log('[quality-measures.startup] Measure-bundle directory is empty:', bundleDir);
    return;
  }

  console.log('[quality-measures.startup] Autoloading', files.length, 'measure bundle(s) from', bundleDir);

  for (const fileName of files) {
    try {
      const raw = fs.readFileSync(path.join(bundleDir, fileName), 'utf8');
      const bundle = JSON.parse(raw);
      const result = await importMeasureBundleInternal(bundle);
      console.log('[quality-measures.startup] Imported', fileName, '→ measure', result.measureId,
        JSON.stringify(result.counts), 'hasElm:', result.hasElm);
      if (!result.hasElm) {
        console.warn('[quality-measures.startup]', fileName, 'has no compiled ELM — measure will not be computable');
      }
    } catch (error) {
      console.error('[quality-measures.startup] Failed to import', fileName, '-', get(error, 'reason', error.message));
    }
  }
}

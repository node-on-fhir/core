// packages/quality-measures/server/measure-bundle-methods.js
//
// Import a FHIR measure bundle (Measure + Libraries with ELM + ValueSets),
// e.g. a MADiE export, so fqm-execution can calculate the measure.
// Libraries and ValueSets are tagged with _bundleMeasureId so
// assembleMeasureBundle (server/fqm-engine.js) can reassemble the bundle.
//
// importMeasureBundleInternal is shared by the Meteor method, the startup
// autoload directory (server/startup.js), and the eCQI package fetcher
// (server/vsac-methods.js) — one code path for every import channel.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import { measureBundleHasElm } from './fqm-engine';

const BUNDLE_COLLECTIONS = {
  Measure: 'Measures',
  Library: 'Libraries',
  ValueSet: 'ValueSets'
};

// Shared import body. Throws Meteor.Error('invalid-bundle') on shape problems;
// returns { measureId, counts, skippedResourceTypes, hasElm, errors }.
export async function importMeasureBundleInternal(bundleJson) {
  if (get(bundleJson, 'resourceType') !== 'Bundle') {
    throw new Meteor.Error('invalid-bundle', 'Expected a FHIR Bundle resource');
  }

  const entries = get(bundleJson, 'entry', []);
  const measureEntries = entries.filter(function(entry) {
    return get(entry, 'resource.resourceType') === 'Measure';
  });

  if (measureEntries.length !== 1) {
    throw new Meteor.Error('invalid-bundle',
      'Measure bundle must contain exactly one Measure resource (found ' + measureEntries.length + ')');
  }

  const measureId = get(measureEntries[0], 'resource.id') || Random.id();
  console.log('[qualityMeasures.importMeasureBundle] Importing bundle for measure:', measureId);

  const counts = { Measure: 0, Library: 0, ValueSet: 0 };
  const skipped = [];
  const errors = [];

  for (const entry of entries) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) {
      continue;
    }

    const collectionName = BUNDLE_COLLECTIONS[resource.resourceType];
    if (!collectionName) {
      skipped.push(resource.resourceType);
      continue;
    }

    const collection = get(global, 'Collections.' + collectionName);
    if (!collection) {
      errors.push('Collection not registered: ' + collectionName);
      continue;
    }

    const doc = Object.assign({}, resource);
    doc._id = resource.id || Random.id();
    if (resource.resourceType !== 'Measure') {
      doc._bundleMeasureId = measureId;
    }

    try {
      await collection.updateAsync(
        { _id: doc._id },
        { $set: doc },
        { upsert: true }
      );
      counts[resource.resourceType]++;
    } catch (error) {
      errors.push(resource.resourceType + '/' + doc._id + ': ' + error.message);
    }
  }

  const hasElm = measureBundleHasElm(bundleJson);
  if (!hasElm) {
    console.warn('[qualityMeasures.importMeasureBundle] Bundle has no ELM JSON — measure will not be computable until re-exported with ELM (MADiE exports include it)');
  }

  console.log('[qualityMeasures.importMeasureBundle] Imported:', JSON.stringify(counts),
    'skipped:', skipped.length, 'errors:', errors.length);

  return {
    measureId: measureId,
    counts: counts,
    skippedResourceTypes: skipped,
    hasElm: hasElm,
    errors: errors
  };
}

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). Guard deleted in favor of requireAuth (default true); check() ->
// schemaObject; this.userId path unused (importMeasureBundleInternal takes no
// user). Terminology/measure-bundle payload is NOT PHI.
Meteor.ServerMethods.define('qualityMeasures.importMeasureBundle', {
  description: 'Import a FHIR measure Bundle (Measure + Libraries + ValueSets) for calculation',
  positionalParams: ['bundleJson'],
  schemaObject: {
    type: 'object',
    properties: { bundleJson: { type: 'object' } },
    required: ['bundleJson']
  }
}, async function(params, context){
  const bundleJson = get(params, 'bundleJson');
  return await importMeasureBundleInternal(bundleJson);
});

// Test-only cleanup: remove an imported measure bundle (Measure + tagged
// Libraries/ValueSets). Used by tests/nightwatch/measure-computability.test.js.
if (get(Meteor, 'settings.public.environment') !== 'production') {
  Meteor.ServerMethods.define('test.removeMeasureBundle', {
    description: 'Test-only: remove an imported measure bundle and its tagged Libraries/ValueSets',
    positionalParams: ['measureId'],
    schemaObject: {
      type: 'object',
      properties: { measureId: { type: 'string' } },
      required: ['measureId']
    }
  }, async function(params, context){
    const measureId = get(params, 'measureId');

    const removed = { Measure: 0, Library: 0, ValueSet: 0 };
    const Measures = get(global, 'Collections.Measures');
    if (Measures) {
      removed.Measure = await Measures.removeAsync({ _id: measureId });
    }
    for (const collectionName of ['Libraries', 'ValueSets']) {
      const collection = get(global, 'Collections.' + collectionName);
      if (collection) {
        removed[collectionName === 'Libraries' ? 'Library' : 'ValueSet'] =
          await collection.removeAsync({ _bundleMeasureId: measureId });
      }
    }
    console.log('[test.removeMeasureBundle] Removed bundle for', measureId, JSON.stringify(removed));
    return removed;
  });
}

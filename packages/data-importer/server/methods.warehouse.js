// packages/data-importer/server/methods.warehouse.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { HTTP } from 'meteor/http';

function pluralizeResourceName(resourceType) {
  switch (resourceType) {
    case 'Binary': return 'Binaries';
    case 'Library': return 'Libraries';
    case 'SupplyDelivery': return 'SupplyDeliveries';
    case 'ImagingStudy': return 'ImagingStudies';
    case 'FamilyMemberHistory': return 'FamilyMemberHistories';
    case 'ResearchStudy': return 'ResearchStudies';
    default: return resourceType + 's';
  }
}

async function insertToLocalDb(bundle, results) {
  const Collections = global.Collections;

  for (const entry of bundle.entry) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) continue;

    const collectionName = pluralizeResourceName(resource.resourceType);
    const collection = Collections[collectionName];

    if (!collection) {
      results.errors.push(`Collection not found: ${collectionName}`);
      continue;
    }

    try {
      // Ensure _id is set
      if (!resource._id && resource.id) {
        resource._id = resource.id;
      }

      // Upsert: update if exists, insert if new
      const existing = await collection.findOneAsync({ _id: resource._id });

      if (existing) {
        await collection.updateAsync({ _id: resource._id }, { $set: resource });
        results.updated++;
        console.log(`[insertBundleIntoWarehouse] Updated ${resource.resourceType}/${resource._id}`);
      } else {
        await collection.insertAsync(resource);
        results.inserted++;
        console.log(`[insertBundleIntoWarehouse] Inserted ${resource.resourceType}/${resource._id}`);
      }

      // Track counts by resource type
      results.resourceTypes[resource.resourceType] =
        (results.resourceTypes[resource.resourceType] || 0) + 1;

    } catch (error) {
      const errorMsg = `${resource.resourceType}/${resource._id}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error('[insertBundleIntoWarehouse] Error:', errorMsg);
    }
  }

  console.log('[insertBundleIntoWarehouse] Complete:', results);
  return results;
}

async function insertViaRelay(bundle, options, results) {
  const relayEndpoint = options.relayEndpoint ||
    get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint');

  if (!relayEndpoint) {
    throw new Meteor.Error('no-endpoint', 'No fhirRelay endpoint configured in settings');
  }

  console.log('[insertBundleIntoWarehouse] Relay endpoint:', relayEndpoint);

  for (const entry of bundle.entry) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) continue;

    try {
      let url = relayEndpoint.replace(/\/$/, ''); // Remove trailing slash

      if (resource.id) {
        // PUT to update/create with specific ID
        url = `${url}/${resource.resourceType}/${resource.id}`;
        HTTP.put(url, { data: resource });
        results.updated++;
      } else {
        // POST to create new
        url = `${url}/${resource.resourceType}`;
        HTTP.post(url, { data: resource });
        results.inserted++;
      }

      results.resourceTypes[resource.resourceType] =
        (results.resourceTypes[resource.resourceType] || 0) + 1;

    } catch (error) {
      const errorMsg = `${resource.resourceType}: ${error.message}`;
      results.errors.push(errorMsg);
      console.error('[insertBundleIntoWarehouse] Relay error:', errorMsg);
    }
  }

  console.log('[insertBundleIntoWarehouse] Relay complete:', results);
  return results;
}

Meteor.methods({
  /**
   * Insert a FHIR Bundle into the warehouse
   * @param {Object|String} bundleData - FHIR Bundle (object or JSON string)
   * @param {Object} options - Configuration options
   * @param {String} options.mode - 'local' (default) or 'relay'
   * @param {String} options.relayEndpoint - Optional override for fhirRelay endpoint
   */
  'insertBundleIntoWarehouse': async function(bundleData, options = {}) {
    check(bundleData, Match.OneOf(Object, String));
    check(options, Match.Optional({
      mode: Match.Optional(String),
      relayEndpoint: Match.Optional(String)
    }));

    // Handle undefined options
    options = options || {};

    // Parse if string
    let bundle;
    try {
      bundle = typeof bundleData === 'string' ? JSON.parse(bundleData) : bundleData;
    } catch (parseError) {
      throw new Meteor.Error('parse-error', 'Failed to parse bundle: ' + parseError.message);
    }

    // Determine mode from options or settings
    const mode = options.mode || get(Meteor, 'settings.public.dataImporter.warehouseMode', 'local');

    console.log('[insertBundleIntoWarehouse] Mode:', mode);
    console.log('[insertBundleIntoWarehouse] Bundle resourceType:', bundle.resourceType);
    console.log('[insertBundleIntoWarehouse] Bundle entries:', bundle.entry?.length || 0);

    const results = {
      mode: mode,
      inserted: 0,
      updated: 0,
      errors: [],
      resourceTypes: {}
    };

    if (bundle.resourceType !== 'Bundle' || !Array.isArray(bundle.entry)) {
      throw new Meteor.Error('invalid-bundle', 'Expected FHIR Bundle with entry array');
    }

    if (mode === 'relay') {
      // Proxy to external FHIR server
      return await insertViaRelay(bundle, options, results);
    } else {
      // Insert directly to local MongoDB
      return await insertToLocalDb(bundle, results);
    }
  }
});

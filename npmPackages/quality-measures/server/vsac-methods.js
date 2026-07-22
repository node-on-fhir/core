// packages/quality-measures/server/vsac-methods.js
//
// VSAC / eCQI terminology fetch methods — the BYOK ("bring your own key")
// model. UMLS licenses are individual (NLM issues no product keys), so the
// app ships keyless: each deployment's admin supplies their own UMLS API key
// via the /server-configuration panel (stored in the ServerConfiguration
// collection), Meteor.settings.private.vsac.apiKey, or the VSAC_API_KEY env
// var. The key never leaves the server.
//
// Value sets:       VSAC FHIR API  https://cts.nlm.nih.gov/fhir  (needs key)
// Measure packages: eCQI Resource Center public zip downloads    (no key)

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';

import { getVsacApiKey, resolveMeasureId } from './fqm-engine';
import { importMeasureBundleInternal } from './measure-bundle-methods';

const log = (Meteor.Logger ? Meteor.Logger.for('vsac-methods') : console);

const VSAC_FHIR_BASE = 'https://cts.nlm.nih.gov/fhir';

// Small, stable value set used as the connection-test probe
// (Encounter Inpatient — also vendored with the CMS1317 specs)
const VSAC_TEST_OID = '2.16.840.1.113883.3.666.5.307';

function vsacAuthHeader(apiKey) {
  return 'Basic ' + Buffer.from('apikey:' + apiKey).toString('base64');
}

async function requireVsacApiKey() {
  const resolved = await getVsacApiKey();
  if (!resolved.apiKey) {
    throw new Meteor.Error('feature-disabled',
      'No VSAC/UMLS API key configured. Paste your UMLS API key in the ' +
      'Terminology panel on /server-configuration (or set ' +
      'Meteor.settings.private.vsac.apiKey / the VSAC_API_KEY env var). ' +
      'Keys are issued per person at https://uts.nlm.nih.gov (My Profile).');
  }
  return resolved;
}

// Pull the trailing OID out of a canonical ValueSet URL
// (e.g. http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.666.5.307)
function extractOid(valueSetUrl) {
  const match = String(valueSetUrl || '').match(/(\d+(?:\.\d+)+)\s*$/);
  return match ? match[1] : null;
}

// Collect the value-set OIDs a measure's imported bundle depends on
// (Library dataRequirements + relatedArtifacts on Library and Measure)
async function collectValueSetOids(resolvedMeasureId) {
  const oids = new Set();

  function harvest(resource) {
    get(resource, 'dataRequirement', []).forEach(function(requirement) {
      get(requirement, 'codeFilter', []).forEach(function(codeFilter) {
        const oid = extractOid(get(codeFilter, 'valueSet'));
        if (oid) { oids.add(oid); }
      });
    });
    get(resource, 'relatedArtifact', []).forEach(function(artifact) {
      const reference = get(artifact, 'resource', '');
      if (String(reference).indexOf('/ValueSet/') !== -1) {
        const oid = extractOid(reference);
        if (oid) { oids.add(oid); }
      }
    });
  }

  const Measures = get(global, 'Collections.Measures');
  if (Measures) {
    const measure = await Measures.findOneAsync({ _id: resolvedMeasureId });
    if (measure) { harvest(measure); }
  }

  const Libraries = get(global, 'Collections.Libraries');
  if (Libraries) {
    const libraries = await Libraries.find({ _bundleMeasureId: resolvedMeasureId }).fetchAsync();
    libraries.forEach(harvest);
  }

  return Array.from(oids);
}

async function expandAndStoreValueSet(oid, apiKey, bundleMeasureId) {
  const url = VSAC_FHIR_BASE + '/ValueSet/' + oid + '/$expand';
  const response = await fetch(url, {
    headers: {
      Authorization: vsacAuthHeader(apiKey),
      Accept: 'application/fhir+json'
    }
  });

  if (!response.ok) {
    return { oid: oid, ok: false, status: response.status, error: 'VSAC responded ' + response.status };
  }

  const valueSet = await response.json();
  if (get(valueSet, 'resourceType') !== 'ValueSet') {
    return { oid: oid, ok: false, error: 'VSAC returned ' + get(valueSet, 'resourceType', 'unknown resource') };
  }

  const ValueSets = get(global, 'Collections.ValueSets');
  if (!ValueSets) {
    return { oid: oid, ok: false, error: 'ValueSets collection not registered' };
  }

  const doc = Object.assign({}, valueSet);
  doc._id = get(valueSet, 'id', oid);
  if (bundleMeasureId) {
    doc._bundleMeasureId = bundleMeasureId;
  }

  await ValueSets.updateAsync({ _id: doc._id }, { $set: doc }, { upsert: true });

  const codeCount = get(valueSet, 'expansion.contains', []).length;
  return { oid: oid, ok: true, name: get(valueSet, 'name'), codeCount: codeCount };
}

// Candidate public download URLs on the eCQI Resource Center for a published
// eCQM measure package. There is no official download API — these are the
// stable-ish file locations; failures fall back to manual download.
function ecqiCandidateUrls(cmsId) {
  return [
    'https://ecqi.healthit.gov/sites/default/files/ecqm/measures/' + cmsId + '.zip',
    'https://ecqi.healthit.gov/sites/default/files/ecqm/measures/' + cmsId + '-v2.zip',
    'https://ecqi.healthit.gov/sites/default/files/' + cmsId + '.zip'
  ];
}

// Find and import every Bundle-with-a-Measure JSON inside a measure-package zip.
// Returns { results, isQdmPackage } — the published eCQI packages for the
// classic CMS eCQMs are QDM 5.6 artifacts (CQL + QDM-model ELM + HQMF XML),
// which fqm-execution cannot run against FHIR data; only MADiE FHIR exports
// contain the Bundle we need.
async function importBundlesFromZip(zipBuffer) {
  // eslint-disable-next-line global-require
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(zipBuffer);

  const results = [];
  const fileNames = Object.keys(zip.files).filter(function(name) {
    return !zip.files[name].dir;
  });
  const isQdmPackage = fileNames.some(function(name) {
    return /QDM/i.test(name);
  });
  const jsonNames = fileNames.filter(function(name) {
    return name.toLowerCase().endsWith('.json');
  });

  for (const name of jsonNames) {
    let parsed;
    try {
      parsed = JSON.parse(await zip.files[name].async('string'));
    } catch (parseError) {
      continue;
    }

    const isMeasureBundle = get(parsed, 'resourceType') === 'Bundle' &&
      get(parsed, 'entry', []).some(function(entry) {
        return get(entry, 'resource.resourceType') === 'Measure';
      });
    if (!isMeasureBundle) {
      continue;
    }

    try {
      const imported = await importMeasureBundleInternal(parsed);
      results.push(Object.assign({ file: name }, imported));
    } catch (importError) {
      results.push({ file: name, error: get(importError, 'reason', importError.message) });
    }
  }

  return { results: results, isQdmPackage: isQdmPackage };
}

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). Guards deleted in favor of requireAuth (default true); check() ->
// schemaObject; this.userId -> context.userId. VSAC/eCQI terminology is NOT
// PHI. checkVsacSetting stays public (tri-state settings-gate check, called on
// mount before the user does anything — settings-gated-features pattern); the
// key is never returned to the client.

Meteor.ServerMethods.define('qualityMeasures.checkVsacSetting', {
  description: 'Report whether a VSAC/UMLS API key is configured (key never returned)',
  // Public by design: the /server-configuration panel calls this on mount to
  // decide whether to enable the terminology controls.
  requireAuth: false
}, async function(params, context){
  const resolved = await getVsacApiKey();
  return {
    configured: !!resolved.apiKey,
    source: resolved.source,
    keySuffix: resolved.apiKey ? resolved.apiKey.slice(-4) : ''
  };
});

Meteor.ServerMethods.define('qualityMeasures.saveVsacApiKey', {
  description: 'Store a VSAC/UMLS API key in ServerConfiguration (BYOK)',
  positionalParams: ['apiKey'],
  schemaObject: {
    type: 'object',
    properties: { apiKey: { type: 'string' } },
    required: ['apiKey']
  }
}, async function(params, context){
  const apiKey = get(params, 'apiKey');

  if (!apiKey.trim()) {
    throw new Meteor.Error('invalid-key', 'API key must not be empty');
  }

  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (!ServerConfiguration) {
    throw new Meteor.Error('collection-not-found', 'ServerConfiguration collection not available');
  }

  await ServerConfiguration.updateAsync(
    { configType: 'vsac' },
    { $set: {
      configType: 'vsac',
      data: { apiKey: apiKey.trim() },
      updatedAt: new Date(),
      updatedBy: context.userId
    }},
    { upsert: true }
  );

  log.info('vsac-methods VSAC API key saved to ServerConfiguration');
  return { configured: true, source: 'database', keySuffix: apiKey.trim().slice(-4) };
});

Meteor.ServerMethods.define('qualityMeasures.clearVsacApiKey', {
  description: 'Remove the stored VSAC/UMLS API key from ServerConfiguration'
}, async function(params, context){
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (!ServerConfiguration) {
    throw new Meteor.Error('collection-not-found', 'ServerConfiguration collection not available');
  }

  await ServerConfiguration.removeAsync({ configType: 'vsac' });
  log.info('vsac-methods VSAC API key cleared from ServerConfiguration');

  // Settings/env keys may still resolve — report the post-clear state
  const resolved = await getVsacApiKey();
  return {
    configured: !!resolved.apiKey,
    source: resolved.source,
    keySuffix: resolved.apiKey ? resolved.apiKey.slice(-4) : ''
  };
});

// ---------------------------------------------------------------------------
// VSAC connectivity + value-set fetch
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('qualityMeasures.testVsacConnection', {
  description: 'Test connectivity to the VSAC FHIR API using the configured key'
}, async function(params, context){
  const resolved = await requireVsacApiKey();

    let response;
    try {
      response = await fetch(VSAC_FHIR_BASE + '/ValueSet/' + VSAC_TEST_OID, {
        headers: {
          Authorization: vsacAuthHeader(resolved.apiKey),
          Accept: 'application/fhir+json'
        }
      });
    } catch (error) {
      throw new Meteor.Error('vsac-unreachable', 'Could not reach VSAC: ' + error.message);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Meteor.Error('vsac-auth-failed',
        'VSAC rejected the API key (HTTP ' + response.status + '). Verify the key at https://uts.nlm.nih.gov (My Profile).');
    }
    if (!response.ok) {
      throw new Meteor.Error('vsac-error', 'VSAC responded with HTTP ' + response.status);
    }

    const valueSet = await response.json();
    log.info('vsac-methods VSAC connection test OK', { source: resolved.source });
    return {
      ok: true,
      source: resolved.source,
      testValueSet: get(valueSet, 'name', VSAC_TEST_OID)
    };
});

// Fetch value-set expansions for one measure (or every imported measure)
// from the VSAC FHIR API and upsert them into the ValueSets collection,
// tagged with _bundleMeasureId so assembleMeasureBundle picks them up.
Meteor.ServerMethods.define('qualityMeasures.fetchValueSetsFromVsac', {
  description: 'Expand and store VSAC value sets for one or all imported measures',
  positionalParams: ['measureId'],
  schemaObject: {
    type: 'object',
    properties: { measureId: { type: 'string' } }
  }
}, async function(params, context){
  const measureId = get(params, 'measureId');

  const resolved = await requireVsacApiKey();

    // Which measures to fetch for: the requested one, or every measure that
    // has an imported bundle (Libraries tagged with _bundleMeasureId)
    let measureIds = [];
    if (measureId) {
      const target = await resolveMeasureId(measureId);
      if (!target) {
        throw new Meteor.Error('not-found', 'No imported measure bundle found for ' + measureId);
      }
      measureIds = [target];
    } else {
      const Libraries = get(global, 'Collections.Libraries');
      if (Libraries) {
        const tagged = await Libraries.find(
          { _bundleMeasureId: { $exists: true } },
          { fields: { _bundleMeasureId: 1 } }
        ).fetchAsync();
        measureIds = Array.from(new Set(tagged.map(function(library) {
          return library._bundleMeasureId;
        })));
      }
    }

    if (measureIds.length === 0) {
      throw new Meteor.Error('nothing-to-fetch',
        'No imported measure bundles found. Import a measure package first (Fetch Measure Packages, the Import dialog, or the measure-bundles/ directory).');
    }

    const results = [];
    for (const id of measureIds) {
      const oids = await collectValueSetOids(id);
      log.info('vsac-methods Fetching value sets', { measureId: id, oidCount: oids.length });

      for (const oid of oids) {
        try {
          results.push(Object.assign({ measureId: id }, await expandAndStoreValueSet(oid, resolved.apiKey, id)));
        } catch (error) {
          results.push({ measureId: id, oid: oid, ok: false, error: error.message });
        }
      }
    }

    const fetched = results.filter(function(row) { return row.ok; }).length;
    log.info('vsac-methods Value-set fetch complete', { fetched: fetched, total: results.length });
    return {
      measureIds: measureIds,
      fetched: fetched,
      total: results.length,
      results: results
    };
});

// ---------------------------------------------------------------------------
// eCQI measure-package fetch (best effort — public zips, no key needed)
// ---------------------------------------------------------------------------

Meteor.ServerMethods.define('qualityMeasures.fetchMeasurePackages', {
  description: 'Best-effort download and import of eCQI public measure packages by CMS id',
  positionalParams: ['cmsIds'],
  schemaObject: {
    type: 'object',
    properties: { cmsIds: { type: 'array', items: { type: 'string' } } },
    required: ['cmsIds']
  }
}, async function(params, context){
  const cmsIds = get(params, 'cmsIds');

  const results = [];

    for (const cmsId of cmsIds) {
      const attempt = { cmsId: cmsId, ok: false, imported: [], triedUrls: [] };

      for (const url of ecqiCandidateUrls(cmsId)) {
        attempt.triedUrls.push(url);
        let response;
        try {
          response = await fetch(url, { headers: { Accept: 'application/zip' } });
        } catch (error) {
          continue;
        }
        if (!response.ok) {
          continue;
        }

        try {
          const buffer = Buffer.from(await response.arrayBuffer());
          const unpacked = await importBundlesFromZip(buffer);
          if (unpacked.results.length > 0) {
            attempt.ok = unpacked.results.some(function(row) { return !row.error; });
            attempt.imported = unpacked.results;
            attempt.sourceUrl = url;
            break;
          }
          attempt.error = unpacked.isQdmPackage
            ? 'The published eCQI package for ' + cmsId + ' is QDM-based (CQL + QDM ELM + HQMF) — ' +
              'not executable against FHIR data. Export the FHIR version of this measure from MADiE ' +
              '(https://madie.cms.gov, HARP login) and drop the bundle JSON into measure-bundles/ ' +
              'or use the Import dialog on /quality-measures.'
            : 'Package downloaded but contained no FHIR measure bundle JSON';
        } catch (error) {
          attempt.error = 'Failed to unpack ' + url + ': ' + error.message;
        }
      }

      if (!attempt.ok && !attempt.error) {
        attempt.error = 'No downloadable package found on the eCQI Resource Center. ' +
          'Download the measure package manually from https://ecqi.healthit.gov and either ' +
          'drop the bundle JSON into measure-bundles/ or use the Import dialog on /quality-measures.';
      }

      log.info('vsac-methods Measure-package fetch', { cmsId: cmsId, ok: attempt.ok });
      results.push(attempt);
    }

    return { results: results };
});

console.log('[quality-measures] VSAC/eCQI terminology methods registered');

// npmPackages/order-catalog/server/umls-methods.js
//
// UMLS terminology fetch methods for the order catalog — the BYOK ("bring your
// own key") model. UMLS licenses are individual (NLM issues no product keys),
// so the app ships keyless: each deployment's admin supplies their own UMLS API
// key via the /server-configuration panel (stored in the ServerConfiguration
// collection), Meteor.settings.private.umls.apiKey, or the UMLS_API_KEY env
// var. The key never leaves the server.
//
// RxNorm search: RxNav public API   https://rxnav.nlm.nih.gov/REST  (no key)
// CPT search:    UMLS REST API      https://uts-ws.nlm.nih.gov/rest (needs key —
//                CPT is AMA-licensed and only reachable through a UMLS account)
//
// Hydration stores one PlanDefinition per orderable (type: order-set), the same
// catalog convention server/RadiologyCatalogInitializer.js established for the
// imaging catalog.

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';

import {
  buildMedicationPlanDefinition,
  buildProcedurePlanDefinition,
  flattenCatalogPlanDefinition,
  CATALOG_USE_CONTEXTS
} from '../lib/CatalogPlanDefinitionBuilder.js';

const log = (Meteor.Logger ? Meteor.Logger.for('order-catalog') : console);

const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST';
const UMLS_BASE = 'https://uts-ws.nlm.nih.gov/rest';

// RxNorm term types worth putting in an order catalog — clinical/branded drugs
// with strength + dose form (SCD/SBD) and their pack variants.
const ORDERABLE_TTYS = ['SCD', 'SBD', 'GPCK', 'BPCK'];

// Resolve the UMLS API key. Precedence: ServerConfiguration collection
// (configType 'umls', then 'vsac' — the VSAC key IS a UMLS key, so a key
// already saved on the quality-measures Terminology panel is reused here) →
// Meteor.settings.private.umls.apiKey → UMLS_API_KEY env var.
export async function getUmlsApiKey() {
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (ServerConfiguration) {
    for (const configType of ['umls', 'vsac']) {
      const stored = await ServerConfiguration.findOneAsync({ configType: configType });
      const storedKey = get(stored, 'data.apiKey', '');
      if (storedKey) {
        return { apiKey: storedKey, source: configType === 'vsac' ? 'database (shared VSAC key)' : 'database' };
      }
    }
  }

  const settingsKey = get(Meteor, 'settings.private.umls.apiKey', '');
  if (settingsKey) {
    return { apiKey: settingsKey, source: 'settings' };
  }

  const envKey = process.env.UMLS_API_KEY || '';
  if (envKey) {
    return { apiKey: envKey, source: 'env' };
  }

  return { apiKey: '', source: null };
}

async function requireUmlsApiKey() {
  const resolved = await getUmlsApiKey();
  if (!resolved.apiKey) {
    throw new Meteor.Error('feature-disabled',
      'No UMLS API key configured. Paste your UMLS API key in the Order Catalog ' +
      'panel on /server-configuration (or set Meteor.settings.private.umls.apiKey ' +
      '/ the UMLS_API_KEY env var). Keys are issued per person at ' +
      'https://uts.nlm.nih.gov (My Profile).');
  }
  return resolved;
}

function requireCatalogType(catalogType) {
  check(catalogType, Match.Where(function(type) {
    check(type, String);
    return ['medication', 'procedure'].includes(type);
  }));
}

Meteor.methods({

  // ---------------------------------------------------------------------------
  // BYOK key management (key never returned to the client)
  // ---------------------------------------------------------------------------

  'orderCatalog.checkUmlsSetting': async function() {
    const resolved = await getUmlsApiKey();
    return {
      configured: !!resolved.apiKey,
      source: resolved.source,
      keySuffix: resolved.apiKey ? resolved.apiKey.slice(-4) : ''
    };
  },

  'orderCatalog.saveUmlsApiKey': async function(apiKey) {
    check(apiKey, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to save the UMLS API key');
    }
    if (!apiKey.trim()) {
      throw new Meteor.Error('invalid-key', 'API key must not be empty');
    }

    const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
    if (!ServerConfiguration) {
      throw new Meteor.Error('collection-not-found', 'ServerConfiguration collection not available');
    }

    await ServerConfiguration.updateAsync(
      { configType: 'umls' },
      { $set: {
        configType: 'umls',
        data: { apiKey: apiKey.trim() },
        updatedAt: new Date(),
        updatedBy: this.userId
      }},
      { upsert: true }
    );

    log.info('umls-methods UMLS API key saved to ServerConfiguration');
    return { configured: true, source: 'database', keySuffix: apiKey.trim().slice(-4) };
  },

  'orderCatalog.clearUmlsApiKey': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to clear the UMLS API key');
    }

    const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
    if (!ServerConfiguration) {
      throw new Meteor.Error('collection-not-found', 'ServerConfiguration collection not available');
    }

    await ServerConfiguration.removeAsync({ configType: 'umls' });
    log.info('umls-methods UMLS API key cleared from ServerConfiguration');

    // A shared VSAC key, settings key, or env key may still resolve
    const resolved = await getUmlsApiKey();
    return {
      configured: !!resolved.apiKey,
      source: resolved.source,
      keySuffix: resolved.apiKey ? resolved.apiKey.slice(-4) : ''
    };
  },

  'orderCatalog.testUmlsConnection': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to test the UMLS connection');
    }

    const resolved = await requireUmlsApiKey();

    const url = UMLS_BASE + '/search/current?string=aspirin&pageSize=1&apiKey=' +
      encodeURIComponent(resolved.apiKey);

    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (error) {
      throw new Meteor.Error('umls-unreachable', 'Could not reach the UMLS API: ' + error.message);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Meteor.Error('umls-auth-failed',
        'UMLS rejected the API key (HTTP ' + response.status + '). Verify the key at https://uts.nlm.nih.gov (My Profile).');
    }
    if (!response.ok) {
      throw new Meteor.Error('umls-error', 'UMLS responded with HTTP ' + response.status);
    }

    const body = await response.json();
    const resultCount = get(body, 'result.results', []).length;
    log.info('umls-methods UMLS connection test OK', { source: resolved.source, resultCount: resultCount });
    return { ok: true, source: resolved.source, resultCount: resultCount };
  },

  // ---------------------------------------------------------------------------
  // Terminology search
  // ---------------------------------------------------------------------------

  // RxNorm drug search via the public RxNav API — no key required.
  // Returns orderable concepts ({ rxcui, name, tty, synonym }) filtered to
  // clinical/branded drugs (SCD/SBD) and packs.
  'orderCatalog.searchRxNorm': async function(searchTerm) {
    check(searchTerm, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to search RxNorm');
    }
    if (!searchTerm.trim()) {
      throw new Meteor.Error('invalid-search', 'Search term must not be empty');
    }

    const url = RXNAV_BASE + '/drugs.json?name=' + encodeURIComponent(searchTerm.trim());

    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (error) {
      throw new Meteor.Error('rxnav-unreachable', 'Could not reach RxNav: ' + error.message);
    }
    if (!response.ok) {
      throw new Meteor.Error('rxnav-error', 'RxNav responded with HTTP ' + response.status);
    }

    const body = await response.json();
    const conceptGroups = get(body, 'drugGroup.conceptGroup', []);

    const concepts = [];
    conceptGroups.forEach(function(group) {
      const tty = get(group, 'tty', '');
      if (!ORDERABLE_TTYS.includes(tty)) {
        return;
      }
      get(group, 'conceptProperties', []).forEach(function(property) {
        concepts.push({
          rxcui: get(property, 'rxcui', ''),
          name: get(property, 'name', ''),
          synonym: get(property, 'synonym', ''),
          tty: tty
        });
      });
    });

    log.info('umls-methods RxNorm search', { searchTerm: searchTerm.trim(), resultCount: concepts.length });
    return { searchTerm: searchTerm.trim(), concepts: concepts };
  },

  // CPT procedure-code search via the UMLS REST API — CPT is AMA-licensed, so
  // this requires a configured UMLS API key (settings-gated feature pattern).
  'orderCatalog.searchCptCodes': async function(searchTerm) {
    check(searchTerm, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to search CPT codes');
    }
    if (!searchTerm.trim()) {
      throw new Meteor.Error('invalid-search', 'Search term must not be empty');
    }

    const resolved = await requireUmlsApiKey();

    const url = UMLS_BASE + '/search/current' +
      '?string=' + encodeURIComponent(searchTerm.trim()) +
      '&sabs=CPT&returnIdType=code&inputType=atom&pageSize=25' +
      '&apiKey=' + encodeURIComponent(resolved.apiKey);

    let response;
    try {
      response = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (error) {
      throw new Meteor.Error('umls-unreachable', 'Could not reach the UMLS API: ' + error.message);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Meteor.Error('umls-auth-failed',
        'UMLS rejected the API key (HTTP ' + response.status + '). Verify the key at https://uts.nlm.nih.gov (My Profile).');
    }
    if (!response.ok) {
      throw new Meteor.Error('umls-error', 'UMLS responded with HTTP ' + response.status);
    }

    const body = await response.json();
    const concepts = get(body, 'result.results', [])
      .filter(function(result) {
        // The API pads empty result sets with a NONE placeholder row
        return get(result, 'ui', 'NONE') !== 'NONE';
      })
      .map(function(result) {
        return {
          code: get(result, 'ui', ''),
          name: get(result, 'name', '')
        };
      });

    log.info('umls-methods CPT search', { searchTerm: searchTerm.trim(), resultCount: concepts.length });
    return { searchTerm: searchTerm.trim(), concepts: concepts };
  },

  // ---------------------------------------------------------------------------
  // Catalog hydration — upsert selected concepts as catalog PlanDefinitions
  // ---------------------------------------------------------------------------

  'orderCatalog.hydrateCatalogItems': async function(items, catalogType) {
    check(items, [Object]);
    requireCatalogType(catalogType);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to hydrate the order catalog');
    }
    if (items.length === 0) {
      throw new Meteor.Error('nothing-to-hydrate', 'No catalog items supplied');
    }

    const PlanDefinitions = get(global, 'Collections.PlanDefinitions');
    if (!PlanDefinitions) {
      throw new Meteor.Error('collection-not-found', 'PlanDefinitions collection not available');
    }

    const build = catalogType === 'medication'
      ? buildMedicationPlanDefinition
      : buildProcedurePlanDefinition;

    let inserted = 0;
    let updated = 0;
    const errors = [];

    for (const item of items) {
      const planDefinition = build(item);
      if (!planDefinition) {
        errors.push({ item: item, error: 'Missing code — could not build PlanDefinition' });
        continue;
      }

      try {
        const existing = await PlanDefinitions.findOneAsync({ _id: planDefinition._id }, { fields: { _id: 1 } });
        await PlanDefinitions.updateAsync(
          { _id: planDefinition._id },
          { $set: planDefinition },
          { upsert: true }
        );
        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      } catch (error) {
        errors.push({ item: get(item, 'rxcui', get(item, 'code', '')), error: error.message });
      }
    }

    log.info('umls-methods Catalog hydration complete', {
      catalogType: catalogType,
      inserted: inserted,
      updated: updated,
      errorCount: errors.length
    });

    return { catalogType: catalogType, inserted: inserted, updated: updated, errors: errors };
  }
});

export { flattenCatalogPlanDefinition, CATALOG_USE_CONTEXTS };

console.log('[order-catalog] UMLS terminology methods registered');

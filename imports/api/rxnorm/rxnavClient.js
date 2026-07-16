// imports/api/rxnorm/rxnavClient.js
//
// Server-side RxNav client with Mongo cache-through. The RxNorm and RxClass
// REST APIs at rxnav.nlm.nih.gov are PUBLIC — no UMLS key, no BYOK panel
// (explicitly unlike the VSAC flow in quality-measures). Rate limit is
// 20 req/s/IP, which the cache keeps us far under.
//
// Degradation contract: every network call is wrapped in try/catch with a
// timeout and returns null on failure; hydrateConcept serves stale cache
// when RxNav is unreachable. Callers never see a thrown network error.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';

import { RxNormConcepts } from './collections.js';
import {
  RXNORM_SYSTEM,
  parseRxcuiLookupResponse,
  parsePropertiesResponse,
  parseRelatedResponse,
  parseClassResponse,
  normalizeClassText
} from './rxnormLogic.js';

const log = (Meteor.Logger ? Meteor.Logger.for('rxnorm') : console);

function getRxnormSettings() {
  return {
    enabled: get(Meteor, 'settings.private.rxnorm.enabled', false),
    baseUrl: get(Meteor, 'settings.private.rxnorm.baseUrl', 'https://rxnav.nlm.nih.gov/REST'),
    cacheTtlDays: get(Meteor, 'settings.private.rxnorm.cacheTtlDays', 30),
    timeoutMs: get(Meteor, 'settings.private.rxnorm.timeoutMs', 5000)
  };
}

// GET <baseUrl><path>, JSON-parsed. Returns null on any failure (timeout,
// HTTP error, parse error) — never throws.
async function rxnavGetJson(path) {
  const settings = getRxnormSettings();
  const url = settings.baseUrl + path;
  const controller = new AbortController();
  const timer = setTimeout(function() { controller.abort(); }, settings.timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) {
      log.warn('RxNav request failed', { url: url, status: response.status });
      return null;
    }
    return await response.json();
  } catch (error) {
    log.warn('RxNav request error', { url: url, error: error.message });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isFresh(conceptDoc) {
  const settings = getRxnormSettings();
  if (!conceptDoc || !conceptDoc.fetchedAt) {
    return false;
  }
  const ageMs = Date.now() - new Date(conceptDoc.fetchedAt).getTime();
  return ageMs < settings.cacheTtlDays * 24 * 60 * 60 * 1000;
}

// Resolves a medication coding/text to an RxCUI string, or null.
// input: { code, system, display, text }
// Trusts coding.code directly when the system is the RxNorm URI; otherwise
// falls back to a cached or live approximate-name lookup (search=2).
export async function resolveRxcui(input) {
  const code = get(input, 'code', '');
  const system = get(input, 'system', '');
  if (code && system.toLowerCase().indexOf('rxnorm') !== -1) {
    return String(code);
  }

  const name = get(input, 'text') || get(input, 'display') || '';
  const normalized = normalizeClassText(name);
  if (!normalized) {
    return null;
  }

  const cached = await RxNormConcepts.findOneAsync({ sourceQueries: normalized });
  if (cached) {
    return cached.rxcui;
  }

  const json = await rxnavGetJson('/rxcui.json?name=' + encodeURIComponent(name) + '&search=2');
  return parseRxcuiLookupResponse(json);
}

// Returns the concept document { rxcui, name, tty, ingredients, classes,
// fetchedAt, source } for an RxCUI — cache-first, refreshing stale rows,
// serving stale rows when RxNav is down, null when nothing is available.
// sourceQuery (optional): normalized text that resolved to this rxcui, saved
// for future text-based cache hits.
export async function hydrateConcept(rxcui, sourceQuery) {
  if (!rxcui) {
    return null;
  }

  const cached = await RxNormConcepts.findOneAsync({ rxcui: String(rxcui) });
  if (cached && isFresh(cached)) {
    if (sourceQuery && (cached.sourceQueries || []).indexOf(sourceQuery) === -1) {
      await RxNormConcepts.updateAsync({ _id: cached._id }, { $addToSet: { sourceQueries: sourceQuery } });
    }
    return cached;
  }

  const [propertiesJson, relatedJson, classJson] = await Promise.all([
    rxnavGetJson('/rxcui/' + rxcui + '/properties.json'),
    rxnavGetJson('/rxcui/' + rxcui + '/related.json?tty=IN+MIN'),
    rxnavGetJson('/rxclass/class/byRxcui.json?rxcui=' + rxcui)
  ]);

  const properties = parsePropertiesResponse(propertiesJson);
  if (!properties) {
    // RxNav unreachable or unknown rxcui: degrade to stale cache, then null.
    if (cached) {
      log.debug('Serving stale RxNormConcepts cache row', { rxcui: rxcui });
      return cached;
    }
    return null;
  }

  const conceptDoc = {
    rxcui: properties.rxcui,
    name: properties.name,
    tty: properties.tty,
    ingredients: parseRelatedResponse(relatedJson),
    classes: parseClassResponse(classJson),
    fetchedAt: new Date(),
    source: 'rxnav'
  };

  await RxNormConcepts.upsertAsync(
    { rxcui: conceptDoc.rxcui },
    {
      $set: conceptDoc,
      $addToSet: { sourceQueries: sourceQuery || normalizeClassText(properties.name) }
    }
  );

  return await RxNormConcepts.findOneAsync({ rxcui: conceptDoc.rxcui });
}

export { getRxnormSettings };

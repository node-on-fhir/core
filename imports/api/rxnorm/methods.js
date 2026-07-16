// imports/api/rxnorm/methods.js
//
// RxNorm assistance methods (public RxNav API + local cache). Shared host-app
// module — callable from pacio-core (medication reconciliation),
// order-catalog, quality-measures, etc.
//
// Settings gate (settings-gated-feature pattern):
//   settings.private.rxnorm.enabled     — server-side master switch
//   settings.public.modules.rxnormAssist — client UI affordance visibility
//
// Degradation contract: rxnorm.reconciliationAssist NEVER throws on network
// failure — it returns { available: false } and the reconciliation UI carries
// on with exact-code matching.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

import { RxNormConcepts } from './collections.js';
import { resolveRxcui, hydrateConcept, getRxnormSettings } from './rxnavClient.js';
import {
  extractMedicationCodings,
  getMedicationDisplay,
  matchByRxcuiOrIngredient,
  findDuplicateIngredients,
  matchAllergyClasses,
  normalizeClassText
} from './rxnormLogic.js';

const log = (Meteor.Logger ? Meteor.Logger.for('rxnorm') : console);

function getCollection(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

// Resolves + hydrates one medication resource into a concept entry:
// { resourceId, display, rxcui, ingredients, classes } — or a bare entry with
// rxcui: null when RxNorm can't place it.
async function conceptEntryForResource(resource) {
  const display = getMedicationDisplay(resource);
  const codings = extractMedicationCodings(resource);
  const primaryCoding = codings.length ? codings[0] : {};

  const rxcui = await resolveRxcui({
    code: primaryCoding.code,
    system: primaryCoding.system,
    display: primaryCoding.display,
    text: get(resource, 'medicationCodeableConcept.text', '')
  });

  const concept = rxcui ? await hydrateConcept(rxcui, normalizeClassText(display)) : null;

  return {
    resourceId: resource._id,
    display: display,
    rxcui: concept ? concept.rxcui : null,
    name: get(concept, 'name', ''),
    ingredients: get(concept, 'ingredients', []),
    classes: get(concept, 'classes', [])
  };
}

function allergyDisplay(allergy) {
  return get(allergy, 'code.text') ||
    get(allergy, 'code.coding[0].display') ||
    '';
}

Meteor.methods({
  // Decoration payload for the reconciliation UI. Gathers the patient's
  // active MedicationRequests + MedicationStatements + AllergyIntolerances
  // server-side, resolves/hydrates RxNorm concepts (cache-first), and
  // returns matches / duplicate-ingredient / allergy-class findings.
  'rxnorm.reconciliationAssist': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const settings = getRxnormSettings();
    if (!settings.enabled) {
      log.debug('rxnorm.reconciliationAssist: disabled via settings');
      return { available: false, reason: 'disabled' };
    }

    try {
      const MedicationRequests = getCollection('MedicationRequests');
      const MedicationStatements = getCollection('MedicationStatements');
      const AllergyIntolerances = getCollection('AllergyIntolerances');
      if (!MedicationRequests || !MedicationStatements) {
        return { available: false, reason: 'collections-unavailable' };
      }

      const subjectQuery = {
        'subject.reference': { $in: ['Patient/' + patientId, 'urn:uuid:' + patientId] }
      };

      const requests = await MedicationRequests.find(Object.assign({}, subjectQuery, {
        status: { $in: ['active', 'completed'] }
      })).fetchAsync();
      const statements = await MedicationStatements.find(Object.assign({}, subjectQuery, {
        status: { $nin: ['stopped', 'entered-in-error'] }
      })).fetchAsync();
      const allergies = AllergyIntolerances
        ? await AllergyIntolerances.find(subjectQuery).fetchAsync()
        : [];

      // Sequential hydration keeps us well under RxNav's 20 req/s/IP limit;
      // after the first pass everything is cache-served anyway.
      const requestEntries = [];
      for (const resource of requests) {
        requestEntries.push(await conceptEntryForResource(resource));
      }
      const statementEntries = [];
      for (const resource of statements) {
        statementEntries.push(await conceptEntryForResource(resource));
      }

      const allEntries = requestEntries.concat(statementEntries);
      const resolvedEntries = allEntries.filter(function(entry) { return entry.rxcui; });

      // Nothing resolved and meds exist -> RxNav is down with a cold cache.
      if (allEntries.length && !resolvedEntries.length) {
        log.warn('rxnorm.reconciliationAssist: no concepts resolved (RxNav unreachable, cold cache?)');
        return { available: false, reason: 'unreachable' };
      }

      const concepts = {};
      resolvedEntries.forEach(function(entry) {
        concepts[entry.resourceId] = {
          rxcui: entry.rxcui,
          name: entry.name,
          ingredients: entry.ingredients
        };
      });

      const matches = matchByRxcuiOrIngredient(statementEntries, requestEntries);
      // Duplicate-ingredient check runs across the ACTIVE ORDER list only —
      // a home-med statement matching its own order is expected, not a dup.
      const duplicates = findDuplicateIngredients(requestEntries);
      const allergyWarnings = matchAllergyClasses(
        requestEntries,
        allergies.map(function(allergy) {
          return { resourceId: allergy._id, display: allergyDisplay(allergy) };
        })
      );

      log.info('rxnorm.reconciliationAssist complete', {
        patientId: patientId,
        resolved: resolvedEntries.length,
        of: allEntries.length,
        matches: matches.length,
        duplicates: duplicates.length,
        allergyWarnings: allergyWarnings.length
      });

      return {
        available: true,
        concepts: concepts,
        matches: matches,
        duplicates: duplicates,
        allergyWarnings: allergyWarnings
      };
    } catch (error) {
      log.error('rxnorm.reconciliationAssist failed', { error: error.message });
      return { available: false, reason: 'error' };
    }
  },

  'rxnorm.getCacheStats': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    const count = await RxNormConcepts.find({}).countAsync();
    const oldest = await RxNormConcepts.findOneAsync({}, { sort: { fetchedAt: 1 } });
    return {
      count: count,
      oldestFetchedAt: get(oldest, 'fetchedAt', null),
      enabled: getRxnormSettings().enabled
    };
  },

  'rxnorm.clearCache': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    const removed = await RxNormConcepts.removeAsync({});
    log.info('rxnorm.clearCache removed cached concepts', { removed: removed });
    return { removed: removed };
  }
});

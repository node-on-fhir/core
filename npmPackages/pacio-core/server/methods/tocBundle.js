// packages/pacio-core/server/methods/tocBundle.js
//
// Server methods for TOCBundle generation, import, and export.
// Assembles a document Bundle from a Composition and all section entry resources.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

import { isAdiDocument } from '../../lib/constants/AdiConstants';

const TOC_BUNDLE_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Bundle';

/**
 * Generate a TOCBundle from a Composition and its referenced resources.
 * @param {string} compositionId - The _id of the Composition to bundle
 * @param {Object} [options] - { scope: 'summary' | 'full' | 'everything' }
 *   summary    — Composition + Patient + stored section refs + authors
 *   full       — summary plus the records backing each Continuity of Care
 *                section (server-side mirror of the ToC page's
 *                getSectionRecords matcher); section.entry gets populated
 *   everything — full plus every patient-matched record in every collection
 * @returns {Object} FHIR Bundle resource
 */
Meteor.ServerMethods.define('pacio.tocBundle.generate', {
  description: 'Assemble a TOC (Transfer of Care) document Bundle from a Composition',
  phi: true,
  positionalParams: ['compositionId', 'options'],
  schemaObject: {
    type: 'object',
    properties: { compositionId: { type: 'string' }, options: { type: 'object' } },
    required: ['compositionId']
  }
}, async function(params, context) {
    const compositionId = params.compositionId;
    const options = params.options;

    const scope = get(options, 'scope', 'full');

    console.log('[pacio.tocBundle.generate] Generating TOCBundle for composition:', compositionId, '(scope: ' + scope + ')');

    // Find the Composition
    const Compositions = get(global, 'Collections.Compositions');
    if (!Compositions) {
      throw new Meteor.Error('not-available', 'Compositions collection not available');
    }

    const composition = await Compositions.findOneAsync({ _id: compositionId });
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found: ' + compositionId);
    }

    // Build the Bundle with de-duplicated entries (ResourceType/id keyed).
    const entries = [];
    const addedKeys = new Set();

    function addEntry(resource) {
      if (!resource || !get(resource, 'resourceType')) return;
      const rid = get(resource, 'id', resource._id);
      const key = get(resource, 'resourceType') + '/' + rid;
      if (addedKeys.has(key)) return;
      addedKeys.add(key);
      entries.push({
        fullUrl: 'urn:uuid:' + rid,
        resource: sanitizeResource(resource)
      });
    }

    // First entry must be the Composition (bdl-11). Sanitize a copy now; the
    // full/everything scopes populate its section.entry below before the
    // bundle ships.
    const outboundComposition = sanitizeResource(composition);
    const compositionKey = 'Composition/' + get(composition, 'id', composition._id);
    addedKeys.add(compositionKey);
    entries.push({
      fullUrl: 'urn:uuid:' + get(composition, 'id', composition._id),
      resource: outboundComposition
    });

    // Add patient
    const patientRef = get(composition, 'subject.reference', '');
    const patientId = patientRef.replace('Patient/', '').replace('urn:uuid:', '');

    let patient = null;
    if (patientId) {
      patient = await findResource('Patients', patientId);
      if (patient) {
        addEntry(patient);
      }
    }

    // Collect all entry references already stored on sections
    const sections = get(composition, 'section', []);
    const processedRefs = new Set();

    for (let i = 0; i < sections.length; i++) {
      const sectionEntries = get(sections[i], 'entry', []);
      for (let j = 0; j < sectionEntries.length; j++) {
        const ref = get(sectionEntries[j], 'reference', '');
        if (ref && !processedRefs.has(ref)) {
          processedRefs.add(ref);
          const resource = await resolveReference(ref);
          if (resource) {
            addEntry(resource);
          }
        }
      }
    }

    // Add author resources
    const authors = get(composition, 'author', []);
    for (let i = 0; i < authors.length; i++) {
      const authorRef = get(authors[i], 'reference', '');
      if (authorRef && !processedRefs.has(authorRef)) {
        processedRefs.add(authorRef);
        const resource = await resolveReference(authorRef);
        if (resource) {
          addEntry(resource);
        }
      }
    }

    // full / everything — gather the records backing the Continuity of Care
    // sections (the ToC page derives these reactively; the stored Composition's
    // section.entry arrays are empty) and populate the outbound section refs.
    if ((scope === 'full' || scope === 'everything') && patientId) {
      const query = patientReferenceQuery(patient, patientId);
      const sectionRecords = await gatherSectionRecords(query);

      const outboundSections = get(outboundComposition, 'section', []);
      outboundSections.forEach(function(section) {
        const sectionCode = get(section, 'code.coding.0.code', '');
        const records = sectionRecords[sectionCode] || [];
        if (records.length === 0) return;
        const existing = Array.isArray(section.entry) ? section.entry : [];
        const existingRefs = new Set(existing.map(function(e) { return get(e, 'reference', ''); }));
        records.forEach(function(record) {
          const rid = get(record, 'id', record._id);
          const urn = 'urn:uuid:' + rid;
          if (!existingRefs.has(urn)) {
            existing.push({ reference: urn });
            existingRefs.add(urn);
          }
          addEntry(record);
        });
        section.entry = existing;
      });

      // Records whose section didn't survive into this Composition still ride
      // along in the bundle — the receiving system gets the data either way.
      Object.keys(sectionRecords).forEach(function(sectionCode) {
        sectionRecords[sectionCode].forEach(addEntry);
      });
    }

    // everything — sweep every collection for patient-matched records.
    if (scope === 'everything' && patientId) {
      const query = patientReferenceQuery(patient, patientId);
      const collections = get(global, 'Collections', {});
      const collectionNames = Object.keys(collections).filter(function(name) {
        return name !== 'Patients';
      });
      for (let i = 0; i < collectionNames.length; i++) {
        const records = await fetchPatientScoped(collectionNames[i], query);
        records.forEach(addEntry);
      }
    }

    const bundle = {
      resourceType: 'Bundle',
      id: Random.id(),
      meta: {
        profile: [TOC_BUNDLE_PROFILE],
        lastUpdated: new Date().toISOString()
      },
      identifier: {
        system: 'urn:ietf:rfc:3986',
        value: 'urn:uuid:' + Random.id()
      },
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: entries
    };

    context.log.info('tocBundle.generate Bundle created', { entryCount: entries.length });
    return bundle;
});

/**
 * Import a TOCBundle -- parse and store resources into collections.
 * @param {Object} bundleJson - FHIR Bundle resource
 * @returns {{ importedCount, errors }}
 */
Meteor.ServerMethods.define('pacio.tocBundle.import', {
  description: 'Import a TOC document Bundle, upserting its resources into collections',
  phi: true,
  positionalParams: ['bundleJson'],
  schemaObject: {
    type: 'object',
    properties: { bundleJson: { type: 'object' } },
    required: ['bundleJson']
  }
}, async function(params, context) {
    const bundleJson = params.bundleJson;

    context.log.info('tocBundle.import Importing TOCBundle');

    if (get(bundleJson, 'resourceType') !== 'Bundle') {
      throw new Meteor.Error('invalid-resource', 'Expected a Bundle resource');
    }

    const entries = get(bundleJson, 'entry', []);
    let importedCount = 0;
    const errors = [];

    for (let i = 0; i < entries.length; i++) {
      const resource = get(entries[i], 'resource');
      if (!resource) continue;

      const resourceType = get(resource, 'resourceType');
      const collectionName = resourceType + 's'; // Pluralize
      const collection = get(global, 'Collections.' + collectionName);

      if (!collection) {
        console.warn('[pacio.tocBundle.import] Collection not found: ' + collectionName);
        errors.push('Collection not found: ' + collectionName);
        continue;
      }

      try {
        // Set _id from id if not present
        if (!resource._id && resource.id) {
          resource._id = resource.id;
        }
        if (!resource._id) {
          resource._id = Random.id();
          resource.id = resource._id;
        }

        // Upsert to avoid duplicates
        if (typeof collection.updateAsync === 'function') {
          await collection.updateAsync(
            { _id: resource._id },
            { $set: resource },
            { upsert: true }
          );
        }
        importedCount++;
      } catch (error) {
        console.error('[pacio.tocBundle.import] Error importing ' + resourceType + ':', error.message);
        errors.push(resourceType + '/' + resource._id + ': ' + error.message);
      }
    }

    context.log.info('tocBundle.import Imported resources', { importedCount, errorCount: errors.length });
    return { importedCount: importedCount, errors: errors };
});

/**
 * Export a TOCBundle as downloadable JSON.
 * Wrapper around generate that returns a stringified version.
 */
Meteor.ServerMethods.define('pacio.tocBundle.export', {
  description: 'Export a TOC document Bundle for a Composition as pretty-printed JSON',
  phi: true,
  positionalParams: ['compositionId'],
  schemaObject: {
    type: 'object',
    properties: { compositionId: { type: 'string' } },
    required: ['compositionId']
  }
}, async function(params, context) {
    const compositionId = params.compositionId;

    const bundle = await Meteor.callAsync('pacio.tocBundle.generate', compositionId);
    return JSON.stringify(bundle, null, 2);
});

/**
 * Find a resource by ID in global.Collections.
 */
async function findResource(collectionName, resourceId) {
  const collection = get(global, 'Collections.' + collectionName);
  if (!collection) return null;

  if (typeof collection.findOneAsync === 'function') {
    let resource = await collection.findOneAsync({ _id: resourceId });
    if (!resource) {
      resource = await collection.findOneAsync({ id: resourceId });
    }
    return resource;
  }
  return null;
}

/**
 * Match on BOTH reference fields and every id/URN variant: most clinical
 * resources use subject.reference, but AllergyIntolerance, Immunization,
 * NutritionOrder, and Device are patient.reference per FHIR R4. Mirrors the
 * ToC page's query builder.
 */
function patientReferenceQuery(patient, patientId) {
  const ids = new Set();
  if (patientId) ids.add(patientId);
  if (patient) {
    if (patient.id) ids.add(patient.id);
    if (patient._id) ids.add(patient._id);
  }
  const refs = [];
  ids.forEach(function(id) {
    refs.push('Patient/' + id);
    refs.push('urn:uuid:' + id);
  });
  return {
    $or: [
      { 'subject.reference': { $in: refs } },
      { 'patient.reference': { $in: refs } }
    ]
  };
}

/**
 * Fetch every record in a collection matching the patient query. Missing
 * collections and query errors resolve to an empty list — a transfer bundle
 * should never fail because one optional collection isn't registered.
 */
async function fetchPatientScoped(collectionName, query) {
  const collection = get(global, 'Collections.' + collectionName);
  if (!collection || typeof collection.find !== 'function') return [];
  try {
    return await collection.find(query).fetchAsync();
  } catch (error) {
    console.warn('[pacio.tocBundle.generate] Skipping ' + collectionName + ':', error.message);
    return [];
  }
}

function resourceHasCategory(resource, code) {
  return (get(resource, 'category', []) || []).some(function(cat) {
    return (get(cat, 'coding', []) || []).some(function(coding) { return coding.code === code; });
  });
}

function qrMatches(questionnaireResponse, regex) {
  return regex.test(get(questionnaireResponse, 'questionnaire', '') || '');
}

/**
 * Server-side mirror of TransitionOfCarePage's getSectionRecords: the records
 * backing each Continuity of Care section, keyed by section id (the section
 * code the page writes into composition.section[].code.coding[0].code).
 * Keep the two matchers in sync when section rules change.
 */
async function gatherSectionRecords(query) {
  const [
    conditions, medicationRequests, medicationStatements, allergyIntolerances,
    immunizations, observations, procedures, carePlans, careTeams,
    serviceRequests, nutritionOrders, devices, questionnaireResponses,
    documentReferences, encounters
  ] = await Promise.all([
    fetchPatientScoped('Conditions', query),
    fetchPatientScoped('MedicationRequests', query),
    fetchPatientScoped('MedicationStatements', query),
    fetchPatientScoped('AllergyIntolerances', query),
    fetchPatientScoped('Immunizations', query),
    fetchPatientScoped('Observations', query),
    fetchPatientScoped('Procedures', query),
    fetchPatientScoped('CarePlans', query),
    fetchPatientScoped('CareTeams', query),
    fetchPatientScoped('ServiceRequests', query),
    fetchPatientScoped('NutritionOrders', query),
    fetchPatientScoped('Devices', query),
    fetchPatientScoped('QuestionnaireResponses', query),
    fetchPatientScoped('DocumentReferences', query),
    fetchPatientScoped('Encounters', query)
  ]);

  // Medication resources are definitional (not patient-scoped) — carry only
  // the ones the patient's requests/statements actually reference.
  const medicationRefs = new Set();
  medicationRequests.concat(medicationStatements).forEach(function(record) {
    const ref = get(record, 'medicationReference.reference', '');
    if (ref.indexOf('Medication/') === 0) medicationRefs.add(ref);
  });
  const medications = [];
  for (const ref of medicationRefs) {
    const medication = await resolveReference(ref);
    if (medication) medications.push(medication);
  }

  return {
    'diagnoses': conditions,
    'medications': medications.concat(medicationRequests, medicationStatements),
    'allergies': allergyIntolerances,
    'functional-status': observations.filter(function(o) { return resourceHasCategory(o, 'functional-status'); })
      .concat(questionnaireResponses.filter(function(qr) { return qrMatches(qr, /promis-?10|global[-\s]?health|pfe|function|mobility|adl/i); })),
    'cognitive-status': questionnaireResponses.filter(function(qr) { return qrMatches(qr, /bims|brief[-\s]?interview|mental[-\s]?status|cognit|moca|mmse/i); }),
    'care-preferences': carePlans,
    'care-team': careTeams,
    'discharge-instructions': documentReferences.filter(function(d) { return !isAdiDocument(d); }),
    'advance-directives': documentReferences.filter(isAdiDocument),
    'nutrition': nutritionOrders,
    'skin-conditions': observations.filter(function(o) {
      return resourceHasCategory(o, 'exam') || (get(o, 'code.text', '') || '').toLowerCase().includes('skin');
    }),
    'immunizations': immunizations,
    'vital-signs': observations.filter(function(o) { return resourceHasCategory(o, 'vital-signs'); }),
    'social-history': observations.filter(function(o) { return resourceHasCategory(o, 'social-history'); }),
    'equipment': devices,
    'encounters': encounters,
    'procedures': procedures,
    'results': observations.filter(function(o) { return resourceHasCategory(o, 'laboratory'); }),
    'follow-up': serviceRequests,
    'behavioral-health': questionnaireResponses.filter(function(qr) { return qrMatches(qr, /gad-?7|phq|depress|anx|behav|pain[-\s]?interference/i); })
  };
}

/**
 * Resolve a FHIR reference (e.g., "Patient/123") to a resource.
 */
async function resolveReference(reference) {
  if (!reference) return null;

  const parts = reference.replace('urn:uuid:', '').split('/');
  if (parts.length < 2) return null;

  const resourceType = parts[parts.length - 2] || parts[0];
  const resourceId = parts[parts.length - 1];
  const collectionName = resourceType + 's';

  return await findResource(collectionName, resourceId);
}

/**
 * Remove MongoDB-specific fields from a resource for export. `_id` must NOT
 * ride along: in FHIR JSON an underscore-prefixed key ("_id") means
 * "extensions of the id primitive", so external servers (HAPI-0450) reject the
 * whole payload as unparseable. The FHIR id lives in `id`; backfill it from
 * `_id` when absent, then drop the Mongo fields.
 */
function sanitizeResource(resource) {
  const clean = JSON.parse(JSON.stringify(resource || {}));
  if (!clean.id && clean._id) {
    clean.id = clean._id;
  }
  delete clean._id;
  delete clean._document;
  return clean;
}

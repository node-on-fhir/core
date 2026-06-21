// packages/pacio-core/server/methods/tocBundle.js
//
// Server methods for TOCBundle generation, import, and export.
// Assembles a document Bundle from a Composition and all section entry resources.

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

const TOC_BUNDLE_PROFILE = 'http://hl7.org/fhir/us/pacio-toc/StructureDefinition/TOC-Bundle';

Meteor.methods({
  /**
   * Generate a TOCBundle from a Composition and its referenced resources.
   * @param {string} compositionId - The _id of the Composition to bundle
   * @returns {Object} FHIR Bundle resource
   */
  'pacio.tocBundle.generate': async function(compositionId) {
    check(compositionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.tocBundle.generate] Generating TOCBundle for composition:', compositionId);

    // Find the Composition
    const Compositions = get(global, 'Collections.Compositions');
    if (!Compositions) {
      throw new Meteor.Error('not-available', 'Compositions collection not available');
    }

    const composition = await Compositions.findOneAsync({ _id: compositionId });
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found: ' + compositionId);
    }

    // Build the Bundle
    const entries = [];

    // First entry must be the Composition (bdl-11)
    entries.push({
      fullUrl: 'urn:uuid:' + get(composition, 'id', composition._id),
      resource: sanitizeResource(composition)
    });

    // Add patient
    const patientRef = get(composition, 'subject.reference', '');
    const patientId = patientRef.replace('Patient/', '').replace('urn:uuid:', '');

    if (patientId) {
      const patient = await findResource('Patients', patientId);
      if (patient) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(patient, 'id', patient._id),
          resource: sanitizeResource(patient)
        });
      }
    }

    // Collect all entry references from sections
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
            entries.push({
              fullUrl: 'urn:uuid:' + get(resource, 'id', resource._id),
              resource: sanitizeResource(resource)
            });
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
          entries.push({
            fullUrl: 'urn:uuid:' + get(resource, 'id', resource._id),
            resource: sanitizeResource(resource)
          });
        }
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

    console.log('[pacio.tocBundle.generate] Bundle created with ' + entries.length + ' entries');
    return bundle;
  },

  /**
   * Import a TOCBundle -- parse and store resources into collections.
   * @param {Object} bundleJson - FHIR Bundle resource
   * @returns {{ importedCount, errors }}
   */
  'pacio.tocBundle.import': async function(bundleJson) {
    check(bundleJson, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[pacio.tocBundle.import] Importing TOCBundle');

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

    console.log('[pacio.tocBundle.import] Imported ' + importedCount + ' resources, ' + errors.length + ' errors');
    return { importedCount: importedCount, errors: errors };
  },

  /**
   * Export a TOCBundle as downloadable JSON.
   * Wrapper around generate that returns a stringified version.
   */
  'pacio.tocBundle.export': async function(compositionId) {
    check(compositionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const bundle = await Meteor.callAsync('pacio.tocBundle.generate', compositionId);
    return JSON.stringify(bundle, null, 2);
  }
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
 * Remove MongoDB-specific fields from a resource for export.
 */
function sanitizeResource(resource) {
  const clean = Object.assign({}, resource);
  // Keep _id as is since it's used as the FHIR id in this system
  return clean;
}

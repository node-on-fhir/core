// packages/pacio-core/server/methods/pfeExchange.js
//
// Server methods for PFE data exchange (HIE simulation).
// Exports and imports PFE assessment bundles.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

/**
 * Export a PFE transaction Bundle for specific assessments.
 */
Meteor.ServerMethods.define('pacio.pfeExchange.exportBundle', {
  description: 'Export a PFE transaction Bundle of a patient\'s assessment resources',
  phi: true,
  positionalParams: ['patientId', 'assessmentIds'],
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      assessmentIds: { type: 'array', items: { type: 'string' } }
    },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;
    const assessmentIds = params.assessmentIds;

    context.log.debug('pfeExchange.exportBundle Exporting for patient', { patientId });

    const entries = [];
    const patientRef = 'Patient/' + patientId;

    // Get Patient resource
    const Patients = get(global, 'Collections.Patients');
    if (Patients) {
      let patient = await Patients.findOneAsync({ _id: patientId });
      if (!patient) {
        patient = await Patients.findOneAsync({ id: patientId });
      }
      if (patient) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(patient, 'id', patient._id),
          resource: patient,
          request: { method: 'POST', url: 'Patient' }
        });
      }
    }

    // Get QuestionnaireResponses
    const QuestionnaireResponses = get(global, 'Collections.QuestionnaireResponses');
    if (QuestionnaireResponses) {
      const query = {
        'subject.reference': { $in: [patientRef, 'urn:uuid:' + patientId] }
      };

      // Filter by specific assessment IDs if provided
      if (assessmentIds && assessmentIds.length > 0) {
        query._id = { $in: assessmentIds };
      }

      const qrs = await QuestionnaireResponses.find(query).fetchAsync();
      qrs.forEach(function(qr) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(qr, 'id', qr._id),
          resource: qr,
          request: { method: 'POST', url: 'QuestionnaireResponse' }
        });
      });
    }

    // Get PFE Observations
    const Observations = get(global, 'Collections.Observations');
    if (Observations) {
      const obsQuery = {
        'subject.reference': { $in: [patientRef, 'urn:uuid:' + patientId] },
        'category.coding.code': 'survey'
      };

      const obs = await Observations.find(obsQuery).fetchAsync();
      obs.forEach(function(ob) {
        entries.push({
          fullUrl: 'urn:uuid:' + get(ob, 'id', ob._id),
          resource: ob,
          request: { method: 'POST', url: 'Observation' }
        });
      });
    }

    const bundle = {
      resourceType: 'Bundle',
      id: Random.id(),
      type: 'transaction',
      timestamp: new Date().toISOString(),
      meta: {
        tag: [{
          system: 'http://hl7.org/fhir/us/pacio-pfe',
          code: 'pfe-exchange',
          display: 'PFE Data Exchange Bundle'
        }]
      },
      entry: entries
    };

    context.log.info('pfeExchange.exportBundle Bundle created', { entryCount: entries.length });
    return bundle;
});

/**
 * Import a PFE Bundle -- parse and store resources.
 */
Meteor.ServerMethods.define('pacio.pfeExchange.importBundle', {
  description: 'Import a PFE transaction Bundle, upserting its resources into local collections',
  phi: true,
  positionalParams: ['bundleJson'],
  schemaObject: {
    type: 'object',
    properties: { bundleJson: { type: 'object' } },
    required: ['bundleJson']
  }
}, async function(params, context) {
    const bundleJson = params.bundleJson;

    context.log.info('pfeExchange.importBundle Importing PFE bundle');

    if (get(bundleJson, 'resourceType') !== 'Bundle') {
      throw new Meteor.Error('invalid-resource', 'Expected a Bundle resource');
    }

    const entries = get(bundleJson, 'entry', []);
    let importedCount = 0;
    const errors = [];
    const importedResources = [];

    for (let i = 0; i < entries.length; i++) {
      const resource = get(entries[i], 'resource');
      if (!resource) continue;

      const resourceType = get(resource, 'resourceType');
      const collectionName = resourceType + 's';
      const collection = get(global, 'Collections.' + collectionName);

      if (!collection) {
        errors.push('Collection not found: ' + collectionName);
        continue;
      }

      try {
        if (!resource._id && resource.id) {
          resource._id = resource.id;
        }
        if (!resource._id) {
          resource._id = Random.id();
          resource.id = resource._id;
        }

        // Tag as imported
        if (!resource.meta) resource.meta = {};
        if (!resource.meta.tag) resource.meta.tag = [];
        resource.meta.tag.push({
          system: 'http://hl7.org/fhir/us/pacio-pfe',
          code: 'imported',
          display: 'Imported via PFE exchange'
        });
        resource.meta.lastUpdated = new Date().toISOString();

        if (typeof collection.updateAsync === 'function') {
          await collection.updateAsync(
            { _id: resource._id },
            { $set: resource },
            { upsert: true }
          );
        }

        importedCount++;
        importedResources.push({
          resourceType: resourceType,
          id: resource._id
        });
      } catch (error) {
        errors.push(resourceType + '/' + resource._id + ': ' + error.message);
      }
    }

    context.log.info('pfeExchange.importBundle Imported resources', { importedCount });
    return {
      importedCount: importedCount,
      errors: errors,
      importedResources: importedResources
    };
});

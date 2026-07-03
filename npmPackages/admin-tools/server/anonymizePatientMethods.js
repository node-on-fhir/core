// packages/admin-tools/server/anonymizePatientMethods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';
import { PATIENT_COMPARTMENT_MAP, buildPatientQuery } from '../lib/PatientCompartmentMapper';
import { Anonymizer } from '../lib/Anonymizer';

const log = (Meteor.Logger ? Meteor.Logger.for('anonymizePatientMethods') : console);

Meteor.methods({
  /**
   * Search for patients by name, MRN, or _id
   * Returns up to 10 flattened results for display
   */
  'adminTools.anonymizePatient.search': async function(searchTerm) {
    check(searchTerm, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return [];
    }

    const regexPattern = { $regex: trimmed, $options: 'i' };
    const query = {
      $or: [
        { _id: trimmed },
        { 'name.0.family': regexPattern },
        { 'name.0.given': regexPattern },
        { 'name.0.text': regexPattern },
        { 'identifier.value': regexPattern }
      ]
    };

    log.phi('Searching for', { searchTerm: trimmed }, { action: 'search' });

    const patients = await Patients.find(query, { limit: 10, sort: { 'name.0.family': 1 } }).fetchAsync();

    const results = patients.map(function(patient) {
      return {
        _id: get(patient, '_id'),
        id: get(patient, 'id'),
        familyName: get(patient, 'name.0.family', ''),
        givenName: get(patient, 'name.0.given.0', ''),
        fullName: get(patient, 'name.0.text', ''),
        gender: get(patient, 'gender', ''),
        birthDate: get(patient, 'birthDate', ''),
        mrn: (get(patient, 'identifier', []).find(function(ident) {
          return get(ident, 'type.coding.0.code') === 'MR';
        }) || {}).value || ''
      };
    });

    log.debug('Found patients', { count: results.length });
    return results;
  },

  /**
   * Dry-run: fetches all resources, runs PHI detection, builds before/after preview.
   * Does not modify any data.
   */
  'adminTools.anonymizePatient.dryRun': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const allowAnonymization = get(Meteor, 'settings.private.allowPatientAnonymization', false);
    if (!allowAnonymization) {
      throw new Meteor.Error('feature-disabled', 'Patient anonymization is disabled. Set Meteor.settings.private.allowPatientAnonymization to true.');
    }

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    const patient = await Patients.findOneAsync({ _id: patientId });
    if (!patient) {
      throw new Meteor.Error('patient-not-found', 'Patient not found with _id: ' + patientId);
    }

    const mongoId = get(patient, '_id');
    const fhirId = get(patient, 'id');
    const patientName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    log.phi('Scanning PHI for patient', { mongoId, patientName }, { action: 'read' });

    // Count resources per collection
    const resourceCounts = {};
    let totalLinkedResources = 0;

    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const count = await collection.find(query).countAsync();
        if (count > 0) {
          resourceCounts[collectionName] = count;
          totalLinkedResources += count;
        }
      } catch (error) {
        log.warn('Error counting collection', { collectionName, message: error.message });
      }
    }

    // Build PHI summary: count PHI fields by Safe Harbor category
    const phiSummary = {};
    const resourceTypesFound = new Set();
    resourceTypesFound.add('Patient');

    for (const collectionName of Object.keys(resourceCounts)) {
      // Derive resource type from collection name (e.g. "Observations" → "Observation")
      let resourceType = collectionName.replace(/s$/, '');
      if (collectionName === 'RelatedPersons') resourceType = 'RelatedPerson';
      resourceTypesFound.add(resourceType);
    }

    for (const resourceType of resourceTypesFound) {
      const phiFields = Anonymizer.phi(resourceType);
      const fieldCount = Object.keys(phiFields).length;
      if (fieldCount > 0) {
        phiSummary[resourceType] = {
          fieldCount: fieldCount,
          fields: Object.entries(phiFields).map(function(entry) {
            return {
              path: entry[0],
              label: entry[1].label,
              action: entry[1].action,
              categories: Array.isArray(entry[1].category) ? entry[1].category : [entry[1].category]
            };
          })
        };
      }
    }

    // Build before/after preview of the Patient resource
    const patientClone = cloneDeep(patient);
    const previewResult = Anonymizer.anonymize([patientClone], { skipRereference: true });

    const sampleBefore = {
      name: get(patient, 'name'),
      address: get(patient, 'address'),
      birthDate: get(patient, 'birthDate'),
      telecom: get(patient, 'telecom'),
      identifier: get(patient, 'identifier') ? '[' + get(patient, 'identifier', []).length + ' identifiers]' : undefined,
      photo: get(patient, 'photo') ? '[' + get(patient, 'photo', []).length + ' photos]' : undefined
    };

    const anonymizedPatient = previewResult.resources[0];
    const sampleAfter = {
      name: get(anonymizedPatient, 'name'),
      address: get(anonymizedPatient, 'address'),
      birthDate: get(anonymizedPatient, 'birthDate'),
      telecom: get(anonymizedPatient, 'telecom'),
      identifier: get(anonymizedPatient, 'identifier'),
      photo: get(anonymizedPatient, 'photo')
    };

    log.debug('PHI scan complete', { resourceTypeCount: Object.keys(phiSummary).length });

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources,
      phiSummary: phiSummary,
      sampleBefore: sampleBefore,
      sampleAfter: sampleAfter,
      previewWarnings: previewResult.warnings
    };
  },

  /**
   * Execute anonymization: fetch all resources, run Anonymizer.anonymize(),
   * write back entire documents via updateAsync().
   */
  'adminTools.anonymizePatient.execute': async function(patientId, options) {
    check(patientId, String);
    check(options, Match.Optional(Object));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const allowAnonymization = get(Meteor, 'settings.private.allowPatientAnonymization', false);
    if (!allowAnonymization) {
      throw new Meteor.Error('feature-disabled', 'Patient anonymization is disabled. Set Meteor.settings.private.allowPatientAnonymization to true.');
    }

    options = options || {};

    const collections = global.Collections || Meteor.Collections || {};
    const Patients = collections['Patients'];

    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not registered');
    }

    const patient = await Patients.findOneAsync({ _id: patientId });
    if (!patient) {
      throw new Meteor.Error('patient-not-found', 'Patient not found with _id: ' + patientId);
    }

    const mongoId = get(patient, '_id');
    const fhirId = get(patient, 'id');
    const patientName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    log.phi('Beginning anonymization for patient', { mongoId, patientName }, { action: 'update' });

    // Step 1: Collect all resources in the patient compartment
    const allResources = [JSON.parse(JSON.stringify(patient))];

    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const docs = await collection.find(query).fetchAsync();
        for (let i = 0; i < docs.length; i++) {
          allResources.push(JSON.parse(JSON.stringify(docs[i])));
        }
      } catch (error) {
        log.warn('Error fetching collection', { collectionName, message: error.message });
      }
    }

    log.debug('Collected resources', { count: allResources.length });

    // Step 2: Run anonymization (but DO NOT re-reference; keep original _ids for write-back)
    const anonymizeOptions = {
      skipRereference: true,  // Keep original IDs so we can write back
      skipPixelate: get(options, 'skipPixelate', false),
      skipRemovePhi: get(options, 'skipRemovePhi', false),
      skipWarning: get(options, 'skipWarning', false)
    };

    const result = Anonymizer.anonymize(allResources, anonymizeOptions);

    log.debug('Anonymization complete', { warningCount: result.warnings.length });

    // Step 3: Write back modified resources
    let totalAnonymized = 0;
    const writeErrors = [];

    for (let i = 0; i < result.resources.length; i++) {
      const resource = result.resources[i];
      const resourceType = get(resource, 'resourceType', '');
      const resourceId = get(resource, '_id');

      if (!resourceType || !resourceId) {
        writeErrors.push('Resource at index ' + i + ' missing resourceType or _id');
        continue;
      }

      // Determine collection name
      let collectionName = resourceType + 's';
      if (resourceType === 'Person') collectionName = 'Persons';
      if (resourceType === 'FamilyMemberHistory') collectionName = 'FamilyMemberHistory';

      const collection = collections[collectionName];
      if (!collection || typeof collection.updateAsync !== 'function') {
        writeErrors.push('Collection not found for ' + resourceType + ' (' + collectionName + ')');
        continue;
      }

      try {
        const updateDoc = JSON.parse(JSON.stringify(resource));
        delete updateDoc._id;

        await collection.updateAsync({ _id: resourceId }, { $set: updateDoc });
        totalAnonymized++;
      } catch (error) {
        writeErrors.push(resourceType + '/' + resourceId + ': ' + error.message);
        log.error('Write error for resource', { resourceType, resourceId, message: error.message });
      }
    }

    // Step 4: Write AuditEvent
    try {
      const AuditEvents = collections['AuditEvents'];
      if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
        const auditEventId = Random.id();
        const auditEvent = {
          _id: auditEventId,
          id: auditEventId,
          resourceType: 'AuditEvent',
          type: {
            system: 'http://dicom.nema.org/resources/ontology/DCM',
            code: '110110',
            display: 'Patient Record'
          },
          subtype: [{
            system: 'http://hl7.org/fhir/restful-interaction',
            code: 'update',
            display: 'De-identify (Safe Harbor)'
          }],
          action: 'U',
          recorded: new Date().toISOString(),
          outcome: '0',
          agent: [{
            who: { reference: 'User/' + this.userId },
            requestor: true
          }],
          source: {
            observer: { display: 'Honeycomb Admin Tools - Anonymize' }
          },
          entity: [{
            what: {
              reference: 'Patient/' + (fhirId || mongoId),
              display: patientName + ' (anonymized)'
            },
            detail: [
              { type: 'method', valueString: 'HIPAA Safe Harbor' },
              { type: 'totalAnonymized', valueString: String(totalAnonymized) },
              { type: 'warningCount', valueString: String(result.warnings.length) },
              { type: 'errorCount', valueString: String(writeErrors.length) }
            ]
          }]
        };

        await AuditEvents.insertAsync(auditEvent);
        log.debug('AuditEvent recorded', { auditEventId });
      }
    } catch (auditError) {
      log.error('Failed to write AuditEvent (non-blocking)', { message: auditError.message });
    }

    log.debug('Anonymization complete', { totalAnonymized, errorCount: writeErrors.length });

    return {
      success: true,
      patientId: mongoId,
      patientName: patientName,
      totalAnonymized: totalAnonymized,
      warnings: result.warnings,
      writeErrors: writeErrors,
      removedFields: result.removedFields
    };
  }
});

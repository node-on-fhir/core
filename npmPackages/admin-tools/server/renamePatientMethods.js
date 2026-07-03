// packages/admin-tools/server/renamePatientMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';
import { PATIENT_COMPARTMENT_MAP, buildPatientQuery } from '../lib/PatientCompartmentMapper';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('renamePatientMethods') : console);

// Display reference paths where patient names appear in linked resources
const PATIENT_DISPLAY_PATHS = [
  'subject.display',
  'patient.display',
  'performer.0.display',
  'performer.0.actor.display',
  'participant.0.individual.display',
  'participant.0.actor.display',
  'author.0.display',
  'requester.display',
  'recorder.display',
  'asserter.display',
  'informant.0.display',
  'encounter.display',
  'custodian.display'
];

Meteor.methods({
  /**
   * Search for patients by name, MRN, or _id
   * Returns up to 10 flattened results for display
   */
  'adminTools.renamePatient.search': async function(searchTerm) {
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

    log.phi('adminTools.renamePatient.search Searching for', { searchTerm: trimmed }, { action: 'search' });

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

    log.debug('adminTools.renamePatient.search Found ' + results.length + ' patients');
    return results;
  },

  /**
   * Dry-run: counts all linked resources that will have display names updated
   */
  'adminTools.renamePatient.dryRun': async function(patientId) {
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const allowRename = get(Meteor, 'settings.private.allowPatientRename', false);
    if (!allowRename) {
      throw new Meteor.Error('feature-disabled', 'Patient renaming is disabled. Set Meteor.settings.private.allowPatientRename to true.');
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

    log.phi('adminTools.renamePatient.dryRun Scanning linked resources for patient', { patientId: mongoId, name: patientName }, { action: 'search' });

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
          log.debug('adminTools.renamePatient.dryRun ' + collectionName + ': ' + count);
        }
      } catch (error) {
        log.warn('adminTools.renamePatient.dryRun Error counting ' + collectionName + ':', error.message);
      }
    }

    log.debug('adminTools.renamePatient.dryRun Total linked resources: ' + totalLinkedResources);

    return {
      patientId: mongoId,
      fhirId: fhirId,
      patientName: patientName,
      currentGivenName: get(patient, 'name.0.given.0', ''),
      currentFamilyName: get(patient, 'name.0.family', ''),
      resourceCounts: resourceCounts,
      totalLinkedResources: totalLinkedResources
    };
  },

  /**
   * Execute rename: updates patient name and all display references in linked resources
   */
  'adminTools.renamePatient.execute': async function(patientId, newName) {
    check(patientId, String);
    check(newName, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }

    const allowRename = get(Meteor, 'settings.private.allowPatientRename', false);
    if (!allowRename) {
      throw new Meteor.Error('feature-disabled', 'Patient renaming is disabled. Set Meteor.settings.private.allowPatientRename to true.');
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
    const oldName = get(patient, 'name.0.text',
      (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
    );

    const newGiven = get(newName, 'given', '').trim();
    const newFamily = get(newName, 'family', '').trim();
    const newFullName = newGiven + ' ' + newFamily;

    if (!newGiven && !newFamily) {
      throw new Meteor.Error('invalid-name', 'At least one of given name or family name must be provided');
    }

    log.phi('adminTools.renamePatient.execute Renaming patient', { patientId: mongoId, oldName, newName: newFullName }, { action: 'update' });

    let totalUpdated = 0;

    // Step 1: Update the Patient resource
    const nameUpdates = {};
    const names = get(patient, 'name', [{}]);
    const updatedNames = names.map(function(nameEntry) {
      const updated = Object.assign({}, nameEntry);
      if (newFamily) updated.family = newFamily;
      if (newGiven) updated.given = [newGiven];
      updated.text = newFullName;
      return updated;
    });

    await Patients.updateAsync({ _id: mongoId }, { $set: { name: updatedNames } });
    totalUpdated++;
    console.log('[adminTools.renamePatient.execute]   Updated Patient record'); // phi-audit: ok

    // Step 2: Update display references on all linked resources
    for (const [collectionName, refField] of Object.entries(PATIENT_COMPARTMENT_MAP)) {
      const collection = collections[collectionName];
      if (!collection || typeof collection.find !== 'function') {
        continue;
      }

      try {
        const query = buildPatientQuery(refField, mongoId, fhirId);
        const docs = await collection.find(query).fetchAsync();

        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          const updates = {};
          let hasUpdates = false;

          for (let d = 0; d < PATIENT_DISPLAY_PATHS.length; d++) {
            const displayPath = PATIENT_DISPLAY_PATHS[d];
            if (get(doc, displayPath)) {
              updates[displayPath] = newFullName;
              hasUpdates = true;
            }
          }

          if (hasUpdates) {
            await collection.updateAsync({ _id: doc._id }, { $set: updates });
            totalUpdated++;
          }
        }
      } catch (error) {
        log.warn('adminTools.renamePatient.execute Error updating ' + collectionName + ':', error.message);
      }
    }

    // Step 3: Write AuditEvent
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
            display: 'Rename Patient'
          }],
          action: 'U',
          recorded: new Date().toISOString(),
          outcome: '0',
          agent: [{
            who: { reference: 'User/' + this.userId },
            requestor: true
          }],
          source: {
            observer: { display: 'Honeycomb Admin Tools - Rename' }
          },
          entity: [{
            what: {
              reference: 'Patient/' + (fhirId || mongoId),
              display: newFullName
            },
            detail: [
              { type: 'oldName', valueString: oldName },
              { type: 'newName', valueString: newFullName },
              { type: 'totalUpdated', valueString: String(totalUpdated) }
            ]
          }]
        };

        await AuditEvents.insertAsync(auditEvent);
        log.debug('adminTools.renamePatient.execute AuditEvent recorded', { auditEventId });
      }
    } catch (auditError) {
      console.error('[adminTools.renamePatient.execute] Failed to write AuditEvent (non-blocking):', auditError.message); // phi-audit: ok
    }

    log.debug('adminTools.renamePatient.execute Rename complete. Total updated: ' + totalUpdated);

    return {
      success: true,
      patientId: mongoId,
      oldName: oldName,
      newName: newFullName,
      totalUpdated: totalUpdated
    };
  }
});

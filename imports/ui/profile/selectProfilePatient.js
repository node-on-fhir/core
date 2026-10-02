// imports/ui/profile/selectProfilePatient.js
//
// Ensures the profile owner's linked patient record is the app-wide selected
// patient before an empty-state add item or quick action hands off to a
// patient-scoped page. Sets the full Session contract (selectedPatient +
// selectedPatientId + selectedPatientMongoId) so destination pages don't
// land on "No patient selected".

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { SELECTED_PATIENT, SELECTED_PATIENT_ID, SELECTED_PATIENT_MONGO_ID } from '/imports/lib/SessionKeys.js';

const log = (Meteor.Logger ? Meteor.Logger.for('MyProfilePage') : console);

export function ensureProfilePatientSelected(patientId) {
  if (!patientId) {
    log.debug('ensureProfilePatientSelected - no linked patientId, nothing to select');
    return;
  }

  // users.patientId may hold either the Mongo _id or the FHIR id; try the
  // primary key first, then the FHIR id (sequential fallback, never $or —
  // see anti-patterns/id-lookup.md).
  let patient = Patients.findOne({ _id: patientId });
  if (!patient) {
    patient = Patients.findOne({ id: patientId });
  }

  const fhirId = get(patient, 'id', patientId);
  if (Session.get(SELECTED_PATIENT_ID) === fhirId && Session.get(SELECTED_PATIENT)) {
    log.debug('ensureProfilePatientSelected - profile patient already selected', { fhirId });
    return;
  }

  if (patient) {
    Session.set(SELECTED_PATIENT, patient);
    Session.set(SELECTED_PATIENT_MONGO_ID, get(patient, '_id'));
    log.info('ensureProfilePatientSelected - selected profile patient', { fhirId });
  } else {
    // Subscription not ready — set the id so patient-scoped subscriptions
    // still filter correctly; the object catches up when the record arrives.
    log.warn('ensureProfilePatientSelected - patient record not in minimongo yet', { patientId });
  }
  Session.set(SELECTED_PATIENT_ID, fhirId);
}

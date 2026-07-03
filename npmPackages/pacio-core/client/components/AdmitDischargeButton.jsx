// npmPackages/pacio-core/client/components/AdmitDischargeButton.jsx
//
// Bed-aware Admit/Discharge action for the /patient-directory expanded row.
//
// Admit and Discharge are mutually exclusive and driven by bed status: a patient
// assigned to an occupied bed (on /pacio-exam-room) is effectively *admitted*, so
// we show Discharge; otherwise we show Admit. The host PatientsTable renders this
// component via the `Component` escape hatch in PatientsDirectoryButtons and passes
// { patientId, patient, navigate }.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { Button } from '@mui/material';
import {
  LocalHospital as AdmitIcon,
  ExitToApp as DischargeIcon
} from '@mui/icons-material';

import { Beds } from '../../lib/collections/BedsCollection';

const log = (Meteor.Logger ? Meteor.Logger.for('AdmitDischargeButton') : console);

export function AdmitDischargeButton({ patientId, patient, navigate }) {
  // Normalize the patient id to a string — Beds.patientId is stored as a string
  // (pacio.assignPatientToBed converts the ObjectID), and patientId here is the
  // patient's mongo _id which may arrive as an ObjectID.
  const patientIdString = (patientId && typeof patientId === 'object')
    ? (patientId._str || patientId.toHexString?.() || String(patientId))
    : String(patientId || '');

  // Reactively determine whether this patient currently occupies a bed.
  const { isAdmitted, bed } = useTracker(function() {
    Meteor.subscribe('pacio.beds', { status: 'occupied' });
    const occupiedBed = patientIdString
      ? Beds.findOne({ patientId: patientIdString, status: 'occupied' })
      : null;
    return {
      isAdmitted: !!occupiedBed,
      bed: occupiedBed
    };
  }, [patientIdString]);

  // Inpatient-mode flag lives server-side in Meteor.settings.private and is read
  // via a Meteor method. We fetch it here to lay the groundwork for future
  // inpatient logic, but — per the current decision — we do NOT gate button
  // visibility on it yet; bed status alone decides Admit vs Discharge.
  const [inpatientMode, setInpatientMode] = useState(null); // null = loading
  useEffect(function() {
    Meteor.call('pacio.getInpatientMode', function(error, result) {
      if (error) {
        log.warn('AdmitDischargeButton getInpatientMode error', { reason: error.reason });
        setInpatientMode(false);
      } else {
        setInpatientMode(!!result);
      }
    });
  }, []);

  // TODO(inpatient-mode): once richer inpatient logic is built, branch the button
  // set on `inpatientMode` (e.g. outpatient facilities may surface a different
  // admit/discharge flow, or hide it entirely). For now `inpatientMode` is read
  // but intentionally unused for rendering.

  if (isAdmitted) {
    return (
      <Button
        key="discharge-patient"
        variant="outlined"
        size="small"
        color="warning"
        startIcon={<DischargeIcon />}
        onClick={function(e) {
          e.stopPropagation();
          log.debug('Discharge patient', { patientId: patientIdString, bedId: bed && bed._id });
          // Carry patient context to the exam room (single-bed monitor view) so it
          // knows the subject, then navigate there to handle the discharge.
          Session.set('selectedPatient', patient);
          Session.set('selectedPatientId', get(patient, 'id'));        // FHIR id (per session-keys rule)
          Session.set('selectedPatientMongoId', get(patient, '_id'));  // mongo _id
          if (navigate) {
            navigate('/pacio-exam-room');
          }
          // TODO: wire to pacio.releaseBed(bed._id) once the discharge workflow
          // (confirmation, encounter close-out, disposition) is built. The bed is
          // in scope here from the reactive lookup above.
        }}
      >
        Discharge
      </Button>
    );
  }

  return (
    <Button
      key="admit-patient"
      variant="outlined"
      size="small"
      color="success"
      startIcon={<AdmitIcon />}
      onClick={function(e) {
        e.stopPropagation();
        log.debug('Admit patient', { patientId: patientIdString });
        // Carry patient context so the exam room knows the subject, then navigate
        // there to complete admission (assign a bed via "Assign Patient").
        Session.set('selectedPatient', patient);
        Session.set('selectedPatientId', get(patient, 'id'));        // FHIR id (per session-keys rule)
        Session.set('selectedPatientMongoId', get(patient, '_id'));  // mongo _id
        if (navigate) {
          navigate('/pacio-exam-room');
        }
        // TODO: a dedicated admit flow (orders, encounter, bed selection) may live here later.
      }}
    >
      Admit
    </Button>
  );
}

export default AdmitDischargeButton;

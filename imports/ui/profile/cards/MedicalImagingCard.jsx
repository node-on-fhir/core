// imports/ui/profile/cards/MedicalImagingCard.jsx
//
// Medical imaging census for the linked patient. Subscribes to
// selectedPatient.ImagingStudies; collapses to the "Add medical imaging"
// add-row when empty (this card owns the imaging on-ramp). Filled state
// shows study count + recent studies and a
// Review button into the DICOM management workstation; it deliberately does
// NOT render the images themselves (there can be many).

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ScannerIcon from '@mui/icons-material/Scanner';
import ImageIcon from '@mui/icons-material/Image';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

const MAX_STUDY_ROWS = 5;

export default function MedicalImagingCard({ patientId, onImagingChange }) {
  const navigate = useNavigate();

  // Self-sufficient on Meteor.user().patientId — no Session dependence.
  // users.patientId may hold the Mongo _id or the FHIR id, while studies
  // reference the FHIR id (and the publication trusts the client id verbatim
  // for non-patient roles), so: load the patient record, resolve its FHIR id
  // (sequential lookup, never $or — see anti-patterns/id-lookup.md), and
  // subscribe to studies with THAT. The tracker re-runs when the patient
  // record arrives, upgrading the subscription from the raw id.
  const studies = useTracker(function() {
    if (!patientId) { return []; }
    Meteor.subscribe('patients.byId', patientId);

    let patient = Patients.findOne({ _id: patientId });
    if (!patient) {
      patient = Patients.findOne({ id: patientId });
    }
    const fhirId = get(patient, 'id') || patientId;
    Meteor.subscribe('selectedPatient.ImagingStudies', fhirId, { limit: 100 });

    // Match references against every known alias of this one patient
    const referenceIds = [patientId];
    if (fhirId && referenceIds.indexOf(fhirId) === -1) {
      referenceIds.push(fhirId);
    }

    return ImagingStudies.find({
      $or: referenceIds.map(function(refId) {
        return { 'subject.reference': { $regex: refId } };
      })
    }, { sort: { started: -1 } }).fetch();
  }, [patientId]);

  React.useEffect(function() {
    if (onImagingChange) { onImagingChange(studies); }
  }, [studies.length]);

  const goToStudies = function() {
    ensureProfilePatientSelected(patientId);
    navigate('/dicom/studies?tab=studies');
  };

  if (!studies.length) {
    return (
      <AddRow
        id="medicalImagingAddRow"
        icon={<ScannerIcon />}
        label="Add medical imaging"
        onClick={function() {
          ensureProfilePatientSelected(patientId);
          navigate('/dicom/upload');
        }}
      />
    );
  }

  const totalImages = studies.reduce(function(sum, study) {
    return sum + (get(study, 'numberOfInstances', 0) || 0);
  }, 0);
  const visibleStudies = studies.slice(0, MAX_STUDY_ROWS);
  const hiddenCount = studies.length - visibleStudies.length;

  return (
    <Box className="pf-card" id="medicalImagingCard">
      <ProfileCardHeader
        icon={<ScannerIcon />}
        title="Medical imaging"
        kicker={`${studies.length} stud${studies.length !== 1 ? 'ies' : 'y'} · ${totalImages} image${totalImages !== 1 ? 's' : ''}`}
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        {visibleStudies.map(function(study) {
          const modality = get(study, 'series.0.modality.code')
            || get(study, 'series.0.modality.coding.0.code', 'OT');
          const description = get(study, 'description', 'Imaging study');
          const started = get(study, 'started');
          const seriesCount = get(study, 'numberOfSeries', 0) || 0;
          const imageCount = get(study, 'numberOfInstances', 0) || 0;

          return (
            <Box
              key={study._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: '22px minmax(0, 1fr) 110px 110px 90px',
                alignItems: 'center',
                gap: 1,
                p: '9px 14px'
              }}
            >
              <ImageIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {description}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {seriesCount} series · {imageCount} image{imageCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <NeutralChip label={modality} />
              </Box>
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>
                {started ? moment(started).format('MMM D, YYYY') : ''}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={goToStudies}
                sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
              >
                Review
              </Button>
            </Box>
          );
        })}
        {hiddenCount > 0 && (
          <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', p: '4px 14px' }}>
            + {hiddenCount} more stud{hiddenCount !== 1 ? 'ies' : 'y'} — Review to see all
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// imports/ui/profile/cards/SocialMediaCard.jsx
//
// Social-media census for the linked patient: ClinicalImpressions imported
// from social exports (currently the facebook-parser pipeline, recognized by
// its meta.tag source code). Collapses to the "Social media" add-row when
// empty (this card owns the social on-ramp). Filled
// state shows the post count + date span and a Review button into the
// timeline; individual posts are not rendered here (there can be hundreds).
//
// Self-sufficient on Meteor.user().patientId — no Session dependence (same
// pattern as MedicalImagingCard).

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

// Source tag codes that mark an impression as social-media-derived
// (FACEBOOK_SOURCE_TAG in the facebook-parser extension; inlined here because
// core code can't import from gitignored extensions/)
const SOCIAL_SOURCE_TAG_CODES = ['facebook-import'];

export default function SocialMediaCard({ patientId, onSocialChange }) {
  const navigate = useNavigate();

  const impressions = useTracker(function() {
    if (!patientId) { return []; }
    Meteor.subscribe('patients.byId', patientId);

    // users.patientId may hold the Mongo _id or the FHIR id; resources
    // reference the FHIR id, so resolve the record (sequential lookup, never
    // $or — see anti-patterns/id-lookup.md) and subscribe with THAT.
    let patient = Patients.findOne({ _id: patientId });
    if (!patient) {
      patient = Patients.findOne({ id: patientId });
    }
    const fhirId = get(patient, 'id') || patientId;
    Meteor.subscribe('selectedPatient.ClinicalImpressions', fhirId, { limit: 1000 });

    const referenceIds = [patientId];
    if (fhirId && referenceIds.indexOf(fhirId) === -1) {
      referenceIds.push(fhirId);
    }

    return ClinicalImpressions.find({
      'meta.tag.code': { $in: SOCIAL_SOURCE_TAG_CODES },
      $or: referenceIds.map(function(refId) {
        return { 'subject.reference': { $regex: refId } };
      })
    }, { sort: { date: -1 } }).fetch();
  }, [patientId]);

  React.useEffect(function() {
    if (onSocialChange) { onSocialChange(impressions); }
  }, [impressions.length]);

  const goToTimeline = function() {
    ensureProfilePatientSelected(patientId);
    navigate('/facebook-timeline?type=ClinicalImpression');
  };

  const goToImport = function() {
    ensureProfilePatientSelected(patientId);
    navigate('/facebook-import');
  };

  if (!impressions.length) {
    return (
      <AddRow
        id="socialMediaAddRow"
        icon={<ForumIcon />}
        label="Social media — none yet"
        onClick={goToImport}
      />
    );
  }

  const newest = get(impressions[0], 'date');
  const oldest = get(impressions[impressions.length - 1], 'date');
  const span = (newest && oldest)
    ? moment(oldest).format('MMM YYYY') + ' – ' + moment(newest).format('MMM YYYY')
    : '';

  return (
    <Box className="pf-card" id="socialMediaCard">
      <ProfileCardHeader
        icon={<ForumIcon />}
        title="Social media"
        kicker={`${impressions.length} post${impressions.length !== 1 ? 's' : ''}`}
        action={
          <Button
            size="small"
            id="importMoreSocialButton"
            onClick={goToImport}
            startIcon={<AddIcon sx={{ fontSize: 13 }} />}
            sx={{ fontSize: 11, p: '2px 8px', minWidth: 0, borderRadius: '8px', color: 'var(--pf-ink-mid)', '& .MuiButton-startIcon': { mr: 0.5 } }}
          >
            Add
          </Button>
        }
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        <Box
          className="pf-row"
          sx={{
            display: 'grid',
            gridTemplateColumns: '22px minmax(0, 1fr) 110px 90px',
            alignItems: 'center',
            gap: 1,
            p: '9px 14px'
          }}
        >
          <ForumIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Imported posts as self-reported impressions
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {span}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <NeutralChip label="Facebook" />
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={goToTimeline}
            sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
          >
            Review
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

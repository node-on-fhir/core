// imports/ui/profile/cards/ConsentCard.jsx
//
// Consent records for the linked patient. Subscribes to
// selectedPatient.Consents; collapses to a single add-row when empty.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

export default function ConsentCard({ patientId, onConsentsChange }) {
  const navigate = useNavigate();

  const consents = useTracker(function() {
    if (!patientId) { return []; }
    Meteor.subscribe('selectedPatient.Consents', patientId, { limit: 100 });
    return Consents.find({
      $or: [
        { 'patient.reference': { $regex: patientId } },
        { 'subject.reference': { $regex: patientId } }
      ]
    }).fetch();
  }, [patientId]);

  React.useEffect(function() {
    if (onConsentsChange) { onConsentsChange(consents); }
  }, [consents.length]);

  if (!consents.length) {
    return (
      <AddRow
        id="consentAddRow"
        icon={<VolunteerActivismIcon />}
        label="Consent records — none yet"
        onClick={function() {
          ensureProfilePatientSelected(patientId);
          navigate('/advance-directives');
        }}
      />
    );
  }

  const activeCount = consents.filter(function(c) { return get(c, 'status') === 'active'; }).length;
  const pendingCount = consents.filter(function(c) { return ['proposed', 'draft'].includes(get(c, 'status')); }).length;

  return (
    <Box className="pf-card" id="consentCard">
      <ProfileCardHeader
        icon={<VolunteerActivismIcon />}
        title="Consent"
        kicker={`${activeCount} active · ${pendingCount} pending`}
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        {consents.map(function(consent) {
          const isActive = get(consent, 'status') === 'active';
          const title = get(consent, 'provision.purpose[0].display')
            || get(consent, 'category[0].text')
            || get(consent, 'category[0].coding[0].display')
            || get(consent, 'scope.text')
            || get(consent, 'scope.coding[0].display', 'Consent');
          const org = get(consent, 'organization[0].display')
            || get(consent, 'performer[0].display', '');
          const purpose = get(consent, 'provision.purpose[0].code', '');
          const until = get(consent, 'provision.period.end');
          const scopes = (get(consent, 'provision.class', []) || [])
            .map(function(cls) { return get(cls, 'display') || get(cls, 'code'); })
            .filter(Boolean)
            .slice(0, 3);

          return (
            <Box
              key={consent._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: '22px minmax(0, 1fr) minmax(0, 1fr) 110px 90px',
                alignItems: 'center',
                gap: 1,
                p: '9px 14px'
              }}
            >
              {isActive
                ? <CheckCircleIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
                : <PauseCircleOutlineIcon sx={{ fontSize: 16, color: 'var(--pf-ink-dim)' }} />}
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {title}
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[org, purpose].filter(Boolean).join(' · ') || get(consent, 'status', '')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {scopes.map(function(scope) { return <NeutralChip key={scope} label={scope} />; })}
              </Box>
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>
                {until ? `until ${moment(until).format('MMM D, YYYY')}` : ''}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={function() {
                  ensureProfilePatientSelected(patientId);
                  navigate('/advance-directives');
                }}
                sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
              >
                Review
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

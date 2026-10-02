// imports/ui/profile/cards/CareCircleCard.jsx
//
// Care circle (CareTeams) for the linked patient. Subscribes to
// selectedPatient.CareTeams; collapses to a single add-row when empty
// (same pattern as ConsentCard).

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

// Lazy Package check (never module scope — sibling workflows register into
// Package after this module loads).
function careCirclesInstalled() {
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
  return Boolean(registry && registry['@orbital/care-circles']);
}

export default function CareCircleCard({ patientId, onCareTeamsChange }) {
  const navigate = useNavigate();

  // The care-circles extension ships the richer /care-team-management
  // workstation (requirePatient — selection below keeps its guard happy);
  // the core CareTeam detail page is the packageless fallback.
  function navigateToReview(team) {
    ensureProfilePatientSelected(patientId);
    if (careCirclesInstalled()) {
      navigate('/care-team-management');
    } else {
      navigate('/care-teams/' + team._id);
    }
  }

  const careTeams = useTracker(function() {
    if (!patientId) { return []; }
    Meteor.subscribe('selectedPatient.CareTeams', patientId, { limit: 100 });
    return CareTeams.find({
      'subject.reference': { $regex: patientId }
    }).fetch();
  }, [patientId]);

  React.useEffect(function() {
    if (onCareTeamsChange) { onCareTeamsChange(careTeams); }
  }, [careTeams.length]);

  if (!careTeams.length) {
    return (
      <AddRow
        id="careCircleAddRow"
        icon={<GroupsIcon />}
        label="Care circle — none yet"
        onClick={function() {
          ensureProfilePatientSelected(patientId);
          navigate('/care-teams/new');
        }}
      />
    );
  }

  const activeCount = careTeams.filter(function(team) { return get(team, 'status') === 'active'; }).length;

  return (
    <Box className="pf-card" id="careCircleCard">
      <ProfileCardHeader
        icon={<GroupsIcon />}
        title="Care circle"
        kicker={`${activeCount} active · ${careTeams.length} total`}
      />
      <Box sx={{ pt: 0.5, pb: 1 }}>
        {careTeams.map(function(team) {
          const isActive = get(team, 'status') === 'active';
          const title = get(team, 'name')
            || get(team, 'category[0].text')
            || get(team, 'category[0].coding[0].display', 'Care team');
          const participants = (get(team, 'participant', []) || [])
            .map(function(participant) {
              return get(participant, 'member.display') || get(participant, 'role[0].text');
            })
            .filter(Boolean);

          return (
            <Box
              key={team._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: '22px minmax(0, 1fr) minmax(0, 1fr) 90px',
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
                  {`${participants.length} member${participants.length === 1 ? '' : 's'}`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {participants.slice(0, 3).map(function(name) {
                  return <NeutralChip key={name} label={name} />;
                })}
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={function() { navigateToReview(team); }}
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

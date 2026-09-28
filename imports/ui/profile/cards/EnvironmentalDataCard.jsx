// imports/ui/profile/cards/EnvironmentalDataCard.jsx
//
// Environmental-data on-ramp for the linked patient, backed by the
// @orbital/greenhouses extension's Ambient Weather integration. Renders
// nothing when the extension isn't installed (Package check at render time —
// module-scope checks miss sibling workflows). When installed, asks the
// server whether Ambient Weather credentials are configured
// (settings.private.ambientWeather.apiKey — private settings never reach the
// client, so this rides the extension's ambientWeather.isConfigured method):
// configured shows the active card with a Review button into /ambient-weather;
// otherwise the dashed add-row empty state (graduated from DataOnrampsCard —
// same promotion pattern as MedicalImagingCard / SocialMediaCard).

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

import { ProfileCardHeader, AddRow, NeutralChip } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

const GREENHOUSES_PACKAGE = '@orbital/greenhouses';

export default function EnvironmentalDataCard({ patientId }) {
  const navigate = useNavigate();

  // Render-time check — the client workflow loader registers packages into
  // globalThis.Package before any component renders.
  const greenhousesInstalled = Boolean(globalThis.Package && globalThis.Package[GREENHOUSES_PACKAGE]);

  // Tri-state: null = check in flight, true/false = server answer
  const [apiKeyConfigured, setApiKeyConfigured] = useState(null);

  useEffect(function() {
    if (!greenhousesInstalled) { return; }
    let cancelled = false;
    Meteor.rpc('ambientWeather.isConfigured').then(function(result) {
      if (!cancelled) { setApiKeyConfigured(get(result, 'hasApiKey', false)); }
    }).catch(function(error) {
      console.warn('[EnvironmentalDataCard] ambientWeather.isConfigured failed:', error.reason || error.message);
      if (!cancelled) { setApiKeyConfigured(false); }
    });
    return function() { cancelled = true; };
  }, [greenhousesInstalled]);

  if (!greenhousesInstalled) {
    return null;
  }

  const goToAmbientWeather = function() {
    ensureProfilePatientSelected(patientId);
    navigate('/ambient-weather');
  };

  if (apiKeyConfigured !== true) {
    return (
      <AddRow
        id="environmentalDataAddRow"
        icon={<CloudIcon />}
        label="Environmental data — none yet"
        onClick={goToAmbientWeather}
      />
    );
  }

  return (
    <Box className="pf-card" id="environmentalDataCard">
      <ProfileCardHeader
        icon={<CloudIcon />}
        title="Environmental data"
        kicker="connected"
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
          <CloudIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Ambient Weather station feed
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              API credentials configured
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <NeutralChip label="Ambient Weather" />
          </Box>
          <Button
            size="small"
            variant="outlined"
            id="environmentalDataReviewButton"
            onClick={goToAmbientWeather}
            sx={{ fontSize: 11, p: '3px 8px', borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
          >
            Review
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

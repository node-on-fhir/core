// npmPackages/quality-measures/client/components/CareGapsPanel.jsx
//
// Preventive Care Gaps card (PHR IG "Gaps in Care Reporting") — the
// guideline-interval complement to the CQL measures on this page. Reads the
// selected patient from Session, asks qualityMeasures.findCareGaps for the
// evaluated screenings, and lists each applicable guideline with its status.
// Self-contained: safe to mount anywhere a patient may or may not be selected.

import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, Box, Typography, Chip, Alert, CircularProgress
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';

const log = (Meteor.Logger ? Meteor.Logger.for('quality-measures') : console);

function statusChip(entry) {
  if (entry.status === 'never_performed') {
    return <Chip size="small" color="error" label="Never performed" />;
  }
  if (entry.status === 'overdue') {
    return (
      <Chip
        size="small"
        color="warning"
        label={'Overdue ' + entry.daysOverdue + 'd'}
      />
    );
  }
  return <Chip size="small" color="success" variant="outlined" label="Current" />;
}

export function CareGapsPanel() {
  const selectedPatient = useTracker(function() { return Session.get('selectedPatient'); }, []);
  const selectedPatientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);

  // Tri-state: null = loading (or idle), object = result, false = error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const patientId = get(selectedPatient, '_id') || selectedPatientId;

  useEffect(function() {
    let cancelled = false;
    setResult(null);
    setErrorMessage(null);
    if (!patientId) { return undefined; }

    Meteor.rpc('qualityMeasures.findCareGaps', { patientId: patientId })
      .then(function(response) {
        if (!cancelled) { setResult(response); }
      })
      .catch(function(error) {
        log.warn('findCareGaps failed', { error: error.reason || error.message });
        if (!cancelled) { setErrorMessage(error.reason || error.message || 'Care-gap evaluation failed'); }
      });
    return function() { cancelled = true; };
  }, [patientId]);

  return (
    <Card id="careGapsPanel">
      <CardHeader
        avatar={<EventAvailableIcon color="primary" />}
        title="Preventive Care Gaps"
        subheader="Guideline-interval screenings (age/sex-based), independent of CQL bundles"
      />
      <CardContent sx={{ pt: 0 }}>
        {!patientId && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select a patient to evaluate preventive screenings.
          </Typography>
        )}
        {patientId && errorMessage && (
          <Alert severity="warning">{errorMessage}</Alert>
        )}
        {patientId && !errorMessage && !result && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {patientId && result && get(result, 'screenings', []).length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No screening guidelines apply to this patient (age/sex gates).
          </Typography>
        )}
        {patientId && result && get(result, 'screenings', []).map(function(entry) {
          return (
            <Box
              key={entry.key}
              id={'careGap-' + entry.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                py: '6px',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 'none' }
              }}
            >
              <Box>
                <Typography variant="body2">{entry.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {entry.lastDate
                    ? 'Last: ' + moment(entry.lastDate).format('MMM D, YYYY')
                      + ' · every ' + entry.intervalYears + 'y'
                    : 'No record on file · every ' + entry.intervalYears + 'y'}
                </Typography>
              </Box>
              {statusChip(entry)}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default CareGapsPanel;

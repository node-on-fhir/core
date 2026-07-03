// npmPackages/pacio-core/client/components/InpatientModeConfig.jsx
//
// ServerConfiguration panel tab content for pacio-core. Displays and toggles the
// facility "inpatient mode" flag. The value is server-side
// (Meteor.settings.private.pacio.inpatientMode) and is read/written exclusively
// through Meteor methods (pacio.getInpatientMode / pacio.setInpatientMode).

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Switch,
  FormControlLabel,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import { LocalHospital as InpatientIcon } from '@mui/icons-material';

const log = (Meteor.Logger ? Meteor.Logger.for('InpatientModeConfig') : console);

export function InpatientModeConfig() {
  // Tri-state: null = loading, true/false = known value.
  const [inpatientMode, setInpatientMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(function() {
    Meteor.call('pacio.getInpatientMode', function(err, result) {
      if (err) {
        log.warn('InpatientModeConfig getInpatientMode error', { reason: err.reason });
        setError(err.reason || 'Failed to load inpatient mode.');
        setInpatientMode(false);
      } else {
        setInpatientMode(!!result);
      }
    });
  }, []);

  function handleToggle(event) {
    const next = event.target.checked;
    setSaving(true);
    setError('');
    Meteor.call('pacio.setInpatientMode', next, function(err, result) {
      setSaving(false);
      if (err) {
        log.error('InpatientModeConfig setInpatientMode error', { reason: err.reason });
        setError(err.reason || 'Failed to update inpatient mode.');
      } else {
        // The setter echoes back the new value; fall back to the requested value.
        setInpatientMode(typeof result === 'boolean' ? result : next);
      }
    });
  }

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
      <CardHeader
        avatar={<InpatientIcon color="primary" />}
        title="Inpatient Mode"
        subheader="Facility operating mode (PACIO)"
      />
      <CardContent>
        {inpatientMode === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={!!inpatientMode}
                  onChange={handleToggle}
                  disabled={saving}
                />
              }
              label={inpatientMode ? 'Inpatient mode enabled' : 'Inpatient mode disabled'}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <AlertTitle>In-memory setting</AlertTitle>
              This toggle changes the in-memory
              <code> Meteor.settings.private.pacio.inpatientMode </code>
              on the server. It takes effect immediately but is <strong>not</strong> persisted
              to the settings file, so it resets to the file value on restart.
              {/* TODO(server-config-db): a future ServerConfiguration database collection
                  (a persisted log of MeteorSettings overrides) will make this durable. */}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default InpatientModeConfig;

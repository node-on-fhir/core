// npmPackages/pacio-core/client/components/ConnectathonDataConfig.jsx
//
// ServerConfiguration panel (renders under /server-configuration?tab=pacio-core).
// One-click seeding of the PACIO connectathon sample data via the idempotent
// pacio.loadConnectathonData method — patients (Betsy Smith-Johnson, Violet
// Gartner, Wilma Marina), the PROMIS-10 Questionnaire (which the
// /questionnaire-library and /survey routes resolve from the DB), the BSJ
// QuestionnaireResponse, ToC Composition, ADI DocumentReferences, and
// supporting encounters/conditions/observations.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Button,
  Typography,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import DatasetIcon from '@mui/icons-material/Storage';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

const log = (Meteor.Logger ? Meteor.Logger.for('ConnectathonDataConfig') : console);

export function ConnectathonDataConfig() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleLoadData() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await Meteor.rpc('pacio.loadConnectathonData');
      setLoading(false);
      log.info('loadConnectathonData complete', {
        loadedCount: res.loadedCount,
        errorCount: (res.errors || []).length
      });
      setResult(res);
    } catch (err) {
      setLoading(false);
      log.error('loadConnectathonData failed', { reason: err.reason || err.message });
      setError(err.reason || err.message || 'Failed to load connectathon data.');
    }
  }

  const skippedTypes = result ? Object.keys(result.skippedTypes || {}) : [];

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
      <CardHeader
        avatar={<DatasetIcon color="primary" />}
        title="Connectathon Sample Data"
        subheader="PACIO July 2026 — patients, questionnaires, documents"
      />
      <CardContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Seeds the PACIO sample data set: patient records for Betsy Smith-Johnson,
          Violet Gartner, and Wilma Marina; the PROMIS-10 Global Health Questionnaire
          (used by the Questionnaire Library and the /survey route) with Betsy&apos;s
          QuestionnaireResponse; her Transfer Summary Composition, advance-directive
          DocumentReferences, and supporting encounters, conditions, and observations.
        </Typography>

        <Button
          id="pacio-load-connectathon-data-btn"
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadIcon />}
          onClick={handleLoadData}
          disabled={loading}
        >
          {loading ? 'Loading Data…' : 'Load Connectathon Data'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <AlertTitle>Load Failed</AlertTitle>
            {error}
            {error === 'not-authorized' && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                Sign in first — loading sample data requires an authenticated user.
              </Box>
            )}
          </Alert>
        )}

        {result && (
          <Alert severity={(result.errors || []).length > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
            <AlertTitle>Connectathon Data Loaded</AlertTitle>
            Upserted {result.loadedCount} resources with {(result.errors || []).length} errors.
            {skippedTypes.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                Skipped types (no registered collection): {skippedTypes.join(', ')}
              </Box>
            )}
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          Safe to run repeatedly — resources are upserted by id, so re-running
          refreshes the sample set without creating duplicates.
        </Alert>
      </CardContent>
    </Card>
  );
}

export default ConnectathonDataConfig;

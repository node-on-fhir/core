// packages/pacio-core/client/pages/PfeDataExchangePage.jsx
//
// PFE data exchange page simulating HIE (Health Information Exchange).
// Export panel: select assessments and generate FHIR Bundle.
// Import panel: upload PFE Bundle JSON, parse and store.

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import moment from 'moment';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Divider
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

function PfeDataExchangePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportBundle, setExportBundle] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importJson, setImportJson] = useState('');
  const [error, setError] = useState(null);
  const [assessments, setAssessments] = useState([]);

  const patient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const patientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  // Load assessments for export selection
  useEffect(function() {
    if (!patientId) return;

    Meteor.call('pacio.pfeAssessment.getAssessments', patientId, function(err, result) {
      if (!err && result) {
        setAssessments(result);
      }
    });
  }, [patientId]);

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">
          No patient selected. Please select a patient from the sidebar.
        </Alert>
      </Container>
    );
  }

  function handleExport() {
    setExportLoading(true);
    setError(null);

    const assessmentIds = assessments.map(function(a) { return a._id; });

    Meteor.call('pacio.pfeExchange.exportBundle', patientId, assessmentIds, function(err, result) {
      setExportLoading(false);
      if (err) {
        setError('Export failed: ' + (err.reason || err.message));
      } else {
        setExportBundle(result);
        console.log('[PfeDataExchangePage] Export complete:', get(result, 'entry', []).length, 'entries');
      }
    });
  }

  function handleDownload() {
    if (!exportBundle) return;

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pfe-bundle-' + patientId + '-' + moment().format('YYYY-MM-DD') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    setImportLoading(true);
    setError(null);

    let bundleJson;
    try {
      bundleJson = JSON.parse(importJson);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      setImportLoading(false);
      return;
    }

    Meteor.call('pacio.pfeExchange.importBundle', bundleJson, function(err, result) {
      setImportLoading(false);
      if (err) {
        setError('Import failed: ' + (err.reason || err.message));
      } else {
        setImportResult(result);
        console.log('[PfeDataExchangePage] Import complete:', result);
      }
    });
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      setImportJson(e.target.result);
    };
    reader.readAsText(file);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <SwapHorizIcon color="primary" />
        <Typography variant="h5">
          PFE Data Exchange
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Simulate HIE data exchange for PFE assessment data. Export bundles to share with other facilities, or import bundles received from external systems.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(null); }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={function(e, v) { setActiveTab(v); }} sx={{ mb: 2 }}>
        <Tab label="Export" icon={<CloudDownloadIcon />} iconPosition="start" />
        <Tab label="Import" icon={<CloudUploadIcon />} iconPosition="start" />
      </Tabs>

      {/* Export Tab */}
      {activeTab === 0 && (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader title="Export PFE Bundle" />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate a FHIR transaction Bundle containing the patient record, QuestionnaireResponses, and derived Observations.
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Assessments to include ({assessments.length}):
            </Typography>

            {assessments.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No assessments found for this patient. Complete a PROMIS-10 assessment first.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Questionnaire</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assessments.map(function(qr) {
                      return (
                        <TableRow key={get(qr, '_id')}>
                          <TableCell>{get(qr, 'questionnaire', 'Unknown')}</TableCell>
                          <TableCell>{get(qr, 'authored') ? moment(qr.authored).format('YYYY-MM-DD') : '—'}</TableCell>
                          <TableCell>
                            <Chip label={get(qr, 'status', 'unknown')} size="small" color="success" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleExport}
                disabled={exportLoading || assessments.length === 0}
                startIcon={exportLoading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
              >
                Generate Bundle
              </Button>

              {exportBundle && (
                <Button
                  variant="outlined"
                  onClick={handleDownload}
                >
                  Download JSON ({get(exportBundle, 'entry', []).length} entries)
                </Button>
              )}
            </Box>

            {exportBundle && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Bundle Preview:</Typography>
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'background.default' }}>
                  <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(exportBundle, null, 2).substring(0, 3000)}
                    {JSON.stringify(exportBundle, null, 2).length > 3000 ? '\n... (truncated)' : ''}
                  </Typography>
                </Paper>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 1 && (
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardHeader title="Import PFE Bundle" />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a FHIR Bundle JSON file received from another facility. Resources will be parsed and stored.
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              Upload JSON File
              <input
                type="file"
                hidden
                accept=".json,application/json"
                onChange={handleFileUpload}
              />
            </Button>

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Or paste Bundle JSON"
              value={importJson}
              onChange={function(e) { setImportJson(e.target.value); }}
              sx={{ mb: 2, fontFamily: 'monospace' }}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />

            <Button
              variant="contained"
              onClick={handleImport}
              disabled={importLoading || !importJson}
              startIcon={importLoading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              Import Bundle
            </Button>

            {importResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Import complete: {importResult.importedCount} resources imported.
                {importResult.errors && importResult.errors.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Errors: {importResult.errors.join(', ')}
                  </Typography>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default PfeDataExchangePage;

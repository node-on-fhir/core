// packages/pacio-core/client/components/transitionOfCare/TocBundleImportDialog.jsx
//
// Import dialog for TOCBundle. Parse, preview, and store resources.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';

import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function TocBundleImportDialog(props) {
  const { open, onClose } = props;
  const [jsonInput, setJsonInput] = useState('');
  const [parsedBundle, setParsedBundle] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  function handleParse() {
    setParseError(null);
    setParsedBundle(null);

    try {
      const bundle = JSON.parse(jsonInput);
      if (get(bundle, 'resourceType') !== 'Bundle') {
        setParseError('Expected a FHIR Bundle resource (resourceType must be "Bundle").');
        return;
      }
      setParsedBundle(bundle);
      console.log('[TocBundleImportDialog] Parsed bundle with', get(bundle, 'entry', []).length, 'entries');
    } catch (e) {
      setParseError('Invalid JSON: ' + e.message);
    }
  }

  async function handleImport() {
    if (!parsedBundle) return;

    setImporting(true);
    try {
      const result = await Meteor.rpc('pacio.tocBundle.import', { bundleJson: parsedBundle });
      setImporting(false);
      setImportResult(result);
      console.log('[TocBundleImportDialog] Import result:', result);
    } catch (err) {
      setImporting(false);
      setParseError('Import failed: ' + (err.reason || err.message));
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      setJsonInput(e.target.result);
      setParsedBundle(null);
      setImportResult(null);
    };
    reader.readAsText(file);
  }

  function handleClose() {
    setJsonInput('');
    setParsedBundle(null);
    setParseError(null);
    setImportResult(null);
    onClose();
  }

  const entries = get(parsedBundle, 'entry', []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import TOC Bundle</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload or paste a FHIR Bundle JSON. Resources will be parsed and stored into the system.
        </Typography>

        {parseError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError}
          </Alert>
        )}

        {importResult && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            Import complete: {importResult.importedCount} resources imported.
            {importResult.errors && importResult.errors.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Errors: {importResult.errors.join('; ')}
              </Typography>
            )}
          </Alert>
        )}

        {!importResult && (
          <>
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
              rows={6}
              label="Or paste Bundle JSON"
              value={jsonInput}
              onChange={function(e) { setJsonInput(e.target.value); }}
              sx={{ mb: 2 }}
              InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />

            {!parsedBundle && (
              <Button
                variant="outlined"
                onClick={handleParse}
                disabled={!jsonInput}
              >
                Parse Bundle
              </Button>
            )}

            {parsedBundle && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Bundle Preview ({entries.length} entries):
                </Typography>
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <List dense>
                    {entries.map(function(entry, index) {
                      const resourceType = get(entry, 'resource.resourceType', 'Unknown');
                      const resourceId = get(entry, 'resource.id', get(entry, 'resource._id', ''));
                      return (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <DescriptionIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={resourceType + (resourceId ? ' / ' + resourceId : '')}
                          />
                          <Chip label={resourceType} size="small" variant="outlined" />
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {importResult ? 'Done' : 'Cancel'}
        </Button>
        {parsedBundle && !importResult && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={importing}
            startIcon={importing ? <CircularProgress size={18} /> : <CloudUploadIcon />}
          >
            Import {entries.length} Resources
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default TocBundleImportDialog;

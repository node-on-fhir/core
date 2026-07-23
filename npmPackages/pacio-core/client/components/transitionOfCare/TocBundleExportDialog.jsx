// packages/pacio-core/client/components/transitionOfCare/TocBundleExportDialog.jsx
//
// Export dialog for TOCBundle generation. Shows resource preview and download.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

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
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';

import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function TocBundleExportDialog(props) {
  const { open, onClose, compositionId, compositionTitle } = props;
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    if (!compositionId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await Meteor.rpc('pacio.tocBundle.generate', { compositionId: compositionId });
      setLoading(false);
      setBundle(result);
      console.log('[TocBundleExportDialog] Generated bundle with', get(result, 'entry', []).length, 'entries');
    } catch (err) {
      setLoading(false);
      setError('Bundle generation failed: ' + (err.reason || err.message));
    }
  }

  function handleDownload() {
    if (!bundle) return;

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toc-bundle-' + compositionId + '-' + moment().format('YYYY-MM-DD') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClose() {
    setBundle(null);
    setError(null);
    onClose();
  }

  const entries = get(bundle, 'entry', []);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Export TOC Bundle
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generate a FHIR document Bundle from the Composition and all referenced resources.
        </Typography>

        {compositionTitle && (
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Composition: {compositionTitle}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!bundle && !loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Click "Generate" to create the TOCBundle.
            </Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {bundle && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="subtitle2">
                Bundle generated: {entries.length} entries
              </Typography>
            </Box>

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
                      primary={resourceType}
                      secondary={resourceId}
                    />
                    <Chip label={resourceType} size="small" variant="outlined" />
                  </ListItem>
                );
              })}
            </List>

            <Divider sx={{ my: 1 }} />

            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'background.default' }}>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(bundle, null, 2).substring(0, 2000)}
                {JSON.stringify(bundle, null, 2).length > 2000 ? '\n... (truncated)' : ''}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {!bundle ? (
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || !compositionId}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            Generate
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleDownload}
            startIcon={<CloudDownloadIcon />}
          >
            Download JSON
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default TocBundleExportDialog;

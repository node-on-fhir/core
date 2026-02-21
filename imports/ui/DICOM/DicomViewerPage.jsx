// imports/ui/DICOM/DicomViewerPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams } from 'react-router-dom';
import { get } from 'lodash';

import { LayoutHelpers } from '/imports/lib/LayoutHelpers';

import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  Paper,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  Notes as NotesIcon,
  Send as SendIcon
} from '@mui/icons-material';
import SimpleDicomViewport from './components/SimpleDicomViewport';

// Hooks that need to be loaded at startup (React Router, theme)
let useAppTheme;
let useNavigate;
let useSearchParams;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
    useSearchParams = window.ReactRouter.useSearchParams;
  }
});

// Common radiology finding codes
const FINDING_OPTIONS = [
  { code: 'normal', display: 'No significant abnormality' },
  { code: 'mass', display: 'Mass/nodule identified' },
  { code: 'fracture', display: 'Fracture identified' },
  { code: 'consolidation', display: 'Pulmonary consolidation' },
  { code: 'effusion', display: 'Pleural effusion' },
  { code: 'calcification', display: 'Calcification' },
  { code: 'artifact', display: 'Motion artifact' },
  { code: 'other', display: 'Other finding' }
];

// Default radiology report template
const DEFAULT_REPORT_TEMPLATE = `EXAMINATION:

CLINICAL HISTORY:

TECHNIQUE:

COMPARISON: None available.

FINDINGS:


IMPRESSION:
`;

// Video viewport for ultrasound clips (multi-clip with prev/next navigation)
function VideoViewport({ videoUrls }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <Box>
      <video
        key={videoUrls[currentIndex]}
        controls
        autoPlay={false}
        src={videoUrls[currentIndex]}
        style={{ width: '100%', maxHeight: '600px', backgroundColor: '#000' }}
      />
      {videoUrls.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1 }}>
          <Button
            variant="outlined"
            disabled={currentIndex === 0}
            onClick={function() { setCurrentIndex(currentIndex - 1); }}
          >
            Previous
          </Button>
          <Typography variant="body2">
            {currentIndex + 1} / {videoUrls.length}
          </Typography>
          <Button
            variant="outlined"
            disabled={currentIndex >= videoUrls.length - 1}
            onClick={function() { setCurrentIndex(currentIndex + 1); }}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Reading panel content component for split-pane view
function ReadingPanelContent({
  study,
  findings,
  conclusion,
  setConclusion,
  onShowFindingDialog,
  submitting,
  onSignReport,
  cardTextColor
}) {
  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: 1,
      borderColor: 'divider',
      pl: 2
    }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: cardTextColor }}>
          {study?.description || 'Unknown Study'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Patient: {get(study, 'subject.display', 'Unknown')}
        </Typography>
      </Box>

      {/* Study Info */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
        <Typography variant="subtitle2" gutterBottom>Study Info</Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Modality</Typography>
            <Typography variant="body2">{get(study, 'modality.0.code', '-')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Started</Typography>
            <Typography variant="body2">
              {study?.started ? new Date(study.started).toLocaleString() : '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Series</Typography>
            <Typography variant="body2">{study?.numberOfSeries || 0}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Images</Typography>
            <Typography variant="body2">{study?.numberOfInstances || 0}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* Findings */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">
            Findings ({findings.length})
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={onShowFindingDialog}>
            Add
          </Button>
        </Box>
        {findings.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 1 }}>
            No findings added yet
          </Typography>
        ) : (
          <List dense disablePadding>
            {findings.map(function(finding, index) {
              return (
                <ListItem key={index} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {finding.code === 'normal' ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <WarningAmberIcon color="warning" fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2">{finding.display}</Typography>}
                    secondary={finding.note}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Impression */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <NotesIcon fontSize="small" /> Impression
        </Typography>
        <TextField
          placeholder="Enter your diagnostic impression..."
          value={conclusion}
          onChange={function(e) { setConclusion(e.target.value); }}
          multiline
          fullWidth
          size="small"
          sx={{
            flex: 1,
            mb: 2,
            '& .MuiInputBase-root': {
              height: '100%',
              alignItems: 'flex-start'
            },
            '& .MuiInputBase-input': {
              height: '100% !important',
              overflow: 'auto !important'
            }
          }}
        />
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={onSignReport}
          disabled={submitting || !conclusion.trim() || conclusion === DEFAULT_REPORT_TEMPLATE}
          startIcon={submitting ? <CircularProgress size={18} /> : <SendIcon />}
          sx={{ flexShrink: 0 }}
        >
          Sign Report
        </Button>
      </Box>
    </Box>
  );
}

function DicomViewerPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const { studyId } = useParams();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Get file query parameter for single-file viewing mode
  let fileIdFromQuery = null;
  if (useSearchParams) {
    const searchParamsResult = useSearchParams();
    const searchParams = searchParamsResult[0];
    fileIdFromQuery = searchParams.get('file');
  }

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';

  // Layout state (1 = single pane, 2 = split pane with reading panel)
  const [paneLayout, setPaneLayout] = useState(1);

  // Reading panel state
  const [findings, setFindings] = useState([]);
  const [newFinding, setNewFinding] = useState({ code: '', valueString: '' });
  const [conclusion, setConclusion] = useState(DEFAULT_REPORT_TEMPLATE);
  const [showFindingDialog, setShowFindingDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calculate canvas height using LayoutHelpers (accounts for prominentHeader)
  const [canvasHeight, setCanvasHeight] = useState(function() {
    return LayoutHelpers.calcInnerCanvasHeight();
  });

  useEffect(function() {
    function handleResize() {
      setCanvasHeight(LayoutHelpers.calcInnerCanvasHeight());
    }
    window.addEventListener('resize', handleResize);
    return function() {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch the ImagingStudy (only if studyId provided, not in single-file mode)
  const { study, loading } = useTracker(function() {
    console.log('[DicomViewerPage] useTracker running, studyId:', studyId, 'fileIdFromQuery:', fileIdFromQuery);

    // CRITICAL: Subscribe to ImagingStudies to receive data from server
    const studiesHandle = Meteor.subscribe('autopublish.ImagingStudies', {}, {});

    const ImagingStudies = Meteor.Collections?.ImagingStudies;

    if (!ImagingStudies) {
      console.warn('[DicomViewerPage] ImagingStudies collection not available');
      return { study: null, loading: true };
    }

    // Only fetch study if studyId provided (not single-file mode)
    let studyData = null;
    if (studyId) {
      studyData = ImagingStudies.findOne({ _id: studyId });
      console.log('[DicomViewerPage] Found study:', studyData ? 'yes' : 'no', studyData?._id);
    }

    return {
      study: studyData,
      loading: !studiesHandle.ready()
    };
  }, [studyId, fileIdFromQuery]);

  // Extract gridfsFileIds from ImagingStudy instances
  function getGridfsFileIdsFromStudy(studyData) {
    const fileIds = [];
    if (studyData && studyData.series) {
      for (let i = 0; i < studyData.series.length; i++) {
        const series = studyData.series[i];
        if (series.instance) {
          for (let j = 0; j < series.instance.length; j++) {
            const instance = series.instance[j];
            const extensions = instance.extension || [];
            for (let k = 0; k < extensions.length; k++) {
              if (extensions[k].url === 'gridfsFileId' && extensions[k].valueString) {
                fileIds.push(extensions[k].valueString);
              }
            }
          }
        }
      }
    }
    console.log('[DicomViewerPage] Extracted gridfsFileIds from study:', fileIds.length);
    return fileIds;
  }

  // Determine which file(s) to load
  const filesToLoad = fileIdFromQuery
    ? [fileIdFromQuery]  // Single file mode
    : getGridfsFileIdsFromStudy(study);  // Study mode

  // For GridFS URLs, fetch with auth headers and convert to local blob URLs
  // Supports both single file and multi-file (stack) modes
  // Each entry: { url: blobUrl, contentType: 'application/dicom' | 'video/mp4' }
  const [localFiles, setLocalFiles] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchingProgress, setFetchingProgress] = useState({ current: 0, total: 0 });

  useEffect(function() {
    if (!filesToLoad || filesToLoad.length === 0) {
      setLocalFiles([]);
      return;
    }

    let revoked = false;
    let blobUrls = [];

    async function fetchAllFiles() {
      try {
        console.log('Fetching', filesToLoad.length, 'file(s) from GridFS');
        setFetchingProgress({ current: 0, total: filesToLoad.length });

        const loginToken = localStorage.getItem('Meteor.loginToken');
        const headers = {};
        if (loginToken) {
          headers['Authorization'] = 'Bearer ' + loginToken;
        }

        const fetchedFiles = [];

        for (let i = 0; i < filesToLoad.length; i++) {
          if (revoked) break;

          const fileId = filesToLoad[i];
          const fileUrl = '/api/dicom/files/' + fileId;

          console.log('Fetching file', i + 1, 'of', filesToLoad.length, ':', fileId);
          setFetchingProgress({ current: i + 1, total: filesToLoad.length });

          const response = await fetch(fileUrl, { headers: headers });
          if (!response.ok) {
            throw new Error('Failed to fetch file ' + (i + 1) + ': ' + response.status + ' ' + response.statusText);
          }

          const contentType = response.headers.get('Content-Type') || 'application/dicom';
          const blob = await response.blob();
          console.log('Fetched file', i + 1, ':', blob.size, 'bytes, contentType:', contentType);

          const blobUrl = URL.createObjectURL(blob);
          fetchedFiles.push({ url: blobUrl, contentType: contentType });
          blobUrls.push(blobUrl);
        }

        if (!revoked) {
          console.log('All', fetchedFiles.length, 'files fetched successfully');
          setLocalFiles(fetchedFiles);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
        if (!revoked) {
          setFetchError(err.message);
        }
      }
    }

    fetchAllFiles();

    return function() {
      revoked = true;
      // Clean up all blob URLs
      blobUrls.forEach(function(url) {
        URL.revokeObjectURL(url);
      });
    };
  }, [JSON.stringify(filesToLoad)]);

  // Determine if we have viewable data
  const hasViewableData = localFiles.length > 0;

  // Detect video content (all files in a study share the same type)
  const isVideoContent = localFiles.length > 0 && localFiles[0].contentType.startsWith('video/');

  // Mode detection for UI
  const isSingleFileMode = !!fileIdFromQuery;

  // Handle back navigation
  function handleBack() {
    if (navigate) {
      navigate('/dicom/studies');
    }
  }

  // Handle adding a finding
  async function handleAddFinding() {
    if (!newFinding.code || !study) return;
    setSubmitting(true);

    try {
      const patientId = get(study, 'subject.reference', '').replace('Patient/', '');
      const findingOption = FINDING_OPTIONS.find(function(f) { return f.code === newFinding.code; });

      const observationId = await Meteor.callAsync('radiology.addFinding', {
        imagingStudyId: study._id,
        patientId: patientId,
        code: newFinding.code,
        codeDisplay: findingOption?.display || newFinding.code,
        valueString: newFinding.valueString,
        note: newFinding.valueString
      });

      console.log('[DicomViewerPage] Added finding:', observationId);

      setFindings([...findings, {
        _id: observationId,
        code: newFinding.code,
        display: findingOption?.display || newFinding.code,
        note: newFinding.valueString
      }]);

      setNewFinding({ code: '', valueString: '' });
      setShowFindingDialog(false);
    } catch (err) {
      console.error('[DicomViewerPage] Error adding finding:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Handle signing the report
  async function handleSignReport() {
    if (!study || !conclusion.trim()) return;
    setSubmitting(true);

    try {
      const patientId = get(study, 'subject.reference', '').replace('Patient/', '');

      const reportId = await Meteor.callAsync('radiology.signReport', {
        imagingStudyId: study._id,
        serviceRequestId: study._id,
        procedureId: study._id,
        patientId: patientId,
        observationIds: findings.map(function(f) { return f._id; }),
        conclusion: conclusion,
        conclusionCodes: findings.filter(function(f) { return f.code !== 'normal'; }).map(function(f) {
          return { code: f.code, display: f.display };
        })
      });

      console.log('[DicomViewerPage] Report signed:', reportId);
      // Navigate back to studies after signing
      if (navigate) {
        navigate('/dicom/studies');
      }
    } catch (err) {
      console.error('[DicomViewerPage] Error signing report:', err);
    } finally {
      setSubmitting(false);
    }
  }

  // Render the viewer content (shared between both layouts)
  function renderViewerContent() {
    return (
      <>
        {/* Loading state - subscription not ready OR single file mode fetching */}
        {(loading || (isSingleFileMode && localFiles.length === 0 && !fetchError)) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
              {isSingleFileMode ? 'Loading DICOM file...' : 'Loading study...'}
            </Typography>
          </Box>
        )}

        {/* Study not found (only in study mode) */}
        {!loading && !isSingleFileMode && !study && studyId && (
          <Alert severity="error">
            Study not found: {studyId}
          </Alert>
        )}

        {/* No images found in study */}
        {!loading && !isSingleFileMode && study && filesToLoad.length === 0 && (
          <Alert severity="warning">
            No DICOM images found for this study. The study has no linked GridFS files.
          </Alert>
        )}

        {/* Loading DICOM files from GridFS */}
        {filesToLoad.length > 0 && !hasViewableData && !fetchError && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              {fetchingProgress.total > 1
                ? 'Loading DICOM files from storage... (' + fetchingProgress.current + '/' + fetchingProgress.total + ')'
                : 'Loading DICOM file from storage...'}
            </Typography>
          </Box>
        )}

        {/* Fetch error */}
        {fetchError && (
          <Alert severity="error">
            Failed to load DICOM file: {fetchError}
          </Alert>
        )}

        {/* Show the viewport when we have data */}
        {hasViewableData && (
          <Box sx={{ mt: 2 }}>
            {isVideoContent ? (
              <VideoViewport
                videoUrls={localFiles.filter(function(f) { return f.contentType.startsWith('video/'); }).map(function(f) { return f.url; })}
              />
            ) : (
              <SimpleDicomViewport
                dicomUrl={isSingleFileMode ? localFiles[0].url : null}
                dicomUrls={!isSingleFileMode ? localFiles.map(function(f) { return f.url; }) : null}
              />
            )}
          </Box>
        )}
      </>
    );
  }

  return (
    <Box
      id="dicomViewerPage"
      sx={{
        height: canvasHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        pt: '20px'
      }}
    >
      <Card sx={{
        mx: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: cardBgColor,
        color: cardTextColor,
        overflow: 'hidden'
      }}>
        <CardHeader
          title={isSingleFileMode
            ? (isVideoContent ? 'Video Viewer' : 'DICOM File Viewer')
            : (study ? study.description || 'DICOM Viewer' : 'DICOM Viewer')}
          subheader={isSingleFileMode
            ? 'File ID: ' + fileIdFromQuery
            : (study ? 'Study ID: ' + studyId + ' (' + filesToLoad.length + ' images)' : 'Loading study...')}
          action={
            navigate && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={handleBack}
                  sx={{ color: cardTextColor }}
                >
                  Back to Studies
                </Button>
                <ButtonGroup size="small" sx={{ ml: 1 }}>
                  <Button
                    variant={paneLayout === 1 ? 'contained' : 'outlined'}
                    onClick={function() { setPaneLayout(1); }}
                    sx={{ minWidth: 36 }}
                  >
                    1
                  </Button>
                  <Button
                    variant={paneLayout === 2 ? 'contained' : 'outlined'}
                    onClick={function() { setPaneLayout(2); }}
                    sx={{ minWidth: 36 }}
                  >
                    2
                  </Button>
                </ButtonGroup>
              </Box>
            )
          }
          sx={{
            '& .MuiCardHeader-title': {
              color: cardTextColor
            },
            '& .MuiCardHeader-subheader': {
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
            }
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {paneLayout === 2 ? (
            <Grid container spacing={2} sx={{ flex: 1, overflow: 'hidden' }}>
              {/* Main Viewer - 8 columns */}
              <Grid item xs={8} sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                {renderViewerContent()}
              </Grid>

              {/* Reading Panel - 4 columns */}
              <Grid item xs={4} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ReadingPanelContent
                  study={study}
                  findings={findings}
                  conclusion={conclusion}
                  setConclusion={setConclusion}
                  onShowFindingDialog={function() { setShowFindingDialog(true); }}
                  submitting={submitting}
                  onSignReport={handleSignReport}
                  cardTextColor={cardTextColor}
                />
              </Grid>
            </Grid>
          ) : (
            renderViewerContent()
          )}
        </CardContent>
      </Card>

      {/* Add Finding Dialog */}
      <Dialog
        open={showFindingDialog}
        onClose={function() { setShowFindingDialog(false); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Finding</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Finding Type</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {FINDING_OPTIONS.map(function(option) {
                  return (
                    <Chip
                      key={option.code}
                      label={option.display}
                      onClick={function() { setNewFinding({ ...newFinding, code: option.code }); }}
                      color={newFinding.code === option.code ? 'primary' : 'default'}
                      variant={newFinding.code === option.code ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Box>
            </Box>
            <TextField
              label="Details / Notes"
              placeholder="Additional details about this finding..."
              value={newFinding.valueString}
              onChange={function(e) { setNewFinding({ ...newFinding, valueString: e.target.value }); }}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={function() { setShowFindingDialog(false); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddFinding}
            disabled={submitting || !newFinding.code}
          >
            {submitting ? <CircularProgress size={24} /> : 'Add Finding'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DicomViewerPage;

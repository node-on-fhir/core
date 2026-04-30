// imports/ui/DICOM/DicomViewerPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
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
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  WarningAmber as WarningAmberIcon,
  Notes as NotesIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import dicomParser from 'dicom-parser';
import ErrorBoundary from '/imports/ui/ErrorBoundary';
import SimpleDicomViewport from './components/SimpleDicomViewport';

const EcgViewer = React.lazy(function() {
  return import('/packages/ecg/client/components/EcgViewer');
});

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
  cardTextColor,
  isHealthcareProvider,
  onGenerateStudy,
  onMatchStudy,
  fileIds
}) {
  const [sidebarView, setSidebarView] = useState('clinical');
  const [copiedFileId, setCopiedFileId] = useState(null);

  function handleCopyFileId(fileId) {
    navigator.clipboard.writeText(fileId).then(function() {
      setCopiedFileId(fileId);
      setTimeout(function() { setCopiedFileId(null); }, 1500);
    });
  }

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

      {/* Generate / Match Study — only for unknown studies when user is healthcare provider */}
      {!study && isHealthcareProvider && (
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Button variant="outlined" fullWidth onClick={onGenerateStudy}>
              Generate Study
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button variant="outlined" fullWidth onClick={onMatchStudy}>
              Match Study
            </Button>
          </Grid>
        </Grid>
      )}

      {/* View Toggle */}
      <ButtonGroup size="small" fullWidth sx={{ mb: 1 }}>
        <Button
          variant={sidebarView === 'clinical' ? 'contained' : 'outlined'}
          onClick={function() { setSidebarView('clinical'); }}
        >
          Findings
        </Button>
        <Button
          variant={sidebarView === 'files' ? 'contained' : 'outlined'}
          onClick={function() { setSidebarView('files'); }}
          startIcon={<StorageIcon />}
        >
          Files ({fileIds.length})
        </Button>
      </ButtonGroup>

      {/* Clinical View: Findings + Impression */}
      {sidebarView === 'clinical' && (
        <>
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
        </>
      )}

      {/* Files View */}
      {sidebarView === 'files' && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <StorageIcon fontSize="small" /> DICOM Files ({fileIds.length})
          </Typography>
          {fileIds.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 1 }}>
              No files linked to this study
            </Typography>
          ) : (
            <List dense disablePadding sx={{ overflow: 'auto', flex: 1 }}>
              {fileIds.map(function(fileId, index) {
                return (
                  <ListItem key={fileId} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 0.5, py: 0.5 }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={copiedFileId === fileId ? 'Copied!' : 'Copy file ID'}>
                          <IconButton size="small" onClick={function() { handleCopyFileId(fileId); }}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open in viewer">
                          <IconButton size="small" onClick={function() { window.open('/dicom/viewer?file=' + fileId, '_blank'); }}>
                            <PreviewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Tooltip title={fileId} placement="top">
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {fileId.length > 16 ? fileId.substring(0, 8) + '...' + fileId.substring(fileId.length - 4) : fileId}
                          </Typography>
                        </Tooltip>
                      }
                      secondary={'File ' + (index + 1)}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}

function DicomViewerPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const { studyId } = useParams();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Get query parameters for single-file viewing mode and reading panel state
  let fileIdFromQuery = null;
  let previousRouteFromQuery = null;
  let searchParamsRef = null;
  let setSearchParamsRef = null;
  if (useSearchParams) {
    const searchParamsResult = useSearchParams();
    searchParamsRef = searchParamsResult[0];
    setSearchParamsRef = searchParamsResult[1];
    fileIdFromQuery = searchParamsRef.get('file');
    previousRouteFromQuery = searchParamsRef.get('previous');
  }

  // Current user and role check
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  const isHealthcareProvider = Array.isArray(get(currentUser, 'roles'))
    && currentUser.roles.includes('healthcare provider');

  // Match Study dialog state
  const [showMatchStudyDialog, setShowMatchStudyDialog] = useState(false);
  const [matchStudySearch, setMatchStudySearch] = useState('');

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';

  // Layout state (1 = single pane, 2 = split pane with reading panel)
  const readingPanelParam = searchParamsRef ? searchParamsRef.get('reading-panel') : null;
  const [paneLayout, setPaneLayout] = useState(readingPanelParam === 'false' ? 1 : 2);

  // Update URL when toggling pane layout
  function handlePaneLayoutChange(layout) {
    setPaneLayout(layout);
    if (setSearchParamsRef) {
      setSearchParamsRef(function(prev) {
        const next = new URLSearchParams(prev);
        if (layout === 2) {
          next.delete('reading-panel');
        } else {
          next.set('reading-panel', 'false');
        }
        return next;
      }, { replace: true });
    }
  }

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

    // Subscribe to patient-scoped ImagingStudies (works when patient is selected)
    const studiesHandle = Meteor.subscribe('selectedPatient.ImagingStudies', Session.get('selectedPatientId'), {});

    // Also subscribe via radiology publication for direct studyId access
    // This ensures the study stays in Minimongo even without patient context
    let radiologyHandle = { ready: function() { return true; } };
    if (studyId) {
      radiologyHandle = Meteor.subscribe('radiology.ImagingStudies', { _id: studyId }, { limit: 1 });
    }

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
      loading: !studiesHandle.ready() && !radiologyHandle.ready()
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

        let skippedCount = 0;

        for (let i = 0; i < filesToLoad.length; i++) {
          if (revoked) break;

          const fileId = filesToLoad[i];
          const fileUrl = '/api/dicom/files/' + fileId;

          console.log('Fetching file', i + 1, 'of', filesToLoad.length, ':', fileId);
          setFetchingProgress({ current: i + 1, total: filesToLoad.length });

          const response = await fetch(fileUrl, { headers: headers });
          if (!response.ok) {
            console.warn('[DicomViewerPage] Skipping file', i + 1, '(', fileId, '):', response.status, response.statusText);
            skippedCount++;
            continue;
          }

          const contentType = response.headers.get('Content-Type') || 'application/dicom';
          const blob = await response.blob();
          console.log('Fetched file', i + 1, ':', blob.size, 'bytes, contentType:', contentType);

          // Parse DICOM header to extract modality tag
          let modality = null;
          let fileArrayBuffer = null;
          if (contentType === 'application/dicom' || contentType.includes('dicom')) {
            try {
              fileArrayBuffer = await blob.arrayBuffer();
              const byteArray = new Uint8Array(fileArrayBuffer);
              const dataSet = dicomParser.parseDicom(byteArray);
              modality = dataSet.string('x00080060') || null;
              console.log('[DicomViewerPage] Parsed modality from DICOM header:', modality);
            } catch (parseErr) {
              console.warn('[DicomViewerPage] Could not parse DICOM header:', parseErr.message);
            }
          }

          const blobUrl = URL.createObjectURL(blob);
          fetchedFiles.push({
            url: blobUrl,
            contentType: contentType,
            modality: modality,
            arrayBuffer: modality === 'ECG' ? fileArrayBuffer : null
          });
          blobUrls.push(blobUrl);
        }

        if (!revoked) {
          if (fetchedFiles.length === 0 && skippedCount > 0) {
            setFetchError('All ' + skippedCount + ' file(s) returned errors (404 or other). The files may have been deleted from storage.');
          } else {
            if (skippedCount > 0) {
              console.warn('[DicomViewerPage] Loaded', fetchedFiles.length, 'files, skipped', skippedCount, 'missing files');
            }
            console.log('All', fetchedFiles.length, 'files fetched successfully');
            setLocalFiles(fetchedFiles);
          }
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

  // Detect ECG content from DICOM modality tag
  const isEcgContent = localFiles.length > 0 && localFiles[0].modality === 'ECG';

  // Mode detection for UI
  const isSingleFileMode = !!fileIdFromQuery;

  // Memoize URL props for SimpleDicomViewport to prevent re-renders on every keystroke
  const dicomUrlForViewport = useMemo(function() {
    return isSingleFileMode && localFiles.length > 0 ? localFiles[0].url : null;
  }, [isSingleFileMode, localFiles]);

  const dicomUrlsForViewport = useMemo(function() {
    return !isSingleFileMode && localFiles.length > 0
      ? localFiles.map(function(f) { return f.url; })
      : null;
  }, [isSingleFileMode, localFiles]);

  // Handle back navigation
  function handleBack() {
    if (navigate) {
      navigate(previousRouteFromQuery || '/dicom/studies?tab=studies');
    }
  }

  // Handle Generate Study — navigate to ImagingStudyDetail with file pre-linked
  function handleGenerateStudy() {
    if (navigate) {
      navigate('/imaging-studies/new?file=' + fileIdFromQuery);
    }
  }

  // Handle Match Study — open modal dialog
  function handleMatchStudy() {
    setShowMatchStudyDialog(true);
  }

  // Handle selecting a study in the Match Study dialog
  async function handleMatchStudySelect(studyId) {
    try {
      console.log('[DicomViewerPage] Matching file', fileIdFromQuery, 'to study', studyId);
      await Meteor.callAsync('imagingStudies.addGridfsFile', studyId, fileIdFromQuery);
      console.log('[DicomViewerPage] File matched to study successfully');
      setShowMatchStudyDialog(false);
      // Navigate to the study view so the file shows in study context
      if (navigate) {
        navigate('/dicom/viewer/' + studyId);
      }
    } catch (err) {
      console.error('[DicomViewerPage] Error matching file to study:', err);
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
          <Box sx={{ mt: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {isVideoContent ? (
              <VideoViewport
                videoUrls={localFiles.filter(function(f) { return f.contentType.startsWith('video/'); }).map(function(f) { return f.url; })}
              />
            ) : isEcgContent ? (
              <ErrorBoundary fallback={
                <Alert severity="warning">ECG viewer failed to load. Try refreshing the page.</Alert>
              }>
                <React.Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <CircularProgress />
                  </Box>
                }>
                  <EcgViewer
                    arrayBuffer={localFiles[0].arrayBuffer}
                    isDark={isDark}
                    displayMode={isDark ? 'monitor' : 'paper'}
                  />
                </React.Suspense>
              </ErrorBoundary>
            ) : (
              <SimpleDicomViewport
                dicomUrl={dicomUrlForViewport}
                dicomUrls={dicomUrlsForViewport}
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
            ? (isVideoContent ? 'Video Viewer' : (isEcgContent ? 'ECG Viewer' : 'DICOM File Viewer'))
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
                  Back
                </Button>
                <ButtonGroup size="small" sx={{ ml: 1 }}>
                  <Button
                    variant={paneLayout === 1 ? 'contained' : 'outlined'}
                    onClick={function() { handlePaneLayoutChange(1); }}
                    sx={{ minWidth: 36 }}
                  >
                    1
                  </Button>
                  <Button
                    variant={paneLayout === 2 ? 'contained' : 'outlined'}
                    onClick={function() { handlePaneLayoutChange(2); }}
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
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Viewer - always rendered, width adjusts to prevent remount */}
            <Box sx={{
              flex: paneLayout === 2 ? '0 0 66.67%' : '1 1 100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'flex-basis 0.2s ease'
            }}>
              {renderViewerContent()}
            </Box>

            {/* Reading Panel - shown/hidden based on layout */}
            {paneLayout === 2 && (
              <Box sx={{ flex: '0 0 33.33%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ReadingPanelContent
                  study={study}
                  findings={findings}
                  conclusion={conclusion}
                  setConclusion={setConclusion}
                  onShowFindingDialog={function() { setShowFindingDialog(true); }}
                  submitting={submitting}
                  onSignReport={handleSignReport}
                  cardTextColor={cardTextColor}
                  isHealthcareProvider={isHealthcareProvider}
                  onGenerateStudy={handleGenerateStudy}
                  onMatchStudy={handleMatchStudy}
                  fileIds={filesToLoad}
                />
              </Box>
            )}
          </Box>
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

      {/* Match Study Dialog */}
      <MatchStudyDialog
        open={showMatchStudyDialog}
        onClose={function() { setShowMatchStudyDialog(false); }}
        searchValue={matchStudySearch}
        onSearchChange={function(val) { setMatchStudySearch(val); }}
        onSelectStudy={handleMatchStudySelect}
        isHealthcareProvider={isHealthcareProvider}
      />
    </Box>
  );
}

// Match Study Dialog component — search and select an existing ImagingStudy
function MatchStudyDialog({ open, onClose, searchValue, onSearchChange, onSelectStudy, isHealthcareProvider }) {
  const studies = useTracker(function() {
    if (!open) return [];

    const ImagingStudies = Meteor.Collections?.ImagingStudies;
    if (!ImagingStudies) return [];

    // Subscribe based on context
    const selectedPatientId = Session.get('selectedPatientId');
    if (selectedPatientId) {
      Meteor.subscribe('selectedPatient.ImagingStudies', selectedPatientId, {});
    } else {
      Meteor.subscribe('selectedPatient.ImagingStudies', null, {});
    }

    // Build query
    let query = {};
    const selectedPatient = Session.get('selectedPatient');

    if (selectedPatient) {
      // Filter by selected patient
      const patientRef = 'Patient/' + get(selectedPatient, 'id', get(selectedPatient, '_id', ''));
      query['subject.reference'] = patientRef;
    } else if (!isHealthcareProvider) {
      // Non-healthcare-provider: filter by own patientId
      const user = Meteor.user();
      if (user && user.patientId) {
        query['subject.reference'] = 'Patient/' + user.patientId;
      }
    }
    // Healthcare provider with no patient selected: show all (no filter)

    // Apply text search filter
    if (searchValue && searchValue.trim().length > 0) {
      const searchTerm = searchValue.trim();
      query.$or = [
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'identifier.value': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    return ImagingStudies.find(query, { sort: { started: -1 }, limit: 50 }).fetch();
  }, [open, searchValue, isHealthcareProvider]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Match to Existing Study</DialogTitle>
      <DialogContent>
        <TextField
          placeholder="Search by description or accession number..."
          value={searchValue}
          onChange={function(e) { onSearchChange(e.target.value); }}
          fullWidth
          size="small"
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        {studies.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No imaging studies found
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Modality</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Patient</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studies.map(function(s) {
                  return (
                    <TableRow
                      key={s._id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={function() { onSelectStudy(s._id); }}
                    >
                      <TableCell>{get(s, 'description', '-')}</TableCell>
                      <TableCell>{get(s, 'modality.0.code', '-')}</TableCell>
                      <TableCell>
                        {s.started ? new Date(s.started).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{get(s, 'subject.display', '-')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DicomViewerPage;

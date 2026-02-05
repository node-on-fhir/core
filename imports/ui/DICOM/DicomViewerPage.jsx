// imports/ui/DICOM/DicomViewerPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams } from 'react-router-dom';
import { get } from 'lodash';

import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import {
  ArrowBack as BackIcon
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
  const [localDicomUrls, setLocalDicomUrls] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [fetchingProgress, setFetchingProgress] = useState({ current: 0, total: 0 });

  useEffect(function() {
    if (!filesToLoad || filesToLoad.length === 0) {
      setLocalDicomUrls([]);
      return;
    }

    let revoked = false;
    let blobUrls = [];

    async function fetchAllDicomFiles() {
      try {
        console.log('Fetching', filesToLoad.length, 'DICOM file(s) from GridFS');
        setFetchingProgress({ current: 0, total: filesToLoad.length });

        const loginToken = localStorage.getItem('Meteor.loginToken');
        const headers = {};
        if (loginToken) {
          headers['Authorization'] = 'Bearer ' + loginToken;
        }

        const urls = [];

        for (let i = 0; i < filesToLoad.length; i++) {
          if (revoked) break;

          const fileId = filesToLoad[i];
          const fileUrl = '/api/dicom/files/' + fileId;

          console.log('Fetching file', i + 1, 'of', filesToLoad.length, ':', fileId);
          setFetchingProgress({ current: i + 1, total: filesToLoad.length });

          const response = await fetch(fileUrl, { headers: headers });
          if (!response.ok) {
            throw new Error('Failed to fetch DICOM file ' + (i + 1) + ': ' + response.status + ' ' + response.statusText);
          }

          const blob = await response.blob();
          console.log('Fetched file', i + 1, ':', blob.size, 'bytes');

          const blobUrl = URL.createObjectURL(blob);
          urls.push(blobUrl);
          blobUrls.push(blobUrl);
        }

        if (!revoked) {
          console.log('All', urls.length, 'DICOM files fetched successfully');
          setLocalDicomUrls(urls);
        }
      } catch (err) {
        console.error('Error fetching DICOM files:', err);
        if (!revoked) {
          setFetchError(err.message);
        }
      }
    }

    fetchAllDicomFiles();

    return function() {
      revoked = true;
      // Clean up all blob URLs
      blobUrls.forEach(function(url) {
        URL.revokeObjectURL(url);
      });
    };
  }, [JSON.stringify(filesToLoad)]);

  // Determine if we have viewable data
  const hasViewableData = localDicomUrls.length > 0;

  // Mode detection for UI
  const isSingleFileMode = !!fileIdFromQuery;

  // Handle back navigation
  function handleBack() {
    if (navigate) {
      navigate('/dicom/studies');
    }
  }

  return (
    <Box
      id="dicomViewerPage"
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      <Card sx={{
        mx: 3,
        mb: 3,
        bgcolor: cardBgColor,
        color: cardTextColor
      }}>
        <CardHeader
          title={isSingleFileMode
            ? 'DICOM File Viewer'
            : (study ? study.description || 'DICOM Viewer' : 'DICOM Viewer')}
          subheader={isSingleFileMode
            ? 'File ID: ' + fileIdFromQuery
            : (study ? 'Study ID: ' + studyId + ' (' + filesToLoad.length + ' images)' : 'Loading study...')}
          action={
            navigate && (
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
                sx={{ color: cardTextColor }}
              >
                Back to Studies
              </Button>
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
        <CardContent>
          {/* Loading state - subscription not ready OR single file mode fetching */}
          {(loading || (isSingleFileMode && localDicomUrls.length === 0 && !fetchError)) && (
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
              <SimpleDicomViewport
                dicomUrl={isSingleFileMode ? localDicomUrls[0] : null}
                dicomUrls={!isSingleFileMode ? localDicomUrls : null}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DicomViewerPage;

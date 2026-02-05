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

// Theme hook
let useAppTheme;
let useNavigate;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

function DicomViewerPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const { studyId } = useParams();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';

  // Fetch the ImagingStudy and its DocumentReferences
  const { study, documentReferences, loading } = useTracker(function() {
    console.log('🔍 DicomViewerPage: Fetching study:', studyId);

    const ImagingStudies = Meteor.Collections?.ImagingStudies;
    const DocumentReferences = Meteor.Collections?.DocumentReferences;

    if (!ImagingStudies || !DocumentReferences) {
      console.warn('⚠️  Collections not available');
      return { study: null, documentReferences: [], loading: false };
    }

    // Fetch the study
    const studyData = ImagingStudies.findOne({ _id: studyId });
    console.log('📊 Found study:', studyData);

    // Fetch DocumentReferences linked to this study
    const docRefs = DocumentReferences.find({
      'context.related': {
        $elemMatch: {
          reference: `ImagingStudy/${studyId}`
        }
      }
    }).fetch();
    console.log('📄 Found DocumentReferences:', docRefs.length, docRefs);

    return {
      study: studyData,
      documentReferences: docRefs,
      loading: false
    };
  }, [studyId]);

  // Get the first DocumentReference's attachment info
  const attachment = documentReferences.length > 0
    ? get(documentReferences[0], 'content.0.attachment')
    : null;
  const dicomData = get(attachment, 'data');  // Legacy inline base64
  const dicomFileUrl = get(attachment, 'url');  // GridFS URL reference

  // For GridFS URLs, fetch with auth headers and convert to a local blob URL
  const [localDicomUrl, setLocalDicomUrl] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(function() {
    if (!dicomFileUrl) {
      setLocalDicomUrl(null);
      return;
    }

    let revoked = false;
    let blobUrl = null;

    async function fetchDicomFile() {
      try {
        console.log('Fetching DICOM file from GridFS:', dicomFileUrl);
        const loginToken = localStorage.getItem('Meteor.loginToken');
        const headers = {};
        if (loginToken) {
          headers['Authorization'] = 'Bearer ' + loginToken;
        }

        const response = await fetch(dicomFileUrl, { headers: headers });
        if (!response.ok) {
          throw new Error('Failed to fetch DICOM file: ' + response.status + ' ' + response.statusText);
        }

        const blob = await response.blob();
        console.log('Fetched DICOM file:', blob.size, 'bytes');

        if (!revoked) {
          blobUrl = URL.createObjectURL(blob);
          setLocalDicomUrl(blobUrl);
        }
      } catch (err) {
        console.error('Error fetching DICOM file:', err);
        if (!revoked) {
          setFetchError(err.message);
        }
      }
    }

    fetchDicomFile();

    return function() {
      revoked = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [dicomFileUrl]);

  // Determine which prop to pass to the viewport
  const hasViewableData = dicomData || localDicomUrl;

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
          title={study ? study.description || 'DICOM Viewer' : 'DICOM Viewer'}
          subheader={study ? `Study ID: ${studyId}` : 'Loading study...'}
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
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && !study && (
            <Alert severity="error">
              Study not found: {studyId}
            </Alert>
          )}

          {!loading && study && documentReferences.length === 0 && (
            <Alert severity="warning">
              No DICOM images found for this study.
            </Alert>
          )}

          {!loading && study && documentReferences.length > 0 && !hasViewableData && !fetchError && dicomFileUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                Loading DICOM file from storage...
              </Typography>
            </Box>
          )}

          {!loading && study && documentReferences.length > 0 && !hasViewableData && !dicomFileUrl && (
            <Alert severity="warning">
              DICOM image data is not available in the DocumentReference.
            </Alert>
          )}

          {fetchError && (
            <Alert severity="error">
              Failed to load DICOM file: {fetchError}
            </Alert>
          )}

          {!loading && study && documentReferences.length > 0 && hasViewableData && (
            <Box sx={{ mt: 2 }}>
              <SimpleDicomViewport
                dicomData={dicomData}
                dicomUrl={localDicomUrl}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DicomViewerPage;

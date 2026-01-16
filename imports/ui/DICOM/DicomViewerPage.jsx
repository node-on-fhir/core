// imports/ui/DICOM/DicomViewerPage.jsx

import React, { useState } from 'react';
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

  // Get the first DocumentReference's DICOM data
  const dicomData = documentReferences.length > 0
    ? get(documentReferences[0], 'content.0.attachment.data')
    : null;

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

          {!loading && study && documentReferences.length > 0 && !dicomData && (
            <Alert severity="warning">
              DICOM image data is not available in the DocumentReference.
            </Alert>
          )}

          {!loading && study && documentReferences.length > 0 && dicomData && (
            <Box sx={{ mt: 2 }}>
              <SimpleDicomViewport dicomData={dicomData} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DicomViewerPage;

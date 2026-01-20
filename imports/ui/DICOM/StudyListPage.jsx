// packages/dicom-viewer/client/StudyListPage.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility as ViewIcon
} from '@mui/icons-material';

let useAppTheme;
let useNavigate;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

export default function StudyListPage() {
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const navigate = useNavigate ? useNavigate() : null;
  const [expandedRows, setExpandedRows] = useState({});

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';
  const paperBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.paperColor', '#1e1e1e')
    : '#ffffff';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Subscribe to ImagingStudy and DocumentReference collections
  const { studies, documentReferences, loading } = useTracker(function() {
    console.log('🔍 useTracker running...');
    console.log('Meteor.Collections:', Meteor.Collections);

    const ImagingStudies = Meteor.Collections?.ImagingStudies;
    const DocumentReferences = Meteor.Collections?.DocumentReferences;

    if (!ImagingStudies) {
      console.warn('⚠️  ImagingStudies collection not available');
      console.warn('Available collections:', Object.keys(Meteor.Collections || {}));
      return { studies: [], documentReferences: [], loading: false };
    }

    console.log('✅ ImagingStudies collection found');
    const studiesData = ImagingStudies.find({}).fetch();
    console.log('📊 Found studies:', studiesData.length, studiesData);

    let docRefs = [];
    if (DocumentReferences) {
      docRefs = DocumentReferences.find({}).fetch();
      console.log('📄 Found DocumentReferences:', docRefs.length, docRefs);
    }

    return {
      studies: studiesData,
      documentReferences: docRefs,
      loading: false
    };
  }, []);

  // Toggle row expansion
  function toggleRowExpansion(studyId, event) {
    event.stopPropagation();
    setExpandedRows(function(prev) {
      return {
        ...prev,
        [studyId]: !prev[studyId]
      };
    });
  }

  // Open DICOM viewer for a study
  function handleOpenViewer(studyId, event) {
    event.stopPropagation();
    if (navigate) {
      navigate(`/dicom/viewer/${studyId}`);
    }
  }

  // Get DocumentReferences for a study
  function getDocumentReferencesForStudy(studyId) {
    return documentReferences.filter(function(docRef) {
      // Check if docRef.context.related references this ImagingStudy
      const related = get(docRef, 'context.related', []);
      return related.some(function(ref) {
        return ref.reference === `ImagingStudy/${studyId}`;
      });
    });
  }

  return (
    <Box
      id="dicomStudyListPage"
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
          title="DICOM Studies"
          subheader="Medical imaging studies for current patient"
          action={
            navigate && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => navigate('/dicom/upload')}
              >
                Upload Image(s)
              </Button>
            )
          }
          sx={{
            '& .MuiCardHeader-title': {
              color: cardTextColor
            },
            '& .MuiCardHeader-subheader': {
              color: subheaderColor
            }
          }}
        />
        <CardContent>
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              bgcolor: paperBgColor,
              '& .MuiTableCell-root': {
                color: cardTextColor,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '50px' }} />
                  <TableCell style={{ width: '80px' }}>Actions</TableCell>
                  <TableCell>Study Date</TableCell>
                  <TableCell>Study Description</TableCell>
                  <TableCell>Modality</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography
                        variant="body2"
                        sx={{
                          py: 3,
                          color: subheaderColor
                        }}
                      >
                        No studies available. Click "Upload Image(s)" to add DICOM studies.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {studies.map(function(study) {
                  const studyDate = study.started ? moment(study.started).format('MMM D, YYYY h:mm A') : '-';
                  const description = study.description || '-';
                  const modality = get(study, 'series.0.modality.code', '-');
                  const numberOfSeries = study.numberOfSeries || 0;
                  const numberOfInstances = study.numberOfInstances || 0;
                  const status = study.status || 'unknown';
                  const studyId = study._id;
                  const isExpanded = expandedRows[studyId] || false;
                  const studyDocRefs = getDocumentReferencesForStudy(studyId);

                  return (
                    <React.Fragment key={studyId}>
                      {/* Main study row */}
                      <TableRow
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                            cursor: 'pointer'
                          }
                        }}
                      >
                        <TableCell>
                          <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={function(event) { toggleRowExpansion(studyId, event); }}
                          >
                            {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="open viewer"
                            size="small"
                            color="primary"
                            onClick={function(event) { handleOpenViewer(studyId, event); }}
                            sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                        <TableCell>{studyDate}</TableCell>
                        <TableCell>{description}</TableCell>
                        <TableCell>
                          <Chip
                            label={modality}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{numberOfSeries}</TableCell>
                        <TableCell>{numberOfInstances}</TableCell>
                        <TableCell>
                          <Chip
                            label={status}
                            size="small"
                            color={status === 'available' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Expanded row with DocumentReferences */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 2, bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
                              <Typography variant="h6" gutterBottom sx={{ color: cardTextColor, fontSize: '1rem' }}>
                                Document References ({studyDocRefs.length})
                              </Typography>
                              {studyDocRefs.length === 0 ? (
                                <Typography variant="body2" sx={{ color: subheaderColor }}>
                                  No documents associated with this study.
                                </Typography>
                              ) : (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Document Date</TableCell>
                                      <TableCell>Description</TableCell>
                                      <TableCell>Type</TableCell>
                                      <TableCell>Size</TableCell>
                                      <TableCell>Status</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {studyDocRefs.map(function(docRef) {
                                      const docDate = docRef.date ? moment(docRef.date).format('MMM D, YYYY h:mm A') : '-';
                                      const docDescription = docRef.description || '-';
                                      const docType = get(docRef, 'type.text', '-');
                                      const docSize = get(docRef, 'content.0.attachment.size');
                                      const docSizeStr = docSize ? `${(docSize / 1024).toFixed(1)} KB` : '-';
                                      const docStatus = docRef.status || 'current';

                                      return (
                                        <TableRow key={docRef._id}>
                                          <TableCell>{docDate}</TableCell>
                                          <TableCell>{docDescription}</TableCell>
                                          <TableCell>{docType}</TableCell>
                                          <TableCell>{docSizeStr}</TableCell>
                                          <TableCell>
                                            <Chip
                                              label={docStatus}
                                              size="small"
                                              color={docStatus === 'current' ? 'success' : 'default'}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

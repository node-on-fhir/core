// imports/ui/DICOM/components/ImagingStudiesTable.jsx
// Table component for displaying FHIR ImagingStudy resources
// Shows Series and Instances in expanded row with Key Image toggle

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Checkbox,
  Tooltip,
  Button,
  Alert
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility as ViewIcon,
  Star as KeyImageIcon,
  StarBorder as KeyImageOutlineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Import Key Image utilities
import { isKeyImage, getGridfsFileIdFromInstance, findKeyImageDocRef } from '../utils/KeyImageUtils';

let useNavigate;
Meteor.startup(function() {
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

/**
 * ImagingStudiesTable - Displays FHIR ImagingStudy resources
 * Extracted from StudyListPage for reuse in tabbed interface
 */
export default function ImagingStudiesTable({ isDark, cardTextColor, subheaderColor, paperBgColor, aggregationResult }) {
  const navigate = useNavigate ? useNavigate() : null;
  const [expandedRows, setExpandedRows] = useState({});
  const [regenerating, setRegenerating] = useState(false);

  // "Updated, not created" alert state — driven by navigation state from UploadPage
  const [updatedStudies, setUpdatedStudies] = useState([]);

  // Duplicate GridFS files alert state — driven by server method
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Extract updated studies from aggregation result (one-time on mount/navigation)
  useEffect(function() {
    if (aggregationResult && aggregationResult.studies) {
      const updated = aggregationResult.studies.filter(function(s) {
        return s.action === 'updated';
      });
      if (updated.length > 0) {
        setUpdatedStudies(updated);
      }
    }
  }, [aggregationResult]);

  // Check for duplicate files on mount
  useEffect(function() {
    Meteor.call('dicom.checkDuplicateFiles', function(error, result) {
      if (error) {
        console.warn('[ImagingStudiesTable] Duplicate check error:', error);
        return;
      }
      if (result && result.uniqueDuplicatedImages > 0) {
        setDuplicateInfo(result);
      }
    });
  }, []);

  // Handle regenerate ImagingStudies from existing GridFS files
  function handleRegenerateStudies() {
    setRegenerating(true);
    console.log('[ImagingStudiesTable] Regenerating ImagingStudies from GridFS files...');

    Meteor.call('dicom.regenerateAllImagingStudies', function(error, result) {
      setRegenerating(false);

      if (error) {
        console.error('[ImagingStudiesTable] Regeneration error:', error);
        alert('Error regenerating ImagingStudies: ' + (error.reason || error.message));
        return;
      }

      console.log('[ImagingStudiesTable] Regeneration result:', result);
      alert('ImagingStudies regenerated: ' + (result.studies?.length || 0) + ' studies from ' + result.filesProcessed + ' files');
    });
  }

  // Subscribe to ImagingStudy and DocumentReference collections
  const { studies, documentReferences, loading } = useTracker(function() {
    console.log('[ImagingStudiesTable] useTracker running...');

    // CRITICAL: Subscribe to autopublish publications to receive data from server
    const studiesHandle = Meteor.subscribe('autopublish.ImagingStudies', {}, {});
    const docRefsHandle = Meteor.subscribe('autopublish.DocumentReferences', {}, {});

    const ImagingStudies = Meteor.Collections?.ImagingStudies;
    const DocumentReferences = Meteor.Collections?.DocumentReferences;

    if (!ImagingStudies) {
      console.warn('[ImagingStudiesTable] ImagingStudies collection not available');
      return { studies: [], documentReferences: [], loading: true };
    }

    const studiesData = ImagingStudies.find({}).fetch();
    console.log('[ImagingStudiesTable] Found studies:', studiesData.length);

    let docRefs = [];
    if (DocumentReferences) {
      docRefs = DocumentReferences.find({}).fetch();
    }

    return {
      studies: studiesData,
      documentReferences: docRefs,
      loading: !studiesHandle.ready() || !docRefsHandle.ready()
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
      navigate('/dicom/viewer/' + studyId);
    }
  }

  // Get DocumentReferences for a study (Key Images only)
  function getDocumentReferencesForStudy(studyId) {
    return documentReferences.filter(function(docRef) {
      const related = get(docRef, 'context.related', []);
      return related.some(function(ref) {
        return ref.reference === 'ImagingStudy/' + studyId;
      });
    });
  }

  // Handle Key Image toggle
  function handleKeyImageToggle(instance, study, existingDocRef) {
    const gridfsFileId = getGridfsFileIdFromInstance(instance);

    if (!gridfsFileId) {
      console.warn('[ImagingStudiesTable] No GridFS file ID for instance:', instance.uid);
      return;
    }

    if (existingDocRef) {
      // Remove Key Image
      console.log('[ImagingStudiesTable] Removing Key Image:', existingDocRef._id);
      Meteor.call('dicom.removeKeyImage', existingDocRef._id, function(error, result) {
        if (error) {
          console.error('[ImagingStudiesTable] Error removing Key Image:', error);
        } else {
          console.log('[ImagingStudiesTable] Key Image removed:', result);
        }
      });
    } else {
      // Create Key Image
      console.log('[ImagingStudiesTable] Creating Key Image for instance:', instance.uid);
      Meteor.call('dicom.createKeyImage', {
        gridfsFileId: gridfsFileId,
        imagingStudyId: study._id,
        sopInstanceUid: instance.uid
      }, function(error, result) {
        if (error) {
          console.error('[ImagingStudiesTable] Error creating Key Image:', error);
        } else {
          console.log('[ImagingStudiesTable] Key Image created:', result);
        }
      });
    }
  }

  // Handle preview of a single instance
  function handlePreviewInstance(gridfsFileId, event) {
    event.stopPropagation();
    if (navigate) {
      navigate('/dicom/viewer?file=' + gridfsFileId);
    }
  }

  // Truncate UID for display
  function truncateUid(uid) {
    if (!uid) return '-';
    if (uid.length <= 20) return uid;
    return uid.substring(0, 10) + '...' + uid.substring(uid.length - 8);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, color: subheaderColor }}>Loading imaging studies...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Alert: Studies were updated, not newly created */}
      {updatedStudies.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={function() { setUpdatedStudies([]); }}>
          <strong>{updatedStudies.length} existing {updatedStudies.length === 1 ? 'study' : 'studies'} updated</strong> (not newly created).
          The uploaded DICOM files matched {updatedStudies.length === 1 ? 'a study' : 'studies'} already in the system by StudyInstanceUID.
          Patient and ServiceRequest references were updated on the existing {updatedStudies.length === 1 ? 'record' : 'records'}.
        </Alert>
      )}

      {/* Alert: Duplicate DICOM files detected in GridFS storage */}
      {duplicateInfo && duplicateInfo.uniqueDuplicatedImages > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={function() { setDuplicateInfo(null); }}>
          <strong>{duplicateInfo.totalDuplicateFiles} duplicate DICOM files</strong> detected
          across {duplicateInfo.uniqueDuplicatedImages} unique {duplicateInfo.uniqueDuplicatedImages === 1 ? 'image' : 'images'}.
          The same images were uploaded more than once. This uses extra storage but does not create duplicate studies.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: subheaderColor }}>
          FHIR ImagingStudy resources ({studies.length} total)
        </Typography>
        <Tooltip title="Regenerate ImagingStudy resources from existing DICOM files in GridFS">
          <Button
            variant="outlined"
            size="small"
            startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRegenerateStudies}
            disabled={regenerating}
            sx={{ color: isDark ? '#90caf9' : '#1976d2', borderColor: isDark ? '#90caf9' : '#1976d2' }}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Studies'}
          </Button>
        </Tooltip>
      </Box>

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
        <Table id="imagingStudiesTable">
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
                    sx={{ py: 3, color: subheaderColor }}
                  >
                    No imaging studies available. Upload DICOM files to create studies.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {studies.map(function(study) {
              const studyDate = study.started
                ? moment(study.started).format('MMM D, YYYY h:mm A')
                : '-';
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
                      <Chip label={modality} size="small" variant="outlined" />
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

                  {/* Expanded row with Series and Instances */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{
                          py: 2,
                          px: 2,
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
                        }}>
                          {/* Series and Instances */}
                          {study.series && study.series.length > 0 ? (
                            study.series.map(function(series, seriesIndex) {
                              const seriesModality = get(series, 'modality.code', 'OT');
                              const seriesDescription = series.description || 'Series ' + (seriesIndex + 1);
                              const seriesInstances = series.instance || [];

                              return (
                                <Box key={series.uid || seriesIndex} sx={{ mb: 3 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ color: cardTextColor, mb: 1 }}
                                  >
                                    {seriesDescription} ({seriesModality}, {seriesInstances.length} instances)
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell style={{ width: '60px' }}>#</TableCell>
                                        <TableCell>SOP Instance UID</TableCell>
                                        <TableCell style={{ width: '80px' }}>Preview</TableCell>
                                        <TableCell style={{ width: '100px' }}>Key Image</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {seriesInstances.map(function(instance, instanceIndex) {
                                        const instanceNumber = instance.number || instanceIndex + 1;
                                        const sopInstanceUid = instance.uid || '-';
                                        const gridfsFileId = getGridfsFileIdFromInstance(instance);
                                        const keyImageDocRef = findKeyImageDocRef(instance, studyDocRefs);
                                        const instanceIsKeyImage = !!keyImageDocRef;

                                        return (
                                          <TableRow key={instance.uid || instanceIndex}>
                                            <TableCell>{instanceNumber}</TableCell>
                                            <TableCell>
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontFamily: 'monospace',
                                                  fontSize: '0.75rem',
                                                  color: subheaderColor
                                                }}
                                              >
                                                {truncateUid(sopInstanceUid)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell>
                                              {gridfsFileId ? (
                                                <Tooltip title="Preview DICOM">
                                                  <IconButton
                                                    size="small"
                                                    onClick={function(event) {
                                                      handlePreviewInstance(gridfsFileId, event);
                                                    }}
                                                    sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                                                  >
                                                    <ViewIcon fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              ) : (
                                                <Typography variant="body2" sx={{ color: subheaderColor }}>
                                                  -
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              {gridfsFileId ? (
                                                <Tooltip title={instanceIsKeyImage ? 'Remove Key Image' : 'Mark as Key Image'}>
                                                  <Checkbox
                                                    checked={instanceIsKeyImage}
                                                    onChange={function() {
                                                      handleKeyImageToggle(instance, study, keyImageDocRef);
                                                    }}
                                                    icon={<KeyImageOutlineIcon />}
                                                    checkedIcon={<KeyImageIcon sx={{ color: '#ffc107' }} />}
                                                    size="small"
                                                  />
                                                </Tooltip>
                                              ) : (
                                                <Typography variant="body2" sx={{ color: subheaderColor }}>
                                                  -
                                                </Typography>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </Box>
                              );
                            })
                          ) : (
                            <Typography variant="body2" sx={{ color: subheaderColor }}>
                              No series data available for this study.
                            </Typography>
                          )}

                          {/* Key Images summary */}
                          {studyDocRefs.filter(isKeyImage).length > 0 && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ color: cardTextColor, mb: 1 }}
                              >
                                Key Images ({studyDocRefs.filter(isKeyImage).length})
                              </Typography>
                            </Box>
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
    </Box>
  );
}

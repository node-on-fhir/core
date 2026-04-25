// imports/ui/DICOM/components/ImagingStudiesTable.jsx
// Table component for displaying FHIR ImagingStudy resources
// Shows Series and Instances in expanded row with Key Image toggle

import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import moment from 'moment';
import dicomParser from 'dicom-parser';
import { extractAllDicomMetadata } from '../utils/DicomFhirMapping';
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
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility as ViewIcon,
  Star as KeyImageIcon,
  StarBorder as KeyImageOutlineIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon
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
  const [deleteDialogStudy, setDeleteDialogStudy] = useState(null);

  // "Updated, not created" alert state — driven by navigation state from UploadPage
  const [updatedStudies, setUpdatedStudies] = useState([]);

  // Duplicate GridFS files alert state — driven by server method
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Track selected patient for conditional rendering
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Drop-zone state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState({
    uploading: false, progress: 0, total: 0, completed: 0, errors: []
  });

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
    const studiesHandle = Meteor.subscribe('selectedPatient.ImagingStudies', Session.get('selectedPatientId'), {});
    const docRefsHandle = Meteor.subscribe('selectedPatient.DocumentReferences', Session.get('selectedPatientId'), {});

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

  // ---------------------------------------------------------------------------
  // Drop-zone handlers
  // ---------------------------------------------------------------------------
  var handleDragOver = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  var handleDragLeave = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  var handleDrop = useCallback(function(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    var droppedFiles = Array.from(e.dataTransfer.files).filter(function(f) {
      return f.name.toLowerCase().endsWith('.dcm');
    });

    if (droppedFiles.length > 0) {
      uploadDicomFiles(droppedFiles);
    } else {
      console.warn('[ImagingStudiesTable] No .dcm files found in drop');
    }
  }, []);

  function uploadFileToGridFS(file, dicomMetadata) {
    return new Promise(function(resolve, reject) {
      var formData = new FormData();
      formData.append('dicomFile', file);

      if (dicomMetadata) {
        formData.append('dicomMetadata', JSON.stringify(dicomMetadata));
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/dicom/upload');

      var loginToken = localStorage.getItem('Meteor.loginToken');
      if (loginToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + loginToken);
      }

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (parseErr) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error('Upload failed with status ' + xhr.status));
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  }

  async function uploadDicomFiles(files) {
    setUploadState({ uploading: true, progress: 0, total: files.length, completed: 0, errors: [] });

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      try {
        // Parse DICOM metadata from the file
        var arrayBuffer = await file.arrayBuffer();
        var dicomMetadata = null;
        try {
          var dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
          dicomMetadata = extractAllDicomMetadata(dataSet);
        } catch (parseErr) {
          console.warn('[ImagingStudiesTable] Could not parse DICOM:', file.name, parseErr);
        }

        await uploadFileToGridFS(file, dicomMetadata);
        console.log('[ImagingStudiesTable] Uploaded:', file.name);

        setUploadState(function(prev) {
          return {
            uploading: prev.uploading,
            progress: ((prev.completed + 1) / prev.total) * 100,
            total: prev.total,
            completed: prev.completed + 1,
            errors: prev.errors
          };
        });
      } catch (err) {
        console.error('[ImagingStudiesTable] Upload error:', file.name, err);
        setUploadState(function(prev) {
          return {
            uploading: prev.uploading,
            progress: ((prev.completed + 1) / prev.total) * 100,
            total: prev.total,
            completed: prev.completed + 1,
            errors: prev.errors.concat(file.name + ': ' + err.message)
          };
        });
      }
    }

    setUploadState(function(prev) {
      return {
        uploading: false,
        progress: 100,
        total: prev.total,
        completed: prev.completed,
        errors: prev.errors
      };
    });

    // Regenerate studies after upload completes
    console.log('[ImagingStudiesTable] Upload complete, regenerating studies...');
    Meteor.call('dicom.regenerateAllImagingStudies', function(error, result) {
      if (error) {
        console.error('[ImagingStudiesTable] Post-upload regeneration error:', error);
      } else {
        console.log('[ImagingStudiesTable] Post-upload regeneration:', result);
      }
    });
  }

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

  // Open ImagingStudy detail page for editing
  function handleEditStudy(studyId, event) {
    event.stopPropagation();
    if (navigate) {
      navigate('/imaging-studies/' + studyId);
    }
  }

  // Open delete confirmation dialog
  function handleOpenDeleteDialog(study, event) {
    event.stopPropagation();
    setDeleteDialogStudy(study);
  }

  // Close delete confirmation dialog
  function handleCloseDeleteDialog() {
    setDeleteDialogStudy(null);
  }

  // Confirm delete of ImagingStudy
  function handleConfirmDelete() {
    if (!deleteDialogStudy) return;

    console.log('[ImagingStudiesTable] Deleting ImagingStudy:', deleteDialogStudy._id);
    Meteor.call('removeImagingStudy', deleteDialogStudy._id, function(error, result) {
      if (error) {
        console.error('[ImagingStudiesTable] Delete error:', error);
        alert('Error deleting study: ' + (error.reason || error.message));
      } else {
        console.log('[ImagingStudiesTable] ImagingStudy deleted:', result);
      }
    });

    setDeleteDialogStudy(null);
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
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        borderRadius: 1,
        border: isDragOver ? '2px solid' : '2px solid transparent',
        borderColor: isDragOver ? 'primary.main' : 'transparent',
        boxShadow: isDragOver ? '0 0 12px 2px rgba(144,202,249,0.4)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
    >
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

      {/* Alert: No patient selected */}
      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No patient selected.
        </Alert>
      )}

      {/* Upload progress */}
      {uploadState.uploading && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<UploadIcon />}>
          Uploading {uploadState.completed} of {uploadState.total} files...
          <LinearProgress variant="determinate" value={uploadState.progress} sx={{ mt: 1 }} />
        </Alert>
      )}

      {/* Upload complete */}
      {!uploadState.uploading && uploadState.total > 0 && uploadState.completed === uploadState.total && (
        <Alert
          severity={uploadState.errors.length > 0 ? 'warning' : 'success'}
          sx={{ mb: 2 }}
          onClose={function() { setUploadState({ uploading: false, progress: 0, total: 0, completed: 0, errors: [] }); }}
        >
          Uploaded {uploadState.completed - uploadState.errors.length} of {uploadState.total} files.
          {uploadState.errors.length > 0 && ' Errors: ' + uploadState.errors.join('; ')}
        </Alert>
      )}

      {/* Only show studies table, count, and regenerate button when patient is selected */}
      {selectedPatient && (
        <>
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
              <TableCell style={{ width: '140px', minWidth: '140px' }}>Actions</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Study Date</TableCell>
              <TableCell>Study Description</TableCell>
              <TableCell>Modality</TableCell>
              <TableCell>Accession #</TableCell>
              <TableCell>Study UID</TableCell>
              <TableCell>Referrer</TableCell>
              <TableCell>Body Part</TableCell>
              <TableCell>Series</TableCell>
              <TableCell>Images</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studies.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} align="center">
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

              // FHIR fields
              const patientDisplay = get(study, 'subject.display', '') || get(study, 'subject.reference', '-');
              const accessionIdentifier = get(study, 'identifier', []).find(function(id) {
                return get(id, 'type.coding.0.code') === 'ACSN';
              });
              const accessionNumber = accessionIdentifier ? accessionIdentifier.value : '-';
              const uidIdentifier = get(study, 'identifier', []).find(function(id) {
                return get(id, 'system') === 'urn:dicom:uid';
              });
              const studyInstanceUid = uidIdentifier ? truncateUid(uidIdentifier.value) : '-';
              const referrerDisplay = get(study, 'referrer.display', '-');
              const bodyPart = get(study, 'series.0.bodySite.display', '-');

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
                    <TableCell sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', minWidth: '140px' }}>
                      <IconButton
                        aria-label="open viewer"
                        size="small"
                        color="primary"
                        onClick={function(event) { handleOpenViewer(studyId, event); }}
                        sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton
                        aria-label="edit study"
                        size="small"
                        onClick={function(event) { handleEditStudy(studyId, event); }}
                        sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="delete study"
                        size="small"
                        onClick={function(event) { handleOpenDeleteDialog(study, event); }}
                        sx={{ color: isDark ? '#ef5350' : '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{patientDisplay}</TableCell>
                    <TableCell>{studyDate}</TableCell>
                    <TableCell>{description}</TableCell>
                    <TableCell>
                      <Chip label={modality} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{accessionNumber}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: subheaderColor }}
                      >
                        {studyInstanceUid}
                      </Typography>
                    </TableCell>
                    <TableCell>{referrerDisplay}</TableCell>
                    <TableCell>{bodyPart}</TableCell>
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
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={13}>
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
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteDialogStudy} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete ImagingStudy</DialogTitle>
        <DialogContent>
          <Typography>
            Delete study <strong>{deleteDialogStudy ? (deleteDialogStudy.description || deleteDialogStudy._id) : ''}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

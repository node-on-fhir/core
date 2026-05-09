// imports/ui/DICOM/components/DicomFilesTable.jsx
// Table component for displaying GridFS DICOM files metadata
// With preview button, link dialog, delete, and pagination

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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as PreviewIcon,
  Public as GlobeIcon,
  Link as ChainLinkIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AddCircle as CreateIcon,
  LinkOff as LinkToExistingIcon
} from '@mui/icons-material';

let useNavigate;
Meteor.startup(function() {
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

/**
 * DicomFilesTable - Displays GridFS DICOM file metadata
 * Shows raw files stored in dicom.files collection
 * With preview button, link/unlink, delete, and pagination
 */
export default function DicomFilesTable({ isDark, cardTextColor, subheaderColor, paperBgColor }) {
  const navigate = useNavigate ? useNavigate() : null;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [copiedFileId, setCopiedFileId] = useState(null);

  // Dialog state
  const [linkDialogFile, setLinkDialogFile] = useState(null);
  const [deleteDialogFile, setDeleteDialogFile] = useState(null);
  const [linkMode, setLinkMode] = useState(null); // 'create' or 'existing'
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Drop-zone state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState({
    uploading: false, progress: 0, total: 0, completed: 0, errors: []
  });

  // Fetch ImagingStudies for the link dialog
  const imagingStudies = useTracker(function() {
    const ImagingStudies = get(Meteor, 'Collections.ImagingStudies');
    if (!ImagingStudies) return [];
    return ImagingStudies.find({}, { sort: { 'started': -1 }, limit: 100 }).fetch();
  }, []);

  // Fetch files on mount and when pagination changes
  function fetchFiles(pageNum, rowsPerPageNum) {
    setLoading(true);
    setError(null);

    const skip = (pageNum !== undefined ? pageNum : page) * (rowsPerPageNum !== undefined ? rowsPerPageNum : rowsPerPage);
    const limit = rowsPerPageNum !== undefined ? rowsPerPageNum : rowsPerPage;

    Meteor.call('dicom.listGridFSFiles', { limit: limit, skip: skip }, function(err, result) {
      setLoading(false);

      if (err) {
        console.error('[DicomFilesTable] Error fetching files:', err);
        setError(err.reason || err.message || 'Failed to load DICOM files');
        return;
      }

      if (result) {
        console.log('[DicomFilesTable] Loaded files:', result.files.length, 'of', result.total);
        setFiles(result.files);
        setTotal(result.total);
      }
    });
  }

  useEffect(function() {
    fetchFiles(page, rowsPerPage);
  }, [page, rowsPerPage]);

  // Handle page change
  function handleChangePage(event, newPage) {
    setPage(newPage);
  }

  // Handle rows per page change
  function handleChangeRowsPerPage(event) {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }

  // Handle copy link button click
  function handleCopyLink(fileId, event) {
    event.stopPropagation();
    var url = window.location.origin + '/api/dicom/files/' + fileId;
    navigator.clipboard.writeText(url).then(function() {
      setCopiedFileId(fileId);
      setTimeout(function() { setCopiedFileId(null); }, 1500);
    });
  }

  // Handle preview button click
  function handlePreview(fileId, event) {
    event.stopPropagation();
    if (navigate) {
      navigate('/dicom/viewer?file=' + fileId);
    } else {
      window.open('/api/dicom/files/' + fileId, '_blank');
    }
  }

  // ---------------------------------------------------------------------------
  // Link dialog handlers
  // ---------------------------------------------------------------------------
  function handleOpenLinkDialog(file, event) {
    event.stopPropagation();
    setLinkDialogFile(file);
    setLinkMode(null);
    setSelectedStudy(null);
    setDialogLoading(false);
  }

  function handleCloseLinkDialog() {
    setLinkDialogFile(null);
    setLinkMode(null);
    setSelectedStudy(null);
    setDialogLoading(false);
  }

  function handleCreateNewStudy() {
    if (!linkDialogFile) return;
    setDialogLoading(true);

    Meteor.call('dicom.createOrUpdateImagingStudy', [linkDialogFile._id], {
      patientId: Session.get('selectedPatientId')
    }, function(err, result) {
      setDialogLoading(false);
      if (err) {
        console.error('[DicomFilesTable] Error creating study:', err);
        alert('Error creating study: ' + (err.reason || err.message));
        return;
      }
      console.log('[DicomFilesTable] Created study from file:', result);
      handleCloseLinkDialog();
      fetchFiles(page, rowsPerPage);
    });
  }

  function handleLinkToExisting() {
    if (!linkDialogFile || !selectedStudy) return;
    setDialogLoading(true);

    Meteor.call('imagingStudies.addGridfsFile', selectedStudy._id, linkDialogFile._id, function(err, result) {
      setDialogLoading(false);
      if (err) {
        console.error('[DicomFilesTable] Error linking file:', err);
        alert('Error linking file: ' + (err.reason || err.message));
        return;
      }
      console.log('[DicomFilesTable] Linked file to study:', result);
      handleCloseLinkDialog();
      fetchFiles(page, rowsPerPage);
    });
  }

  // ---------------------------------------------------------------------------
  // Delete handlers
  // ---------------------------------------------------------------------------
  function handleOpenDeleteDialog(file, event) {
    event.stopPropagation();
    setDeleteDialogFile(file);
  }

  function handleCloseDeleteDialog() {
    setDeleteDialogFile(null);
  }

  function handleConfirmDelete() {
    if (!deleteDialogFile) return;
    const fileId = deleteDialogFile._id;

    Meteor.call('dicom.deleteGridFSFile', fileId, function(err) {
      if (err) {
        console.error('[DicomFilesTable] Error deleting file:', err);
        alert('Error deleting file: ' + (err.reason || err.message));
      } else {
        console.log('[DicomFilesTable] Deleted file:', fileId);
      }
      handleCloseDeleteDialog();
      fetchFiles(page, rowsPerPage);
    });
  }

  // Format file size for display
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Truncate UID for display
  function truncateUid(uid, maxLength = 20) {
    if (!uid) return '-';
    if (uid.length <= maxLength) return uid;
    return uid.substring(0, maxLength) + '...';
  }

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
      console.warn('[DicomFilesTable] No .dcm files found in drop');
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
        var arrayBuffer = await file.arrayBuffer();
        var dicomMetadata = null;
        try {
          var dataSet = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
          dicomMetadata = extractAllDicomMetadata(dataSet);
        } catch (parseErr) {
          console.warn('[DicomFilesTable] Could not parse DICOM:', file.name, parseErr);
        }

        await uploadFileToGridFS(file, dicomMetadata);
        console.log('[DicomFilesTable] Uploaded:', file.name);

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
        console.error('[DicomFilesTable] Upload error:', file.name, err);
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

    // Refresh file list after upload
    console.log('[DicomFilesTable] Upload complete, refreshing file list...');
    fetchFiles(page, rowsPerPage);

    // Also regenerate studies
    Meteor.call('dicom.regenerateAllImagingStudies', function(error, result) {
      if (error) {
        console.error('[DicomFilesTable] Post-upload regeneration error:', error);
      } else {
        console.log('[DicomFilesTable] Post-upload regeneration:', result);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Helper to get a display label for an ImagingStudy in the autocomplete
  // ---------------------------------------------------------------------------
  function getStudyLabel(study) {
    const desc = get(study, 'description', '');
    const modalities = get(study, 'modality', []).map(function(m) { return get(m, 'code', ''); }).join(', ');
    const started = get(study, 'started', '');
    const id = get(study, '_id', '');
    const parts = [];
    if (desc) parts.push(desc);
    if (modalities) parts.push(modalities);
    if (started) parts.push(moment(started).format('MMM D, YYYY'));
    if (parts.length === 0) parts.push(id);
    return parts.join(' - ');
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, color: subheaderColor }}>Loading DICOM files...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: subheaderColor }}>
          Raw files stored in dicom.files GridFS collection ({total} total)
        </Typography>
        <Tooltip title="Refresh file list">
          <IconButton onClick={fetchFiles} size="small">
            <RefreshIcon />
          </IconButton>
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
        <Table size="small" id="dicomFilesTable">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '60px' }}>Preview</TableCell>
              <TableCell style={{ width: '60px' }}>URL</TableCell>
              <TableCell>Filename</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Modality</TableCell>
              <TableCell>Study Instance UID</TableCell>
              <TableCell>File ID</TableCell>
              <TableCell align="center">Linked</TableCell>
              <TableCell style={{ width: '60px' }}>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography
                    variant="body2"
                    sx={{ py: 3, color: subheaderColor }}
                  >
                    No DICOM files found in GridFS. Upload files to see them here.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {files.map(function(file) {
              const filename = file.filename || file.originalName || '-';
              const size = formatFileSize(file.length);
              const uploadDate = file.uploadDate
                ? moment(file.uploadDate).format('MMM D, YYYY h:mm A')
                : '-';
              const patientId = file.patientId || file.dicomPatientId || '-';
              const modality = file.modality || '-';
              const studyUid = file.studyInstanceUid;
              const seriesUid = file.seriesInstanceUid;
              const isLinked = !!(file.imagingStudyId || file.documentReferenceId);

              return (
                <TableRow
                  key={file._id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <TableCell>
                    <Tooltip title="Preview DICOM file">
                      <IconButton
                        size="small"
                        onClick={function(event) { handlePreview(file._id, event); }}
                        sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={copiedFileId === file._id ? 'Copied!' : 'Copy file URL'}>
                      <IconButton
                        size="small"
                        onClick={function(event) { handleCopyLink(file._id, event); }}
                        sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                      >
                        <GlobeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {filename}
                    </Typography>
                  </TableCell>
                  <TableCell>{size}</TableCell>
                  <TableCell>{uploadDate}</TableCell>
                  <TableCell>
                    {patientId !== '-' ? (
                      <Chip label={patientId} size="small" variant="outlined" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {modality !== '-' ? (
                      <Chip label={modality} size="small" variant="outlined" color="primary" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={studyUid || 'No Study UID'}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {truncateUid(studyUid)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={file._id}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {file._id}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {isLinked ? (
                      <Tooltip title={'Linked to ' + (file.imagingStudyId || file.documentReferenceId)}>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ChainLinkIcon />}
                          onClick={function(event) {
                            event.stopPropagation();
                            if (!navigate) return;
                            if (file.imagingStudyId) {
                              navigate('/imaging-studies/' + file.imagingStudyId + '?view=page');
                            } else if (file.documentReferenceId) {
                              navigate('/document-references/' + file.documentReferenceId);
                            }
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {truncateUid(file.imagingStudyId || file.documentReferenceId, 12)}
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ChainLinkIcon />}
                        onClick={function(event) { handleOpenLinkDialog(file, event); }}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Link
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete file">
                      <IconButton
                        size="small"
                        onClick={function(event) { handleOpenDeleteDialog(file, event); }}
                        sx={{ color: isDark ? '#ef5350' : '#d32f2f' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          color: cardTextColor,
          '& .MuiTablePagination-selectLabel': { color: subheaderColor },
          '& .MuiTablePagination-displayedRows': { color: subheaderColor },
          '& .MuiTablePagination-select': { color: cardTextColor },
          '& .MuiTablePagination-selectIcon': { color: subheaderColor }
        }}
      />

      {/* Link File Dialog */}
      <Dialog
        open={!!linkDialogFile}
        onClose={handleCloseLinkDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Link File to ImagingStudy
        </DialogTitle>
        <DialogContent>
          {linkDialogFile && (
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              {linkDialogFile.filename || linkDialogFile.originalName || linkDialogFile._id}
            </Typography>
          )}

          {!linkMode && (
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={handleCreateNewStudy}
              >
                <CreateIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="subtitle2">Create New Study</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Auto-create an ImagingStudy from this file
                </Typography>
              </Paper>
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={function() { setLinkMode('existing'); }}
              >
                <LinkToExistingIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                <Typography variant="subtitle2">Link to Existing Study</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Attach this file to an existing ImagingStudy
                </Typography>
              </Paper>
            </Box>
          )}

          {linkMode === 'existing' && (
            <Box sx={{ mt: 1 }}>
              <Autocomplete
                options={imagingStudies}
                getOptionLabel={getStudyLabel}
                value={selectedStudy}
                onChange={function(event, newValue) { setSelectedStudy(newValue); }}
                renderInput={function(params) {
                  return <TextField {...params} label="Select ImagingStudy" variant="outlined" fullWidth />;
                }}
                isOptionEqualToValue={function(option, value) { return option._id === value._id; }}
                sx={{ mt: 1 }}
              />
            </Box>
          )}

          {dialogLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLinkDialog} disabled={dialogLoading}>Cancel</Button>
          {linkMode === 'existing' && (
            <Button
              onClick={handleLinkToExisting}
              variant="contained"
              disabled={!selectedStudy || dialogLoading}
            >
              Link
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteDialogFile}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteDialogFile ? (deleteDialogFile.filename || deleteDialogFile.originalName || deleteDialogFile._id) : ''}</strong>?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

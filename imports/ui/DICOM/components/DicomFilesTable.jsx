// imports/ui/DICOM/components/DicomFilesTable.jsx
// Table component for displaying GridFS DICOM files metadata
// With preview button and pagination

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  CheckCircle as LinkedIcon,
  RadioButtonUnchecked as UnlinkedIcon,
  Refresh as RefreshIcon,
  Visibility as PreviewIcon
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
 * With preview button and pagination
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
    setPage(0); // Reset to first page
  }

  // Handle preview button click
  function handlePreview(fileId, event) {
    event.stopPropagation();
    if (navigate) {
      navigate('/dicom/viewer?file=' + fileId);
    } else {
      // Fallback: Open in new window via direct URL
      window.open('/api/dicom/files/' + fileId, '_blank');
    }
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
    <Box>
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
              <TableCell>Filename</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Patient ID</TableCell>
              <TableCell>Modality</TableCell>
              <TableCell>Study Instance UID</TableCell>
              <TableCell>Series Instance UID</TableCell>
              <TableCell align="center">Linked</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
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
                    <Tooltip title={seriesUid || 'No Series UID'}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {truncateUid(seriesUid)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {isLinked ? (
                      <Tooltip title="Linked to ImagingStudy or DocumentReference">
                        <LinkedIcon color="success" fontSize="small" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Not yet linked to FHIR resources">
                        <UnlinkedIcon sx={{ color: subheaderColor }} fontSize="small" />
                      </Tooltip>
                    )}
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
    </Box>
  );
}

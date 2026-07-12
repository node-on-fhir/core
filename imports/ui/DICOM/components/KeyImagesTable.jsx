// imports/ui/DICOM/components/KeyImagesTable.jsx
// Table component for displaying DocumentReference resources (Key Images)
// Uses isKeyImage utility for loosely coupled detection

import React from 'react';
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
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Star as KeyImageIcon,
  Link as LinkIcon,
  Visibility as ViewIcon,
  ImageSearch as PreviewIcon
} from '@mui/icons-material';

// Import Key Image detection utility
import { isKeyImage } from '../utils/KeyImageUtils';

let useNavigate;
Meteor.startup(function() {
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

/**
 * KeyImagesTable - Displays DocumentReference resources for Key Images
 * Key Images are saved screenshots or annotations from DICOM studies
 */
export default function KeyImagesTable({ isDark, cardTextColor, subheaderColor, paperBgColor }) {
  const navigate = useNavigate ? useNavigate() : null;

  // Subscribe to DocumentReference collection and filter for Key Images
  const { keyImages, loading } = useTracker(function() {
    console.log('[KeyImagesTable] useTracker running...');

    // CRITICAL: Subscribe to autopublish publication to receive data from server
    const docRefsHandle = Meteor.subscribe('selectedPatient.DocumentReferences', Session.get('selectedPatientId'), {});

    const DocumentReferences = Meteor.Collections?.DocumentReferences;

    if (!DocumentReferences) {
      console.warn('[KeyImagesTable] DocumentReferences collection not available');
      return { keyImages: [], loading: true };
    }

    // Fetch all DocumentReferences and filter using the loosely coupled isKeyImage utility
    // This allows multiple detection strategies (meta.tag, type.coding, category, type.text)
    const allDocRefs = DocumentReferences.find({}).fetch();
    const filteredKeyImages = allDocRefs.filter(isKeyImage);

    console.log('[KeyImagesTable] Found Key Images:', filteredKeyImages.length, 'of', allDocRefs.length, 'total DocumentReferences');

    return {
      keyImages: filteredKeyImages,
      loading: !docRefsHandle.ready()
    };
  }, []);

  // Navigate to linked ImagingStudy
  function handleViewStudy(studyRef, event) {
    event.stopPropagation();
    if (navigate && studyRef) {
      const studyId = studyRef.replace('ImagingStudy/', '');
      navigate('/dicom/viewer/' + studyId);
    }
  }

  // Get linked ImagingStudy reference
  function getLinkedStudyRef(docRef) {
    const related = get(docRef, 'context.related', []);
    const studyRelated = related.find(function(ref) {
      return ref.reference && ref.reference.startsWith('ImagingStudy/');
    });
    return studyRelated ? studyRelated.reference : null;
  }

  // Format file size
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // Extract GridFS file ID from DocumentReference attachment URL
  function getGridfsFileIdFromDocRef(docRef) {
    const url = get(docRef, 'content.0.attachment.url', '');
    // Extract fileId from URL like "/api/dicom/files/6984c13eea57514dc5c2e78e"
    const match = url.match(/\/api\/dicom\/files\/([a-f0-9]+)$/);
    return match ? match[1] : null;
  }

  // Navigate to DICOM viewer for Key Image preview
  function handlePreviewKeyImage(gridfsFileId, event) {
    event.stopPropagation();
    if (navigate && gridfsFileId) {
      navigate('/dicom/viewer?file=' + gridfsFileId);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={40} />
        <Typography sx={{ ml: 2, color: subheaderColor }}>Loading key images...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: subheaderColor, mb: 2 }}>
        DocumentReference resources for saved Key Images ({keyImages.length} total)
      </Typography>

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
        <Table size="small" id="keyImagesTable">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '50px' }} />
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Content Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Linked Study</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {keyImages.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography
                    variant="body2"
                    sx={{ py: 3, color: subheaderColor }}
                  >
                    No key images saved. Use the viewer to save key images from DICOM studies.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {keyImages.map(function(docRef) {
              const date = docRef.date
                ? moment(docRef.date).format('MMM D, YYYY h:mm A')
                : '-';
              const description = docRef.description || '-';
              const typeText = get(docRef, 'type.text',
                get(docRef, 'type.coding.0.display', '-'));
              const contentType = get(docRef, 'content.0.attachment.contentType', '-');
              const size = get(docRef, 'content.0.attachment.size');
              const sizeStr = formatFileSize(size);
              const status = docRef.status || 'current';
              const linkedStudyRef = getLinkedStudyRef(docRef);
              const gridfsFileId = getGridfsFileIdFromDocRef(docRef);

              return (
                <TableRow
                  key={docRef._id}
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <TableCell>
                    <KeyImageIcon sx={{ color: '#ffc107' }} fontSize="small" />
                  </TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell>{description}</TableCell>
                  <TableCell>
                    <Chip label={typeText} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {contentType}
                    </Typography>
                  </TableCell>
                  <TableCell>{sizeStr}</TableCell>
                  <TableCell>
                    {gridfsFileId ? (
                      <Tooltip title="Preview DICOM image">
                        <IconButton
                          size="small"
                          onClick={function(event) { handlePreviewKeyImage(gridfsFileId, event); }}
                          sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                          aria-label="Preview DICOM image"
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: subheaderColor }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {linkedStudyRef ? (
                      <Tooltip title="View linked ImagingStudy">
                        <IconButton
                          size="small"
                          onClick={function(event) { handleViewStudy(linkedStudyRef, event); }}
                          sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                          aria-label="View linked ImagingStudy"
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" sx={{ color: subheaderColor }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status}
                      size="small"
                      color={status === 'current' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

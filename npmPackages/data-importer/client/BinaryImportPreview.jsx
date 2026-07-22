// packages/data-importer/client/BinaryImportPreview.jsx
//
// Left-column UI for binary file import (.dcm, .wav, .pdf, .mp4, .jpg, .jpeg, .png).
// Displays classified files, generates FHIR resources locally (no upload).
// Upload to GridFS is deferred to ImportDialog when "Permanent (Database)" is chosen.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
  Alert,
  AlertTitle
} from '@mui/material';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import { get } from 'lodash';

import { buildImportBundle } from '../lib/FhirResourceBuilder';
import { extractAllDicomMetadataFromArrayBuffer, flattenDicomMetadataForGridFS } from '/imports/ui/DICOM/utils/DcmjsMetadata';

// Icon lookup by classifier icon name
var FILE_ICONS = {
  'AudioFile': AudioFileIcon,
  'PictureAsPdf': PictureAsPdfIcon,
  'Description': DescriptionIcon,
  'Image': ImageIcon,
  'Movie': MovieIcon
};

/**
 * Format file size for display.
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Generate a UID-like string for DICOM metadata.
 * @returns {string}
 */
function generateUid() {
  var randomArray = new Uint32Array(1);
  globalThis.crypto.getRandomValues(randomArray);
  var randomPart = randomArray[0] % 1000000;
  return '2.25.' + Date.now() + '.' + randomPart;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function BinaryImportPreview(props) {
  var files = props.files || [];
  var onImportComplete = props.onImportComplete;
  var onClear = props.onClear;
  var isDark = props.isDark;

  // Upload state
  var uploadingState = useState(false);
  var uploading = uploadingState[0];
  var setUploading = uploadingState[1];

  var progressState = useState({});
  var progress = progressState[0];
  var setProgress = progressState[1];

  var errorState = useState(null);
  var error = errorState[0];
  var setError = errorState[1];

  var completedState = useState(false);
  var completed = completedState[0];
  var setCompleted = completedState[1];

  var resourceSummaryState = useState(null);
  var resourceSummary = resourceSummaryState[0];
  var setResourceSummary = resourceSummaryState[1];

  var duplicateWarningState = useState(null);
  var duplicateWarning = duplicateWarningState[0];
  var setDuplicateWarning = duplicateWarningState[1];

  // Theme colors
  var cardBgColor = isDark ? '#2a2a2a' : '#f5f5f5';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  var borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  function getFileIcon(iconName) {
    var IconComponent = FILE_ICONS[iconName] || DescriptionIcon;
    return IconComponent;
  }

  async function handleGenerateResources() {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setCompleted(false);
    setResourceSummary(null);
    setDuplicateWarning(null);

    // Shared study UID for all files in this drop
    var studyInstanceUid = generateUid();

    try {
      // Check for duplicate files already in GridFS
      var filenames = files.map(function(f) { return f.file.name; });
      var duplicateResult;
      try {
        duplicateResult = await Meteor.rpc('dicom.checkExistingFiles', { filenames: filenames });
      } catch (err) {
        console.warn('[BinaryImportPreview] Duplicate check failed:', err.reason);
        duplicateResult = { matches: [] };
      }

      if (duplicateResult.matches && duplicateResult.matches.length > 0) {
        console.log('[BinaryImportPreview] Found', duplicateResult.matches.length, 'existing files');
        setDuplicateWarning(duplicateResult.matches);
      }

      // Build uploadedFiles array with empty placeholders (no actual upload)
      var uploadedFiles = [];
      var fileMetadata = [];

      for (var idx = 0; idx < files.length; idx++) {
        var classifiedFile = files[idx];
        var file = classifiedFile.file;
        var fileType = classifiedFile.type;
        var fileLabel = classifiedFile.label;

        var metadata = {
          contentType: get({ 'dicom': 'application/dicom', 'dicom-ecg': 'application/dicom', 'ecg-wav': 'audio/wav', 'pcg-wav': 'audio/wav', 'pdf': 'application/pdf', 'video': 'video/mp4', 'image': 'image/jpeg' }, fileType, 'application/octet-stream'),
          modality: get({ 'dicom': 'OT', 'dicom-ecg': 'ECG', 'ecg-wav': 'AU', 'pcg-wav': 'AU', 'pdf': 'OT', 'video': 'OT', 'image': 'OT' }, fileType, 'OT'),
          studyInstanceUid: studyInstanceUid,
          seriesInstanceUid: generateUid(),
          sopInstanceUid: generateUid()
        };

        // Parse .dcm files with dcmjs for real tag-level metadata instead of
        // extension guesses; the filename-derived UIDs above remain the
        // fallback for unparseable files
        var parsedDicom = null;
        var dicomDataset = null;
        var dicomLocalBlobUrl = null;
        if (fileType === 'dicom' || fileType === 'dicom-ecg') {
          // Transient blob URL so the DICOM viewer can render pixels at
          // import time, before the GridFS upload assigns a real fileId
          dicomLocalBlobUrl = URL.createObjectURL(file);
          var dicomArrayBuffer = await file.arrayBuffer();
          var parsedMetadata = extractAllDicomMetadataFromArrayBuffer(dicomArrayBuffer);
          if (parsedMetadata) {
            // Naturalized dcmjs dataset (non-enumerable rider) — feeds the
            // @dcmjs/fhir builders (Patient stub, ImagingStudy) downstream
            dicomDataset = parsedMetadata.dataset || null;
            parsedDicom = flattenDicomMetadataForGridFS(parsedMetadata);
            Object.keys(parsedDicom).forEach(function(key) {
              if (parsedDicom[key] !== undefined && parsedDicom[key] !== null) {
                metadata[key] = parsedDicom[key];
              }
            });

            // Reclassify from the real Modality tag rather than filename sniffing
            if (parsedDicom.modality === 'ECG') {
              fileType = 'dicom-ecg';
              fileLabel = 'DICOM ECG';
            } else if (parsedDicom.modality) {
              fileType = 'dicom';
              fileLabel = 'DICOM Image';
            }
          } else {
            console.warn('[BinaryImportPreview] Could not parse DICOM tags from', file.name, '- using filename-derived metadata');
          }
        }

        uploadedFiles.push({
          type: fileType,
          label: fileLabel,
          fileName: file.name,
          fileSize: file.size,
          contentType: metadata.contentType,
          gridfsFileId: '',
          gridfsUrl: '',
          dicomMetadata: parsedDicom,
          dataset: dicomDataset,
          localBlobUrl: dicomLocalBlobUrl,
          wavMeta: classifiedFile.wavMeta || null,
          wavSamples: classifiedFile.wavSamples || null,
          wavSamplesMeta: classifiedFile.wavSamplesMeta || null
        });

        fileMetadata.push(metadata);
      }

      // Generate FHIR resources locally (no upload)
      console.log('[BinaryImportPreview] Generating FHIR resources (no upload)');

      var patient = Session.get('selectedPatient');
      var patientId = Session.get('selectedPatientId');

      var buildOptions = {
        deviceManufacturer: 'Eko Health',
        deviceName: 'Eko DUO Digital Stethoscope + ECG'
      };

      if (patientId) {
        buildOptions.patientId = patientId;
        buildOptions.patientDisplay = get(patient, 'name.0.text',
          (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', '')).trim()
        );
      }

      var resources = buildImportBundle(uploadedFiles, buildOptions);
      console.log('[BinaryImportPreview] Generated', resources.length, 'FHIR resources');

      // Build summary for display
      var summary = {};
      for (var r = 0; r < resources.length; r++) {
        var rt = get(resources[r], 'resourceType', 'Unknown');
        summary[rt] = (summary[rt] || 0) + 1;
      }
      setResourceSummary(summary);

      setCompleted(true);
      setUploading(false);

      // Notify parent with resources AND pending upload info
      var pendingUploadInfo = {
        classifiedFiles: files,
        fileMetadata: fileMetadata
      };

      if (onImportComplete) {
        onImportComplete(resources, pendingUploadInfo);
      }
    } catch (err) {
      console.error('[BinaryImportPreview] Generate error:', err);
      setError(err.message || 'Resource generation failed');
      setUploading(false);
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* File list */}
      {files.map(function(classifiedFile, idx) {
        var IconComponent = getFileIcon(classifiedFile.icon);

        return (
          <Card key={idx} variant="outlined" sx={{
            bgcolor: cardBgColor,
            borderColor: borderColor,
            '& .MuiCardContent-root': { py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconComponent sx={{
                  fontSize: 28,
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{
                    color: cardTextColor,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {classifiedFile.file.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={classifiedFile.label}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: textSecondary
                      }}
                    />
                    <Typography variant="caption" sx={{ color: textSecondary }}>
                      {formatFileSize(classifiedFile.file.size)}
                    </Typography>
                    {classifiedFile.wavMeta ? (
                      <Typography variant="caption" sx={{ color: textSecondary }}>
                        {classifiedFile.wavMeta.sampleRateHz} Hz
                        {classifiedFile.wavMeta.durationSec ? ' / ' + classifiedFile.wavMeta.durationSec + 's' : ''}
                        {classifiedFile.wavMeta.channels ? ' / ' + classifiedFile.wavMeta.channels + 'ch' : ''}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
                {completed ? (
                  <CheckCircleIcon sx={{ fontSize: 20, color: isDark ? '#66bb6a' : '#2e7d32' }} />
                ) : null}
              </Box>

              {/* Generating spinner (visible during generation) */}
              {uploading ? (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                </Box>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {/* Duplicate warning */}
      {duplicateWarning && duplicateWarning.length > 0 ? (
        <Alert severity="warning" sx={{
          bgcolor: isDark ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.1)',
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#ffa726' : '#ed6c02' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}>
          <AlertTitle>Duplicate Files Detected</AlertTitle>
          {duplicateWarning.length} file{duplicateWarning.length !== 1 ? 's' : ''} already exist in GridFS:
          {duplicateWarning.map(function(match) {
            return (
              <Typography key={match._id} variant="caption" component="div" sx={{ color: textSecondary, mt: 0.5 }}>
                {match.originalName} — ID: {match._id} ({match.url})
              </Typography>
            );
          })}
        </Alert>
      ) : null}

      {/* Error message */}
      {error ? (
        <Alert severity="error" sx={{
          bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}>
          <AlertTitle>Generation Failed</AlertTitle>
          {error}
        </Alert>
      ) : null}

      {/* Resource summary (after successful generation) */}
      {completed && resourceSummary ? (
        <Alert severity="success" sx={{
          bgcolor: isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#66bb6a' : '#2e7d32' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}>
          <AlertTitle>Resources Generated</AlertTitle>
          {Object.keys(resourceSummary).map(function(rt) {
            return rt + ': ' + resourceSummary[rt];
          }).join(', ')}
        </Alert>
      ) : null}

      {/* Generate button */}
      {!completed ? (
        <Button
          variant="contained"
          startIcon={<BuildIcon />}
          onClick={handleGenerateResources}
          disabled={files.length === 0 || uploading}
          fullWidth
          sx={{ mt: 1 }}
        >
          {uploading ? 'Generating...' : 'Generate Resources'}
        </Button>
      ) : null}

      {/* File count summary */}
      <Typography variant="caption" sx={{ color: textSecondary, textAlign: 'center' }}>
        {files.length} file{files.length !== 1 ? 's' : ''} selected for import
      </Typography>
    </Box>
  );
}

export { BinaryImportPreview };
export default BinaryImportPreview;

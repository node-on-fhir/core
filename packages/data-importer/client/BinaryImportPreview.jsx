// packages/data-importer/client/BinaryImportPreview.jsx
//
// Left-column UI for binary medical file import (.dcm, .wav, .pdf).
// Displays classified files, handles upload to GridFS, generates FHIR resources.

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { get } from 'lodash';

import { buildImportBundle } from '../lib/FhirResourceBuilder';

// Icon lookup by classifier icon name
var FILE_ICONS = {
  'AudioFile': AudioFileIcon,
  'PictureAsPdf': PictureAsPdfIcon,
  'Description': DescriptionIcon
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
 * Upload a single file to GridFS via the DICOM upload endpoint.
 *
 * @param {File} file
 * @param {object} metadata - { contentType, modality, studyInstanceUid, seriesInstanceUid, sopInstanceUid }
 * @param {function} onProgress - callback(percentComplete)
 * @returns {Promise<{ fileId: string, url: string, filename: string, size: number }>}
 */
function uploadFileToGridFS(file, metadata, onProgress) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();

    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = JSON.parse(xhr.responseText);
          if (response.success) {
            resolve({
              fileId: response.fileId,
              url: response.url,
              filename: response.filename,
              size: response.size
            });
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid server response'));
        }
      } else {
        var errorMsg = 'Upload failed (HTTP ' + xhr.status + ')';
        try {
          var errBody = JSON.parse(xhr.responseText);
          if (errBody.error) errorMsg = errBody.error;
        } catch (e) {
          // use default message
        }
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = function() {
      reject(new Error('Network error during upload'));
    };

    xhr.open('POST', '/api/dicom/upload');

    // Auth header
    var token = Meteor._localStorage.getItem('Meteor.loginToken');
    if (token) {
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    }

    // Build FormData
    var formData = new FormData();
    formData.append('dicomFile', file, file.name);
    formData.append('dicomMetadata', JSON.stringify(metadata));

    xhr.send(formData);
  });
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

  // Theme colors
  var cardBgColor = isDark ? '#2a2a2a' : '#f5f5f5';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  var borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  function getFileIcon(iconName) {
    var IconComponent = FILE_ICONS[iconName] || DescriptionIcon;
    return IconComponent;
  }

  async function handleUploadAndGenerate() {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setCompleted(false);
    setResourceSummary(null);

    // Shared study UID for all files in this drop
    var studyInstanceUid = generateUid();

    var uploadedFiles = [];
    var initialProgress = {};
    for (var i = 0; i < files.length; i++) {
      initialProgress[i] = 0;
    }
    setProgress(initialProgress);

    try {
      for (var idx = 0; idx < files.length; idx++) {
        var classifiedFile = files[idx];
        var file = classifiedFile.file;
        var fileIndex = idx;

        // Build metadata for this file
        var metadata = {
          contentType: get({ 'dicom': 'application/dicom', 'ecg-wav': 'audio/wav', 'pcg-wav': 'audio/wav', 'pdf': 'application/pdf' }, classifiedFile.type, 'application/octet-stream'),
          modality: get({ 'dicom': 'ECG', 'ecg-wav': 'AU', 'pcg-wav': 'AU', 'pdf': 'OT' }, classifiedFile.type, 'OT'),
          studyInstanceUid: studyInstanceUid,
          seriesInstanceUid: generateUid(),
          sopInstanceUid: generateUid()
        };

        // Upload
        var response = await uploadFileToGridFS(
          file,
          metadata,
          function(percent) {
            setProgress(function(prev) {
              var updated = {};
              for (var key in prev) {
                updated[key] = prev[key];
              }
              updated[fileIndex] = percent;
              return updated;
            });
          }
        );

        // Mark complete
        setProgress(function(prev) {
          var updated = {};
          for (var key in prev) {
            updated[key] = prev[key];
          }
          updated[fileIndex] = 100;
          return updated;
        });

        uploadedFiles.push({
          type: classifiedFile.type,
          label: classifiedFile.label,
          fileName: file.name,
          fileSize: file.size,
          contentType: metadata.contentType,
          gridfsFileId: response.fileId,
          gridfsUrl: response.url,
          wavMeta: classifiedFile.wavMeta || null,
          wavSamples: classifiedFile.wavSamples || null,
          wavSamplesMeta: classifiedFile.wavSamplesMeta || null
        });
      }

      // All uploads complete — generate FHIR resources
      console.log('[BinaryImportPreview] All uploads complete, generating FHIR resources');

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

      // Notify parent
      if (onImportComplete) {
        onImportComplete(resources);
      }
    } catch (err) {
      console.error('[BinaryImportPreview] Upload error:', err);
      setError(err.message || 'Upload failed');
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
        var fileProgress = get(progress, idx.toString(), 0);
        var isUploaded = fileProgress === 100;

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
                {isUploaded ? (
                  <CheckCircleIcon sx={{ fontSize: 20, color: isDark ? '#66bb6a' : '#2e7d32' }} />
                ) : null}
              </Box>

              {/* Upload progress bar (visible during upload) */}
              {uploading && !isUploaded ? (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress
                    variant={fileProgress > 0 ? 'determinate' : 'indeterminate'}
                    value={fileProgress}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {/* Error message */}
      {error ? (
        <Alert severity="error" sx={{
          bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
          color: cardTextColor,
          '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
          '& .MuiAlertTitle-root': { color: cardTextColor }
        }}>
          <AlertTitle>Upload Failed</AlertTitle>
          {error}
        </Alert>
      ) : null}

      {/* Resource summary (after successful upload) */}
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

      {/* Upload button */}
      {!completed ? (
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={handleUploadAndGenerate}
          disabled={files.length === 0 || uploading}
          fullWidth
          sx={{ mt: 1 }}
        >
          {uploading ? 'Uploading...' : 'Upload & Generate Resources'}
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

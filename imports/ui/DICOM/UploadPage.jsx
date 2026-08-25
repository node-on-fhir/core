// imports/ui/DICOM/UploadPage.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Transform as ConvertIcon,
  Security as ShieldIcon
} from '@mui/icons-material';
import SimpleDicomViewport from './components/SimpleDicomViewport';
import DicomDeidentifyControls, { DEFAULT_DEID_CONTROLS, buildProcessingOptions } from './components/DicomDeidentifyControls';
import DicomTagDiffTable from './components/DicomTagDiffTable';
import moment from 'moment';

// DICOM parsing imports (dcmjs with dicom-parser fallback)
import { extractAllDicomMetadataFromArrayBuffer, flattenDicomMetadataForGridFS, isDicomPart10 } from './utils/DcmjsMetadata';
// In-browser de-identification / tag filtering (dcmjs event-stream pipeline)
import { processDicomArrayBuffer, createBatchUidMapper, diffDicomTags } from './utils/DicomProcessing';

// Video file detection
function isVideoFile(file) {
  const name = file.name.toLowerCase();
  return name.endsWith('.mp4') || file.type === 'video/mp4';
}

// Generate shared study/series metadata for a batch of video files
function generateVideoStudyMetadata() {
  return {
    studyInstanceUid: crypto.randomUUID(),
    seriesInstanceUid: crypto.randomUUID(),
    modality: 'US',
    studyDate: moment().format('YYYYMMDD'),
    studyDescription: 'Ultrasound Video'
  };
}

// Build per-file metadata for a video file (mirrors DICOM metadata shape)
function buildVideoFileMetadata(file, batchMeta, instanceNumber) {
  return {
    studyInstanceUid: batchMeta.studyInstanceUid,
    seriesInstanceUid: batchMeta.seriesInstanceUid,
    sopInstanceUid: crypto.randomUUID(),
    sopClassUid: '1.2.840.10008.5.1.4.1.1.6.1', // Ultrasound Image Storage
    modality: 'US',
    studyDate: batchMeta.studyDate,
    studyDescription: batchMeta.studyDescription,
    seriesDescription: 'Ultrasound Video Series',
    instanceNumber: instanceNumber,
    contentType: 'video/mp4'
  };
}

// Theme hook
let useAppTheme;
let useNavigate;
let useSearchParams;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
    useSearchParams = window.ReactRouter.useSearchParams;
  }
});

function UploadPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Parse URL parameters for navigation
  let backUrl = null;
  let nextUrl = null;
  var patientParam = null;
  var serviceRequestParam = null;
  if (useSearchParams) {
    const searchParamsResult = useSearchParams();
    const searchParams = searchParamsResult[0];
    backUrl = searchParams.get('back');
    nextUrl = searchParams.get('next');
    patientParam = searchParams.get('patient');
    serviceRequestParam = searchParams.get('servicerequest');
  }

  // Build forwarding query string for patient and servicerequest params
  var forwardParams = '';
  if (patientParam) {
    forwardParams += (forwardParams ? '&' : '?') + 'patient=' + encodeURIComponent(patientParam);
  }
  if (serviceRequestParam) {
    forwardParams += (forwardParams ? '&' : '?') + 'servicerequest=' + encodeURIComponent(serviceRequestParam);
  }

  // Get theme colors from settings
  const cardBgColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardColor', '#1e1e1e')
    : '#ffffff';
  const cardTextColor = isDark
    ? get(Meteor, 'settings.public.theme.palette.cardTextColor', 'rgba(255, 255, 255, 0.87)')
    : 'rgba(0, 0, 0, 0.87)';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Upload state
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState([]);
  const [error, setError] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [converting, setConverting] = useState(false);

  // De-identification / tag filter controls (shared control bag —
  // see DicomDeidentifyControls)
  const [deidControls, setDeidControls] = useState(DEFAULT_DEID_CONTROLS);
  // Pre-upload preview: blob URL of the first selected DICOM file, and the
  // processed variant + tag diff after "Preview de-identified"
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  // Per-file phase label shown with the progress bar during upload
  const [processingPhase, setProcessingPhase] = useState(null);

  // Maintain the pre-upload preview blob URL for the first DICOM file.
  // Magic-byte check reads only the first 132 bytes — no full-file load.
  useEffect(function() {
    let cancelled = false;
    setProcessedPreview(function(prev) {
      if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
      return null;
    });
    setOriginalPreviewUrl(function(prev) {
      if (prev) { URL.revokeObjectURL(prev); }
      return null;
    });

    const firstFile = files[0];
    if (!firstFile || isVideoFile(firstFile)) {
      return;
    }
    firstFile.slice(0, 132).arrayBuffer().then(function(head) {
      if (!cancelled && isDicomPart10(head)) {
        setOriginalPreviewUrl(URL.createObjectURL(firstFile));
      }
    }).catch(function() {
      // not previewable — leave the preview hidden
    });
    return function() { cancelled = true; };
  }, [files]);

  // A control change invalidates any processed preview/diff on display
  useEffect(function() {
    setProcessedPreview(function(prev) {
      if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
      return null;
    });
  }, [deidControls]);

  // Handle file selection
  const handleFileSelect = function(event) {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    setUploadResults([]);
    setError(null);
  };

  // Handle drag and drop
  const handleDrop = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
    setUploadResults([]);
    setError(null);
  }, []);

  const handleDragOver = useCallback(function(event) {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Handle file removal
  const handleRemoveFile = function(index) {
    setFiles(function(prevFiles) {
      return prevFiles.filter(function(_, i) {
        return i !== index;
      });
    });
  };

  // Helper: Upload a single file to GridFS via HTTP
  // Uses XHR for real upload progress tracking
  // Now accepts optional dicomMetadata to store DICOM UIDs in GridFS
  const uploadFileToGridFS = function(file, onProgress, dicomMetadata) {
    return new Promise(function(resolve, reject) {
      const formData = new FormData();
      formData.append('dicomFile', file);

      // Include parsed DICOM metadata if available
      if (dicomMetadata) {
        formData.append('dicomMetadata', JSON.stringify(dicomMetadata));
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/dicom/upload');

      // Send Meteor login token for authentication
      const loginToken = localStorage.getItem('Meteor.loginToken');
      if (loginToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + loginToken);
      }

      // Real byte-level progress tracking
      xhr.upload.onprogress = function(event) {
        if (event.lengthComputable && onProgress) {
          onProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else if (xhr.status === 401) {
          reject(new Error('Unauthorized. Please log in and try again.'));
        } else if (xhr.status === 429) {
          reject(new Error('Rate limit exceeded. Please wait and try again.'));
        } else if (xhr.status === 503) {
          reject(new Error('DICOM storage not available. GridFS may not be initialized.'));
        } else {
          try {
            const errBody = JSON.parse(xhr.responseText);
            reject(new Error(errBody.error || 'Upload failed'));
          } catch (e) {
            reject(new Error('Upload failed with status ' + xhr.status));
          }
        }
      };

      xhr.onerror = function() {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  };

  // Handle upload (stores file in GridFS, creates FHIR resources)
  const handleUpload = async function() {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const results = [];
    let firstPreviewFile = null;

    // Pre-generate shared metadata for video files in this batch
    const hasVideoFiles = files.some(isVideoFile);
    const videoBatchMeta = hasVideoFiles ? generateVideoStudyMetadata() : null;
    let videoInstanceCounter = 0;

    // One UID mapper per batch: the same original StudyInstanceUID maps to
    // the same replacement across every file, so regenerated studies still
    // aggregate into one ImagingStudy.
    const batchUidMapper = createBatchUidMapper();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Generate metadata: video files get synthetic metadata, DICOM files
        // run through the (optional) de-identify/filter pipeline
        let dicomMetadata;
        let uploadFile = file;
        if (isVideoFile(file)) {
          videoInstanceCounter++;
          dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
          console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
        } else {
          console.log('[UploadPage] Processing', file.name, '(' + file.size + ' bytes)...');
          setProcessingPhase('Processing ' + (i + 1) + ' of ' + files.length + '…');
          const prepared = await prepareDicomFileForUpload(file, batchUidMapper);
          uploadFile = prepared.uploadFile;
          dicomMetadata = prepared.dicomMetadata;
        }

        // Upload file to GridFS via HTTP (with metadata)
        console.log('[UploadPage] Uploading', file.name, 'to GridFS...');
        setProcessingPhase('Uploading ' + (i + 1) + ' of ' + files.length + '…');

        const uploadResult = await uploadFileToGridFS(uploadFile, function(fileProgress) {
          // Combine per-file progress with overall progress
          const overallProgress = ((i + fileProgress / 100) / files.length) * 100;
          setUploadProgress(overallProgress);
        }, dicomMetadata);

        console.log('[UploadPage] GridFS upload complete:', uploadResult.fileId, uploadResult.url);

        // Store result for later aggregation (don't create FHIR resources per-file)
        results.push({
          filename: file.name,
          success: true,
          fileId: uploadResult.fileId,
          message: 'Uploaded to GridFS with DICOM metadata'
        });

        // Save the first file for preview — the PROCESSED bytes, so what you
        // see is what was stored
        if (!firstPreviewFile) {
          firstPreviewFile = uploadFile;
        }
      } catch (err) {
        console.error('Upload error for', file.name, ':', err);
        results.push({
          filename: file.name,
          success: false,
          error: err.message || 'Upload failed'
        });
      }
    }

    // After all files uploaded, create aggregated ImagingStudy resources
    const successfulFileIds = results
      .filter(function(r) { return r.success && r.fileId; })
      .map(function(r) { return r.fileId; });

    if (successfulFileIds.length > 0) {
      console.log('[UploadPage] Creating aggregated ImagingStudy for', successfulFileIds.length, 'files');

      try {
        var uploadMethodOptions = {};
        if (patientParam) {
          uploadMethodOptions.patientId = patientParam;
        }
        if (serviceRequestParam) {
          uploadMethodOptions.serviceRequestId = serviceRequestParam;
        }

        const aggregationResult = await Meteor.rpc('dicom.createOrUpdateImagingStudy', { gridfsFileIds: successfulFileIds, options: uploadMethodOptions });

        console.log('[UploadPage] ImagingStudy aggregation result:', aggregationResult);

        // Update results with aggregation info
        if (aggregationResult.studies && aggregationResult.studies.length > 0) {
          const studyInfo = aggregationResult.studies.map(function(s) {
            return s.action + ' ImagingStudy with ' + s.instanceCount + ' instances';
          }).join(', ');

          results.forEach(function(r) {
            if (r.success) {
              r.message = r.message + ' (' + studyInfo + ')';
            }
          });
        }
      } catch (aggregationError) {
        console.error('[UploadPage] ImagingStudy aggregation error:', aggregationError);
        // Don't fail the whole upload, just log the error
      }
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress(100);
    setProcessingPhase(null);

    // Show preview for first successfully uploaded file
    const successCount = results.filter(function(r) { return r.success; }).length;
    if (successCount > 0 && firstPreviewFile) {
      // Create a local blob URL from the File object for preview
      // This avoids base64 encoding - the blob URL points directly to the File in memory
      const previewUrl = URL.createObjectURL(firstPreviewFile);
      setUploadedImageUrl(previewUrl);

      // Clear files after successful upload
      setTimeout(function() {
        setFiles([]);
      }, 2000);
    }
  };

  // Format file size
  const formatFileSize = function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Prepare a DICOM file for upload: optionally run it through the
  // de-identify/filter pipeline, then extract metadata FROM THE BYTES THAT
  // WILL BE STORED. Returns { uploadFile, dicomMetadata }.
  //
  // PHI-safety: when processing is enabled and the dcmjs parse fails, this
  // THROWS and the file is not uploaded — we never fall back to sending the
  // original identified bytes.
  const prepareDicomFileForUpload = async function(file, uidMapper) {
    const arrayBuffer = await file.arrayBuffer();
    const options = buildProcessingOptions(deidControls, uidMapper);

    if (!options) {
      // Untouched path (legacy behavior): a metadata parse failure is
      // non-blocking — the file still uploads, just without DICOM metadata.
      const metadata = extractAllDicomMetadataFromArrayBuffer(arrayBuffer);
      if (!metadata) {
        console.warn('[UploadPage] No metadata extracted from DICOM file:', file.name);
      }
      return {
        uploadFile: file,
        dicomMetadata: metadata ? flattenDicomMetadataForGridFS(metadata) : null
      };
    }

    let processed;
    try {
      processed = await processDicomArrayBuffer(arrayBuffer, options);
    } catch (processError) {
      throw new Error('De-identification failed — file NOT uploaded: ' + processError.message);
    }

    const metadata = extractAllDicomMetadataFromArrayBuffer(processed.outputBuffer);
    if (metadata) {
      metadata.deidentified = !!options.anonymize;
      metadata.deidMethod = processed.deidMethod;
      console.log('[UploadPage] Processed DICOM file:', file.name, {
        deidMethod: processed.deidMethod,
        studyInstanceUid: get(metadata, 'study.studyInstanceUid')
      });
    }

    return {
      uploadFile: new File([processed.outputBuffer], file.name, { type: 'application/dicom' }),
      dicomMetadata: metadata ? flattenDicomMetadataForGridFS(metadata) : null
    };
  };

  // Run the first selected file through the pipeline and show the result +
  // tag diff in the pre-upload preview card (throwaway UID mapper — the real
  // batch mapper is created at upload time).
  const handlePreviewDeidentified = async function() {
    const firstFile = files[0];
    if (!firstFile) { return; }

    setPreviewBusy(true);
    setError(null);
    try {
      const arrayBuffer = await firstFile.arrayBuffer();
      const options = buildProcessingOptions(deidControls, createBatchUidMapper());
      if (!options) {
        setError('Enable de-identify or add tag filters to preview changes.');
        return;
      }
      const processed = await processDicomArrayBuffer(arrayBuffer, options);
      const diff = diffDicomTags(arrayBuffer, processed.outputBuffer);
      const url = URL.createObjectURL(new Blob([processed.outputBuffer], { type: 'application/dicom' }));
      setProcessedPreview(function(prev) {
        if (prev && prev.url) { URL.revokeObjectURL(prev.url); }
        return { url: url, diff: diff };
      });
    } catch (err) {
      console.error('[UploadPage] De-identify preview error:', err);
      setError('De-identify preview failed: ' + (err.message || String(err)));
    } finally {
      setPreviewBusy(false);
    }
  };

  // Handle convert to FHIR (uploads to GridFS + creates aggregated ImagingStudy, then navigates to studies)
  const handleConvertToFHIR = async function() {
    if (files.length === 0) {
      setError('Please select files to convert');
      return;
    }

    setConverting(true);
    setError(null);
    const results = [];
    const uploadedFileIds = [];

    try {
      // Pre-generate shared metadata for video files in this batch
      const hasVideoFiles = files.some(isVideoFile);
      const videoBatchMeta = hasVideoFiles ? generateVideoStudyMetadata() : null;
      let videoInstanceCounter = 0;

      // One UID mapper per batch (see handleUpload)
      const batchUidMapper = createBatchUidMapper();

      // Step 1: Upload all files to GridFS with DICOM metadata
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Generate metadata: video files get synthetic metadata, DICOM
          // files run through the (optional) de-identify/filter pipeline
          let dicomMetadata;
          let uploadFile = file;
          if (isVideoFile(file)) {
            videoInstanceCounter++;
            dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
            console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
          } else {
            console.log('[UploadPage] Processing', file.name, 'for FHIR conversion...');
            const prepared = await prepareDicomFileForUpload(file, batchUidMapper);
            uploadFile = prepared.uploadFile;
            dicomMetadata = prepared.dicomMetadata;
          }

          // Upload file to GridFS via HTTP (with metadata)
          console.log('[UploadPage] Uploading', file.name, 'to GridFS...');
          const uploadResult = await uploadFileToGridFS(uploadFile, null, dicomMetadata);

          results.push({
            filename: file.name,
            success: true,
            fileId: uploadResult.fileId,
            message: 'Uploaded to GridFS'
          });

          uploadedFileIds.push(uploadResult.fileId);

        } catch (err) {
          console.error('[UploadPage] Conversion error for', file.name, ':', err);
          results.push({
            filename: file.name,
            success: false,
            error: err.message || 'Upload failed'
          });
        }
      }

      // Step 2: Create aggregated ImagingStudy from all uploaded files
      let aggregationResult = null;
      if (uploadedFileIds.length > 0) {
        console.log('[UploadPage] Creating aggregated ImagingStudy for', uploadedFileIds.length, 'files');

        var convertMethodOptions = {};
        if (patientParam) {
          convertMethodOptions.patientId = patientParam;
        }
        if (serviceRequestParam) {
          convertMethodOptions.serviceRequestId = serviceRequestParam;
        }

        aggregationResult = await Meteor.rpc('dicom.createOrUpdateImagingStudy', { gridfsFileIds: uploadedFileIds, options: convertMethodOptions });

        console.log('[UploadPage] ImagingStudy aggregation result:', aggregationResult);

        // Update results with aggregation info
        if (aggregationResult.studies && aggregationResult.studies.length > 0) {
          const studyInfo = aggregationResult.studies.map(function(s) {
            return s.action + ' ImagingStudy: ' + s.seriesCount + ' series, ' + s.instanceCount + ' instances';
          }).join('; ');

          results.forEach(function(r) {
            if (r.success) {
              r.message = studyInfo;
            }
          });
        }
      }

      setUploadResults(results);

      // Check if any conversions succeeded
      const successCount = results.filter(function(r) { return r.success; }).length;
      if (successCount > 0) {
        // Navigate to studies page to see the new FHIR resources
        if (navigate) {
          navigate('/dicom/studies' + forwardParams, { state: { aggregationResult: aggregationResult } });
        }
      }
    } catch (err) {
      console.error('[UploadPage] FHIR conversion error:', err);
      setError(err.message || 'Failed to convert to FHIR');
    } finally {
      setConverting(false);
    }
  };

  return (
    <Box
      id="dicomUploadPage"
      sx={{
        minHeight: '100vh',
        py: 4
      }}
    >
      {/* Upload Area - hide when image is loaded */}
      {!uploadedImageUrl && (
        <Card sx={{
          mx: 3,
          mb: 3,
          bgcolor: cardBgColor,
          color: cardTextColor
        }}>
          <CardHeader
            title="Upload DICOM / Video Files"
            subheader={files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : "Drag and drop DICOM (.dcm) or ultrasound video (.mp4) files"}
            action={
              backUrl && navigate && (
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate(backUrl)}
                  sx={{ color: cardTextColor }}
                >
                  Back
                </Button>
              )
            }
            sx={{
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: subheaderColor }
            }}
          />
          <CardContent>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              sx={{
                border: '2px dashed',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: isDark ? 'rgba(66, 165, 245, 0.08)' : 'rgba(66, 165, 245, 0.04)'
                }
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <UploadIcon sx={{ fontSize: 48, color: subheaderColor, mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ color: cardTextColor }}>
                Drag and drop DICOM or video files here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, color: subheaderColor }}>
                or click to browse
              </Typography>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".dcm,.dicom,.mp4"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <Button variant="contained" component="span">
                Select Files
              </Button>
            </Box>

            {/* Error Alert */}
            {error && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Box>
            )}

            {/* Selected Files List */}
            {files.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <List dense>
                  {files.map(function(file, index) {
                    return (
                      <ListItem
                        key={index}
                        sx={{
                          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)'
                        }}
                        secondaryAction={
                          !uploading && (
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(index)}
                              sx={{ color: cardTextColor }}
                              aria-label="Delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )
                        }
                      >
                        <ListItemIcon>
                          <FileIcon sx={{ color: cardTextColor }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={formatFileSize(file.size)}
                          primaryTypographyProps={{ sx: { color: cardTextColor } }}
                          secondaryTypographyProps={{ sx: { color: subheaderColor } }}
                        />
                      </ListItem>
                    );
                  })}
                </List>

                {/* De-identify / tag-filter controls (shared with data-importer) */}
                <DicomDeidentifyControls
                  value={deidControls}
                  onChange={setDeidControls}
                  disabled={uploading || converting}
                />

                {buildProcessingOptions(deidControls, null) && files.some(function(f) { return f.size > 200 * 1024 * 1024; }) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    De-identification processes files in browser memory (~2-3× the
                    file size). Files over 200 MB may be slow or fail.
                  </Alert>
                )}

                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: subheaderColor }}>
                      {processingPhase || 'Uploading...'} {Math.round(uploadProgress)}%
                    </Typography>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}

                {!uploading && !converting && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Box>
                      {nextUrl && navigate && (
                        <Button
                          variant="outlined"
                          onClick={() => navigate(nextUrl)}
                        >
                          Next
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleConvertToFHIR}
                        disabled={files.length === 0}
                        startIcon={<ConvertIcon />}
                      >
                        Convert to FHIR
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={files.length === 0}
                        startIcon={<UploadIcon />}
                      >
                        Upload {files.length} File{files.length !== 1 ? 's' : ''}
                      </Button>
                    </Box>
                  </Box>
                )}

                {converting && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: subheaderColor }}>
                      Converting to FHIR resources...
                    </Typography>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pre-upload preview: first selected DICOM file, with optional
          de-identified swap + tag diff (nothing has been uploaded yet) */}
      {originalPreviewUrl && !uploadedImageUrl && (
        <Card sx={{
          mx: 3,
          mb: 3,
          bgcolor: cardBgColor,
          color: cardTextColor
        }}>
          <CardHeader
            title={processedPreview ? 'Preview (de-identified — not yet uploaded)' : 'Preview (before upload)'}
            subheader={files[0] ? files[0].name : ''}
            action={
              <Button
                id="previewDeidentifiedButton"
                variant="outlined"
                startIcon={<ShieldIcon />}
                onClick={handlePreviewDeidentified}
                disabled={previewBusy || uploading || converting || !buildProcessingOptions(deidControls, null)}
                sx={{ color: cardTextColor }}
              >
                {previewBusy ? 'Processing…' : 'Preview de-identified'}
              </Button>
            }
            sx={{
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: subheaderColor }
            }}
          />
          <CardContent>
            <SimpleDicomViewport
              key={processedPreview ? processedPreview.url : originalPreviewUrl}
              dicomUrl={processedPreview ? processedPreview.url : originalPreviewUrl}
            />
            {processedPreview && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ color: cardTextColor }}>
                  Tag changes ({processedPreview.diff.length})
                </Typography>
                <DicomTagDiffTable diffs={processedPreview.diff} />
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Results - hide when image is loaded */}
      {uploadResults.length > 0 && !uploadedImageUrl && (
        <Card sx={{
          mx: 3,
          mb: 3,
          bgcolor: cardBgColor,
          color: cardTextColor
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: cardTextColor }}>
              Upload Results
            </Typography>
            <List dense>
              {uploadResults.map(function(result, index) {
                return (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)'
                    }}
                  >
                    <ListItemIcon>
                      {result.success ? (
                        <SuccessIcon color="success" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={result.filename}
                      secondary={result.success
                        ? (result.message || 'Uploaded successfully')
                        : result.error
                      }
                      primaryTypographyProps={{ sx: { color: cardTextColor } }}
                      secondaryTypographyProps={{ sx: { color: subheaderColor } }}
                    />
                    <Chip
                      label={result.success ? 'Success' : 'Failed'}
                      color={result.success ? 'success' : 'error'}
                      size="small"
                    />
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* DICOM Image Viewer */}
      {uploadedImageUrl && (
        <Card sx={{
          mx: 3,
          mb: 3,
          bgcolor: cardBgColor,
          color: cardTextColor
        }}>
          <CardHeader
            title="DICOM Image Preview"
            action={
              navigate && (
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/dicom/studies' + forwardParams)}
                  sx={{ color: cardTextColor }}
                >
                  Back to Studies
                </Button>
              )
            }
            sx={{
              '& .MuiCardHeader-title': { color: cardTextColor }
            }}
          />
          <CardContent>
            <Box sx={{ mt: 2 }}>
              <SimpleDicomViewport
                dicomUrl={uploadedImageUrl}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default UploadPage;

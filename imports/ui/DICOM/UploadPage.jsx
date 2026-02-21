// imports/ui/DICOM/UploadPage.jsx

import React, { useState, useCallback } from 'react';
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
  Transform as ConvertIcon
} from '@mui/icons-material';
import SimpleDicomViewport from './components/SimpleDicomViewport';
import moment from 'moment';

// DICOM parsing imports
import dicomParser from 'dicom-parser';
import { extractAllDicomMetadata } from './utils/DicomFhirMapping';

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Generate metadata: video files get synthetic metadata, DICOM files get parsed
        let dicomMetadata;
        if (isVideoFile(file)) {
          videoInstanceCounter++;
          dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
          console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
        } else {
          console.log('[UploadPage] Parsing', file.name, '(' + file.size + ' bytes)...');
          dicomMetadata = await parseDicomFile(file);
        }

        // Upload file to GridFS via HTTP (with metadata)
        console.log('[UploadPage] Uploading', file.name, 'to GridFS...');

        const uploadResult = await uploadFileToGridFS(file, function(fileProgress) {
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

        // Save the first file for preview (create local blob URL - no base64 needed)
        if (!firstPreviewFile) {
          firstPreviewFile = file;
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

        const aggregationResult = await new Promise(function(resolve, reject) {
          Meteor.call('dicom.createOrUpdateImagingStudy', successfulFileIds, uploadMethodOptions, function(error, result) {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

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

  // Parse DICOM file and extract metadata
  const parseDicomFile = async function(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);
      const metadata = extractAllDicomMetadata(dataSet);

      console.log('[UploadPage] Parsed DICOM metadata:', {
        studyInstanceUid: get(metadata, 'study.studyInstanceUid'),
        seriesInstanceUid: get(metadata, 'series.seriesInstanceUid'),
        sopInstanceUid: get(metadata, 'instance.sopInstanceUid'),
        modality: get(metadata, 'series.modality')
      });

      // Build flat metadata object for GridFS
      return {
        studyInstanceUid: get(metadata, 'study.studyInstanceUid'),
        seriesInstanceUid: get(metadata, 'series.seriesInstanceUid'),
        sopInstanceUid: get(metadata, 'instance.sopInstanceUid'),
        sopClassUid: get(metadata, 'instance.sopClassUid'),
        modality: get(metadata, 'series.modality'),
        studyDate: get(metadata, 'study.studyDate'),
        studyDescription: get(metadata, 'study.description'),
        seriesDescription: get(metadata, 'series.description'),
        seriesNumber: get(metadata, 'series.number'),
        instanceNumber: get(metadata, 'instance.number'),
        dicomPatientName: get(metadata, 'patient.name.text'),
        dicomPatientId: get(metadata, 'patient.patientId'),
        dicomPatientBirthDate: get(metadata, 'patient.birthDate'),
        dicomPatientSex: get(metadata, 'patient.dicomSex'),
        rows: get(metadata, 'instance.rows'),
        columns: get(metadata, 'instance.columns'),
        bitsAllocated: get(metadata, 'instance.bitsAllocated'),
        transferSyntaxUid: get(metadata, 'instance.transferSyntaxUid')
      };
    } catch (parseError) {
      console.warn('[UploadPage] Failed to parse DICOM file:', file.name, parseError.message);
      // Return empty metadata if parsing fails - upload will still work
      return null;
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

      // Step 1: Upload all files to GridFS with DICOM metadata
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Generate metadata: video files get synthetic metadata, DICOM files get parsed
          let dicomMetadata;
          if (isVideoFile(file)) {
            videoInstanceCounter++;
            dicomMetadata = buildVideoFileMetadata(file, videoBatchMeta, videoInstanceCounter);
            console.log('[UploadPage] Generated video metadata for', file.name, '(instance', videoInstanceCounter, ')');
          } else {
            console.log('[UploadPage] Parsing', file.name, 'for FHIR conversion...');
            dicomMetadata = await parseDicomFile(file);
          }

          // Upload file to GridFS via HTTP (with metadata)
          console.log('[UploadPage] Uploading', file.name, 'to GridFS...');
          const uploadResult = await uploadFileToGridFS(file, null, dicomMetadata);

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

        aggregationResult = await new Promise(function(resolve, reject) {
          Meteor.call('dicom.createOrUpdateImagingStudy', uploadedFileIds, convertMethodOptions, function(error, result) {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

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
                <List>
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

                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: subheaderColor }}>
                      Uploading... {Math.round(uploadProgress)}%
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
            <List>
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

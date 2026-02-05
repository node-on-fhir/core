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

// Theme hook
let useAppTheme;
let useNavigate;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});

function UploadPage() {
  const navigate = useNavigate ? useNavigate() : null;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

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
  const uploadFileToGridFS = function(file, onProgress) {
    return new Promise(function(resolve, reject) {
      const formData = new FormData();
      formData.append('dicomFile', file);

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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Upload file to GridFS via HTTP
        console.log('Uploading', file.name, '(' + file.size + ' bytes) to GridFS...');

        const uploadResult = await uploadFileToGridFS(file, function(fileProgress) {
          // Combine per-file progress with overall progress
          const overallProgress = ((i + fileProgress / 100) / files.length) * 100;
          setUploadProgress(overallProgress);
        });

        console.log('GridFS upload complete:', uploadResult.fileId, uploadResult.url);

        // Create FHIR resources (DocumentReference + ImagingStudy) via DDP method
        const fhirResult = await new Promise(function(resolve, reject) {
          Meteor.call('dicom.createFhirResources', {
            fileId: uploadResult.fileId,
            filename: uploadResult.filename,
            size: uploadResult.size,
            url: uploadResult.url
          }, function(error, result) {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

        console.log('FHIR resources created:', fhirResult);

        results.push({
          filename: file.name,
          success: true,
          result: fhirResult,
          message: 'Uploaded to GridFS and created FHIR resources'
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

  // Handle convert to FHIR (uploads to GridFS + creates FHIR resources, then navigates to studies)
  const handleConvertToFHIR = async function() {
    if (files.length === 0) {
      setError('Please select files to convert');
      return;
    }

    setConverting(true);
    setError(null);
    const results = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Upload file to GridFS via HTTP
          console.log('Uploading', file.name, 'to GridFS for FHIR conversion...');
          const uploadResult = await uploadFileToGridFS(file);

          // Create FHIR resources via DDP method
          const fhirResult = await new Promise(function(resolve, reject) {
            Meteor.call('dicom.createFhirResources', {
              fileId: uploadResult.fileId,
              filename: uploadResult.filename,
              size: uploadResult.size,
              url: uploadResult.url
            }, function(error, result) {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          });

          const imagingStudyMsg = fhirResult.imagingStudy
            ? ', ImagingStudy: ' + fhirResult.imagingStudy.id
            : '';

          results.push({
            filename: file.name,
            success: true,
            result: fhirResult,
            message: 'Created DocumentReference: ' + fhirResult.documentReference.id + imagingStudyMsg
          });

          console.log('FHIR conversion successful:', fhirResult);

          // Insert into client-side Minimongo for immediate display
          const timestamp = new Date().toISOString();

          // Insert ImagingStudy
          const ImagingStudies = Meteor.Collections?.ImagingStudies;
          if (ImagingStudies && fhirResult.imagingStudy) {
            const clientStudy = {
              _id: fhirResult.imagingStudy.id,
              resourceType: 'ImagingStudy',
              status: 'available',
              started: timestamp,
              numberOfSeries: 1,
              numberOfInstances: 1,
              description: 'Imaging study from ' + file.name,
              series: [{
                uid: Date.now() + '.1',
                number: 1,
                modality: {
                  system: 'http://dicom.nema.org/resources/ontology/DCM',
                  code: 'CT',
                  display: 'Computed Tomography'
                },
                numberOfInstances: 1
              }]
            };

            try {
              ImagingStudies._collection.insert(clientStudy);
              console.log('Inserted ImagingStudy into client Minimongo:', fhirResult.imagingStudy.id);
            } catch (insertError) {
              console.warn('Could not insert ImagingStudy into client collection:', insertError);
            }
          }

          // Insert DocumentReference (with URL reference, not inline base64)
          const DocumentReferences = Meteor.Collections?.DocumentReferences;
          if (DocumentReferences && fhirResult.documentReference) {
            const clientDocRef = {
              _id: fhirResult.documentReference.id,
              resourceType: 'DocumentReference',
              status: 'current',
              docStatus: 'final',
              date: timestamp,
              description: 'DICOM file: ' + file.name,
              type: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '18748-4',
                  display: 'Diagnostic imaging study'
                }],
                text: 'DICOM Image'
              },
              category: [{
                coding: [{
                  system: 'http://loinc.org',
                  code: 'LP29684-5',
                  display: 'Radiology'
                }]
              }],
              content: [{
                attachment: {
                  contentType: 'application/dicom',
                  url: uploadResult.url,  // GridFS URL reference (not inline base64)
                  size: file.size,
                  title: file.name,
                  creation: timestamp
                }
              }],
              context: fhirResult.imagingStudy ? {
                related: [{
                  reference: 'ImagingStudy/' + fhirResult.imagingStudy.id
                }]
              } : undefined
            };

            try {
              DocumentReferences._collection.insert(clientDocRef);
              console.log('Inserted DocumentReference into client Minimongo:', fhirResult.documentReference.id);
            } catch (insertError) {
              console.warn('Could not insert DocumentReference into client collection:', insertError);
            }
          }
        } catch (err) {
          console.error('Conversion error for', file.name, ':', err);
          results.push({
            filename: file.name,
            success: false,
            error: err.message || 'Conversion failed'
          });
        }
      }

      setUploadResults(results);

      // Check if any conversions succeeded
      const successCount = results.filter(function(r) { return r.success; }).length;
      if (successCount > 0) {
        // Navigate to studies page to see the new FHIR resources
        if (navigate) {
          navigate('/dicom/studies');
        }
      }
    } catch (err) {
      console.error('FHIR conversion error:', err);
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
            title="Upload DICOM Files"
            subheader={files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : "Drag and drop or select DICOM files to upload"}
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
                Drag and drop DICOM files here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, color: subheaderColor }}>
                or click to browse
              </Typography>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".dcm,.dicom"
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
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                  onClick={() => navigate('/dicom/studies')}
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

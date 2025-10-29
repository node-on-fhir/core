// packages/dicom-viewer/client/UploadPage.jsx

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
  const [uploadedImageData, setUploadedImageData] = useState(null);
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

  // Handle upload
  const handleUpload = async function() {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await readFileAsArrayBuffer(file);

        // Convert to base64 for transmission
        const base64Data = arrayBufferToBase64(arrayBuffer);

        // Call Meteor method to process DICOM file
        const result = await new Promise(function(resolve, reject) {
          Meteor.call('dicom.processUploadedFile', {
            filename: file.name,
            data: base64Data,
            size: file.size
          }, function(error, result) {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

        results.push({
          filename: file.name,
          success: true,
          result: result
        });

        // Save the first successfully uploaded image data for preview
        if (!uploadedImageData) {
          setUploadedImageData(base64Data);
        }
      } catch (err) {
        console.error('Upload error for', file.name, ':', err);
        results.push({
          filename: file.name,
          success: false,
          error: err.message || 'Upload failed'
        });
      }

      // Update progress
      setUploadProgress(((i + 1) / files.length) * 100);
    }

    setUploadResults(results);
    setUploading(false);

    // Check if any uploads succeeded
    const successCount = results.filter(function(r) { return r.success; }).length;
    if (successCount > 0) {
      // Clear files after successful upload
      setTimeout(function() {
        setFiles([]);
      }, 2000);
    }
  };

  // Helper: Read file as ArrayBuffer
  const readFileAsArrayBuffer = function(file) {
    return new Promise(function(resolve, reject) {
      const reader = new FileReader();
      reader.onload = function(e) {
        resolve(e.target.result);
      };
      reader.onerror = function(e) {
        reject(new Error('Failed to read file'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper: Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = function(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Format file size
  const formatFileSize = function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle convert to FHIR
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
          // Read file as ArrayBuffer
          const arrayBuffer = await readFileAsArrayBuffer(file);

          // Convert to base64 for transmission
          const base64Data = arrayBufferToBase64(arrayBuffer);

          // Call Meteor method to convert DICOM to FHIR
          const result = await new Promise(function(resolve, reject) {
            Meteor.call('dicom.convertToFHIR', {
              filename: file.name,
              data: base64Data,
              size: file.size
            }, function(error, result) {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          });

          results.push({
            filename: file.name,
            success: true,
            result: result,
            message: `Created DocumentReference: ${result.documentReference.id}, ImagingStudy: ${result.imagingStudy.id}`
          });

          console.log('✅ FHIR conversion successful:', result);

          // Insert into client-side Minimongo for immediate display
          // (until we set up proper pub/sub)
          const timestamp = new Date().toISOString();

          // Insert ImagingStudy
          const ImagingStudies = Meteor.Collections?.ImagingStudies;
          if (ImagingStudies && result.imagingStudy) {
            // Create a minimal ImagingStudy document for client display
            const clientStudy = {
              _id: result.imagingStudy.id,
              resourceType: 'ImagingStudy',
              status: 'available',
              started: timestamp,
              numberOfSeries: 1,
              numberOfInstances: 1,
              description: `Imaging study from ${file.name}`,
              series: [{
                uid: `${Date.now()}.1`,
                number: 1,
                modality: {
                  system: 'http://dicom.nema.org/resources/ontology/DCM',
                  code: 'CT',
                  display: 'Computed Tomography'
                },
                numberOfInstances: 1
              }]
            };

            // Insert directly into underlying Minimongo collection (bypasses allow/deny rules)
            try {
              ImagingStudies._collection.insert(clientStudy);
              console.log('✅ Inserted ImagingStudy into client Minimongo:', result.imagingStudy.id);
            } catch (insertError) {
              console.warn('⚠️  Could not insert ImagingStudy into client collection:', insertError);
            }
          }

          // Insert DocumentReference
          const DocumentReferences = Meteor.Collections?.DocumentReferences;
          if (DocumentReferences && result.documentReference) {
            const clientDocRef = {
              _id: result.documentReference.id,
              resourceType: 'DocumentReference',
              status: 'current',
              docStatus: 'final',
              date: timestamp,
              description: `DICOM file: ${file.name}`,
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
                  data: base64Data,  // Include the base64 DICOM data
                  size: file.size,
                  title: file.name,
                  creation: timestamp
                }
              }],
              context: {
                related: [{
                  reference: `ImagingStudy/${result.imagingStudy.id}`
                }]
              }
            };

            // Insert directly into underlying Minimongo collection (bypasses allow/deny rules)
            try {
              DocumentReferences._collection.insert(clientDocRef);
              console.log('✅ Inserted DocumentReference into client Minimongo:', result.documentReference.id);
            } catch (insertError) {
              console.warn('⚠️  Could not insert DocumentReference into client collection:', insertError);
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
      {!uploadedImageData && (
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
      {uploadResults.length > 0 && !uploadedImageData && (
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
      {uploadedImageData && (
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
                dicomData={uploadedImageData}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default UploadPage;

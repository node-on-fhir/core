// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/AttachmentQuestion.jsx

import React, { useRef, useState } from 'react';
import { 
  Box,
  Button,
  Typography,
  IconButton,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormHelperText
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { get } from 'lodash';

export function AttachmentQuestion(props) {
  const {
    item,
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText
  } = props;

  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get constraints
  const maxSize = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/maxSize'
  )?.valueDecimal;
  
  const allowedTypes = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/mimeType'
  )?.valueString?.split(',') || [];

  const handleFileSelect = async function(event) {
    if (readOnly) return;
    
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (maxSize && file.size > maxSize) {
      alert(`File size exceeds maximum of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      alert(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64 = e.target.result.split(',')[1];
        
        const attachment = {
          contentType: file.type,
          data: base64,
          size: file.size,
          title: file.name,
          creation: new Date().toISOString()
        };

        onChange(attachment);
        setUploading(false);
      };

      reader.onprogress = function(e) {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      alert('Error uploading file');
    }

    // Clear input
    event.target.value = '';
  };

  const handleRemove = function() {
    if (readOnly) return;
    onChange(null);
  };

  const getFileIcon = function(contentType) {
    if (contentType?.startsWith('image/')) return <ImageIcon />;
    if (contentType === 'application/pdf') return <PdfIcon />;
    return <FileIcon />;
  };

  const formatFileSize = function(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileSelect}
        accept={allowedTypes.join(',')}
        disabled={readOnly || uploading}
      />

      {!value && (
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={readOnly || uploading}
        >
          Choose File
        </Button>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Uploading...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {value && (
        <Paper variant="outlined" sx={{ mt: 1 }}>
          <List dense>
            <ListItem>
              {getFileIcon(get(value, 'contentType'))}
              <ListItemText
                primary={get(value, 'title', 'Attachment')}
                secondary={`${get(value, 'contentType', 'Unknown type')} • ${formatFileSize(get(value, 'size', 0))}`}
                sx={{ ml: 2 }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={handleRemove}
                  disabled={readOnly}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>
      )}

      {error && helperText && (
        <FormHelperText error>{helperText}</FormHelperText>
      )}

      {(maxSize || allowedTypes.length > 0) && (
        <FormHelperText>
          {maxSize && `Max size: ${(maxSize / 1024 / 1024).toFixed(0)}MB`}
          {maxSize && allowedTypes.length > 0 && ' • '}
          {allowedTypes.length > 0 && `Allowed: ${allowedTypes.join(', ')}`}
        </FormHelperText>
      )}
    </Box>
  );
}
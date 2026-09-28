// imports/ui/profile/PhotoUploadDialog.jsx
//
// Square crop dialog for the PatientCard photo (handoff: "click/drag opens a
// file picker → crop dialog (square, MUI Dialog) → writes Patient.photo[0]").
// Accepts image/*, max 5 MB; output is a FHIR Attachment { contentType, data }
// capped at 600×600 so the base64 stays small.

import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Slider, Typography, Alert
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Cropper from 'react-easy-crop';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 600;

function readFileAsDataUrl(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function() { resolve(reader.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function cropToAttachment(imageSrc, cropPixels) {
  const image = await new Promise(function(resolve, reject) {
    const img = new Image();
    img.onload = function() { resolve(img); };
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const size = Math.min(OUTPUT_SIZE, cropPixels.width);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, size, size
  );

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    contentType: 'image/jpeg',
    data: dataUrl.split(',')[1]
  };
}

export default function PhotoUploadDialog({ open, onClose, onSave }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleCropComplete = useCallback(function(area, areaPixels) {
    setCropPixels(areaPixels);
  }, []);

  async function handleFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) { return; }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Photo must be 5 MB or smaller.');
      return;
    }
    setError('');
    setImageSrc(await readFileAsDataUrl(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function handleSave() {
    if (!imageSrc || !cropPixels) { return; }
    setSaving(true);
    try {
      const attachment = await cropToAttachment(imageSrc, cropPixels);
      await onSave([attachment]);
      handleClose();
    } catch (err) {
      console.warn('[PhotoUploadDialog] save failed:', err.message);
      setError(err.reason || err.message || 'Failed to save photo');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setImageSrc(null);
    setCropPixels(null);
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>Profile photo</DialogTitle>
      <DialogContent>
        {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

        {!imageSrc ? (
          <Box
            onClick={function() { if (fileInputRef.current) { fileInputRef.current.click(); } }}
            sx={{
              height: 260,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              border: '1px dashed', borderColor: 'divider',
              borderRadius: 2, cursor: 'pointer',
              color: 'text.secondary',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
            }}
          >
            <PhotoCameraIcon />
            <Typography variant="body2">Choose an image (max 5 MB)</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ position: 'relative', height: 260, borderRadius: 2, overflow: 'hidden' }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Zoom</Typography>
              <Slider
                size="small"
                min={1} max={4} step={0.05}
                value={zoom}
                onChange={function(e, value) { setZoom(value); }}
              />
            </Box>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileSelected}
        />
      </DialogContent>
      <DialogActions>
        {imageSrc ? (
          <Button onClick={function() { if (fileInputRef.current) { fileInputRef.current.click(); } }}>
            Choose different
          </Button>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="outlined" disabled={!imageSrc || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

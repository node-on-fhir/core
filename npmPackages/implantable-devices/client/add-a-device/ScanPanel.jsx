// npmPackages/implantable-devices/client/add-a-device/ScanPanel.jsx
//
// Barcode scan panel for the Device-in-hand branch. Platform-guarded: only
// scan-capable devices (Cordova / phone / tablet — lib/scanCapability.js) get
// the camera; desktop shows a hint to use Type-it-in. Decode order: native
// BarcodeDetector (Chrome/Android/Cordova WebView) → @zxing/browser (dynamic
// import, so desktop users never download it). A photo-upload fallback covers
// cameras that can't focus close enough for a DataMatrix.

import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

import { BTN_PRIMARY_SX, BTN_GHOST_SX } from './addDeviceStyles.js';

const BARCODE_FORMATS = ['data_matrix', 'code_128', 'qr_code'];

function ScanPanel({ scanCapable, onScanResult }) {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const stoppedRef = useRef(false);

  function stopCamera() {
    stoppedRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(function(track) { track.stop(); });
      streamRef.current = null;
    }
    setScanning(false);
  }

  useEffect(function() {
    return function cleanup() { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function decodeLoop() {
    const video = videoRef.current;
    if (stoppedRef.current || !video || video.readyState < 2) {
      if (!stoppedRef.current) { rafRef.current = requestAnimationFrame(decodeLoop); }
      return;
    }

    try {
      if (typeof window.BarcodeDetector === 'function') {
        const detector = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          handleDecoded(barcodes[0].rawValue);
          return;
        }
      } else {
        // ZXing fallback — decode a frame snapshot
        const zxing = await import('@zxing/browser');
        const reader = new zxing.BrowserMultiFormatReader();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        try {
          const result = reader.decodeFromCanvas(canvas);
          if (result && result.getText()) {
            handleDecoded(result.getText());
            return;
          }
        } catch (notFound) {
          // No barcode in this frame — keep looping
        }
      }
    } catch (error) {
      console.warn('[ScanPanel] decode error:', error.message);
    }

    // Throttle to ~5 attempts/second
    if (!stoppedRef.current) {
      setTimeout(function() {
        if (!stoppedRef.current) { rafRef.current = requestAnimationFrame(decodeLoop); }
      }, 200);
    }
  }

  function handleDecoded(rawValue) {
    stopCamera();
    if (onScanResult) { onScanResult(rawValue); }
  }

  async function handleOpenCamera() {
    setScanError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      stoppedRef.current = false;
      setScanning(true);
      // Let the video element mount, then attach + start decoding
      setTimeout(function() {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play();
          rafRef.current = requestAnimationFrame(decodeLoop);
        }
      }, 50);
    } catch (error) {
      console.warn('[ScanPanel] camera unavailable:', error.message);
      setScanError('Camera unavailable — check permissions, or type the UDI in instead.');
    }
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) { return; }
    setScanError(null);
    const url = URL.createObjectURL(file);
    try {
      const zxing = await import('@zxing/browser');
      const reader = new zxing.BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url);
      if (result && result.getText()) {
        handleDecoded(result.getText());
      } else {
        setScanError("We couldn't read that label — try again closer, or type the UDI in.");
      }
    } catch (error) {
      setScanError("We couldn't read that label — try again closer, or type the UDI in.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  if (!scanCapable) {
    return (
      <Box className="adv-scan-panel" id="advScanPanel">
        <QrCodeScannerIcon sx={{ fontSize: 36, color: 'var(--pf-ink-faint)' }} />
        <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
          Scanning is available on mobile — use <strong>Type it in</strong> instead.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="adv-scan-panel" id="advScanPanel">
      {scanning && <video ref={videoRef} className="adv-scan-video" muted playsInline />}
      {!scanning && <QrCodeScannerIcon sx={{ fontSize: 36, color: 'var(--pf-ink-faint)' }} />}
      {!scanning && (
        <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
          Point the camera at the UDI barcode on the device label or packaging.
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, zIndex: 1 }}>
        {!scanning ? (
          <Button variant="outlined" onClick={handleOpenCamera} startIcon={<QrCodeScannerIcon />} sx={BTN_PRIMARY_SX}>
            Open camera
          </Button>
        ) : (
          <Button variant="text" onClick={stopCamera} sx={BTN_GHOST_SX}>
            Stop
          </Button>
        )}
        <Button component="label" variant="text" startIcon={<PhotoCameraIcon />} sx={BTN_GHOST_SX}>
          Photo of the label
          <input type="file" accept="image/*" capture="environment" hidden onChange={handlePhotoUpload} />
        </Button>
      </Box>
      {scanError && (
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)', zIndex: 1 }}>{scanError}</Typography>
      )}
    </Box>
  );
}

export default ScanPanel;

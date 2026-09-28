// imports/ui/profile/QrIntakeDialog.jsx
//
// "Show QR for intake" quick action — renders the patient's FHIR URL as a QR
// code for front-desk scanning.

import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import QRCode from 'qrcode';
import { MonoCopyValue } from './ProfilePrimitives.jsx';

export default function QrIntakeDialog({ open, onClose, patientId }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(function() {
    if (!open || !patientId) { return; }
    const fhirUrl = `${window.location.origin}/baseR4/Patient/${patientId}`;
    QRCode.toDataURL(fhirUrl, { width: 240, margin: 1 })
      .then(setDataUrl)
      .catch(function(err) {
        console.warn('[QrIntakeDialog] QR generation failed:', err.message);
      });
  }, [open, patientId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle sx={{ fontSize: 16 }}>QR for intake</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        {dataUrl ? (
          // QR quiet zone must stay white in every theme or scanners fail
          <Box component="img" src={dataUrl} alt="Patient intake QR code" sx={{ width: 240, height: 240, borderRadius: 1, bgcolor: '#ffffff', p: 1 }} />
        ) : null}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Scan to open this patient record.
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <MonoCopyValue value={patientId} prefix="Patient" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

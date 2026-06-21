// packages/international-patient-summary/client/FooterButtons.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
  Button,
  ButtonGroup
} from '@mui/material';

import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';

export function IPSFooterButtons(props) {
  
  function handleExportIPS() {
    console.log('Exporting IPS bundle...');
    // Future: Export IPS as FHIR Bundle
    const selectedPatientId = Session.get('selectedPatientId');
    if(selectedPatientId) {
      // Construct and download IPS bundle
      console.log('Exporting IPS for patient:', selectedPatientId);
    }
  }

  function handleImportIPS() {
    console.log('Importing IPS bundle...');
    // Future: Import IPS Bundle
  }

  function handlePrintIPS() {
    console.log('Printing IPS...');
    window.print();
  }

  function handleShareIPS() {
    console.log('Sharing IPS...');
    // Future: Share IPS via SMART on FHIR or other mechanism
  }

  return (
    <ButtonGroup className="footer-buttons-international-patient-summary" variant="outlined" aria-label="IPS actions">
      <Button
        id="international-patient-summary-export-ips-footer-btn"
        startIcon={<DownloadIcon />}
        onClick={handleExportIPS}
      >
        Export IPS
      </Button>
      <Button
        id="international-patient-summary-import-ips-footer-btn"
        startIcon={<UploadIcon />}
        onClick={handleImportIPS}
      >
        Import IPS
      </Button>
      <Button
        id="international-patient-summary-print-footer-btn"
        startIcon={<PrintIcon />}
        onClick={handlePrintIPS}
      >
        Print
      </Button>
      <Button
        id="international-patient-summary-share-footer-btn"
        startIcon={<ShareIcon />}
        onClick={handleShareIPS}
      >
        Share
      </Button>
    </ButtonGroup>
  );
}
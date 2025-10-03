// packages/e-prescribing/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import EPrescribingPage from './client/EPrescribingPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

let DynamicRoutes = [{
  name: 'EPrescribing',
  path: '/e-prescribing',
  element: <EPrescribingPage />,
  requireAuth: true,
  description: 'Electronic Prescribing - ONC §170.315(b)(3)'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

let ClinicianWorkflows = [{
  primaryText: "E-Prescribing",
  to: '/e-prescribing',
  iconName: 'medication',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

let FooterButtons = [{
  pathname: '/e-prescribing',
  element: (
    <Button
      id="newPrescriptionButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('New prescription clicked');
      }}
    >
      New Prescription
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'EPrescribing',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(b)(3) - Electronic Prescribing'
  ],
  ncpdpScriptMessages: [
    'NewRx',
    'RxChangeRequest',
    'RxChangeResponse',
    'CancelRx',
    'CancelRxResponse',
    'RxFill',
    'RxFillStatus',
    'RxRenewalRequest',
    'RxRenewalResponse'
  ],
  fhirResources: [
    'MedicationRequest',
    'Medication',
    'Patient',
    'Practitioner',
    'Organization',
    'Pharmacy'
  ],
  settings: {
    enableNCPDPScript: true,
    scriptVersion: '2017071',
    enableDrugFormulary: true,
    enableRefillRequests: true,
    enablePriorAuthorization: true,
    maxPrescriptionsPerPage: 10
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

if (!get(Meteor, 'settings.public.modules.ePrescribing.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
}

if (!get(Meteor, 'settings.public.modules.ePrescribing.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  DynamicRoutes,
  ClinicianWorkflows,
  FooterButtons,
  ModuleConfig,
  EPrescribingPage
};
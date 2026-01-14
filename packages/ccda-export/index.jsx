// packages/clinical-documents/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import CCDAExportPage from './client/pages/CCDAExportPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes for Clinical Documents and CCDA Export
let DynamicRoutes = [{
  name: 'CCDAExport',
  path: '/ccda-export',
  element: <CCDAExportPage />,
  requireAuth: true,
  description: 'C-CDA Document Export - ONC §170.315(b)(1)'
}, {
  name: 'ClinicalDocuments',
  path: '/clinical-documents',
  element: <CCDAExportPage defaultView="list" />,
  requireAuth: true,
  description: 'Clinical Document Management'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Clinician workflows
let ClinicianWorkflows = [{
  primaryText: "C-CDA Export",
  to: '/ccda-export',
  iconName: 'export',
  requireAuth: true
}, {
  primaryText: "Clinical Documents",
  to: '/clinical-documents',
  iconName: 'document',
  requireAuth: true
}];

// FHIR resource items
let SidebarElements = [{
  primaryText: "Document References",
  to: '/clinical-documents',
  iconName: 'folder',
  requireAuth: true,
  collectionName: 'DocumentReferences'
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

let FooterButtons = [{
  pathname: '/ccda-export',
  element: (
    <Button
      id="exportCCDAButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('Export CCDA clicked');
      }}
    >
      Export C-CDA
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'ClinicalDocuments',
  version: '1.0.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(b)(1) - Transitions of Care',
    '170.315(b)(2) - Clinical Information Reconciliation',
    '170.315(b)(4) - Common Clinical Data Set Summary',
    '170.315(b)(6) - Data Export'
  ],
  documentTypes: [
    'Continuity of Care Document (CCD)',
    'Referral Note',
    'Discharge Summary',
    'Consultation Note',
    'History and Physical',
    'Operative Note',
    'Progress Note',
    'Procedure Note',
    'Transfer Summary',
    'Care Plan'
  ],
  fhirResources: [
    'DocumentReference',
    'Composition',
    'Bundle',
    'Binary'
  ],
  settings: {
    enableCCDAv21: true,
    enableCCDAv11: false,
    includeNarrative: true,
    validateOnExport: true,
    schematronValidation: false,
    maxDocumentSize: 10, // MB
    supportedFormats: ['xml', 'json']
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.clinicalDocuments.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
  SidebarElements = [];
}

// Check workflow visibility
if (!get(Meteor, 'settings.public.modules.clinicalDocuments.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

if (!get(Meteor, 'settings.public.modules.clinicalDocuments.showInSidebar', true)) {
  SidebarElements = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export collections
export { ClinicalDocuments } from './lib/collections/ClinicalDocuments';
export { DocumentRevisions } from './lib/collections/DocumentRevisions';

export { 
  // Routes
  DynamicRoutes,
  
  // Sidebar items
  ClinicianWorkflows,
  SidebarElements,
  
  // Footer
  FooterButtons,
  
  // Configuration
  ModuleConfig,
  
  // Main component for reuse
  CCDAExportPage
};
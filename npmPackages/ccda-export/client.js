// npmPackages/ccda-export/client.js
//
// Client entry — C-CDA export + clinical documents (ONC §170.315(b)(1)).
// Migrated from packages/ccda-export (Atmosphere name clinical:ccda-export)
// 2026-06-14. Faithfully preserves the Atmosphere index.jsx: two routes
// (/ccda-export and /clinical-documents, both CCDAExportPage — the second in
// list view), the ClinicianWorkflows / SidebarElements / FooterButtons /
// ModuleConfig named exports, the settings gates, and the re-exported
// collections. workflow.json carries the same routes/sidebar as discovery
// metadata; DynamicRoutes is built explicitly here to preserve the
// defaultView="list" prop on the second route.

import React from 'react';
import { Button } from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import CCDAExportPage from './client/pages/CCDAExportPage';
import workflowConfig from './workflow.json';

// =============================================================================
// ROUTES
// =============================================================================

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
// SIDEBAR
// =============================================================================

let ClinicianWorkflows = [{
  primaryText: "C-CDA Export", to: '/ccda-export', iconName: 'FileDownload', requireAuth: true
}, {
  primaryText: "Clinical Documents", to: '/clinical-documents', iconName: 'Description', requireAuth: true
}];

let SidebarElements = [{
  primaryText: "Document References", to: '/clinical-documents', iconName: 'Folder',
  requireAuth: true, collectionName: 'DocumentReferences'
}];

// =============================================================================
// FOOTER
// =============================================================================

let FooterButtons = [{
  pathname: '/ccda-export',
  element: (
    <Button
      id="exportCCDAButton"
      color="primary"
      variant="contained"
      onClick={() => { console.log('Export CCDA clicked'); }}
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
    'Continuity of Care Document (CCD)', 'Referral Note', 'Discharge Summary',
    'Consultation Note', 'History and Physical', 'Operative Note', 'Progress Note',
    'Procedure Note', 'Transfer Summary', 'Care Plan'
  ],
  fhirResources: ['DocumentReference', 'Composition', 'Bundle', 'Binary'],
  settings: {
    enableCCDAv21: true, enableCCDAv11: false, includeNarrative: true,
    validateOnExport: true, schematronValidation: false, maxDocumentSize: 10,
    supportedFormats: ['xml', 'json']
  }
};

// =============================================================================
// SETTINGS GATES (preserved from index.jsx)
// =============================================================================

if (!get(Meteor, 'settings.public.modules.clinicalDocuments.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
  SidebarElements = [];
}
if (!get(Meteor, 'settings.public.modules.clinicalDocuments.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}
if (!get(Meteor, 'settings.public.modules.clinicalDocuments.showInSidebar', true)) {
  SidebarElements = [];
}

// SidebarWorkflows alias — what the WorkflowRegistry default export consumes.
const SidebarWorkflows = ClinicianWorkflows;

// =============================================================================
// EXPORTS
// =============================================================================

export { ClinicalDocuments } from './lib/collections/ClinicalDocuments';
export { DocumentRevisions } from './lib/collections/DocumentRevisions';

export {
  DynamicRoutes,
  ClinicianWorkflows,
  SidebarWorkflows,
  SidebarElements,
  FooterButtons,
  ModuleConfig,
  CCDAExportPage
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: ClinicianWorkflows,
  footerButtons: FooterButtons
};

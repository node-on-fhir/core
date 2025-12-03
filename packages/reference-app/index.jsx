// packages/reference-app/index.jsx

import React from 'react';
import { get } from 'lodash';

// Import main page component
import ReferenceAppPage from './client/ReferenceAppPage';
import G10CertificationPage from './client/G10CertificationPage';

// Import footer buttons component
import { ReferenceAppFooterButtons } from './client/FooterButtons';

// Import sidebar workflow component (if complex)
import { ReferenceAppWorkflow } from './client/ReferenceAppWorkflow';

// Import collections and utilities
import { ReferenceAppCollections } from './lib/collections';
import { ReferenceAppUtilities } from './lib/utilities';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes - REQUIRED
let DynamicRoutes = [{
  name: 'ReferenceApp',
  path: '/reference-app',
  element: <ReferenceAppPage />,
  requireAuth: true,
  description: 'Reference application main page'
}, {
  name: 'G10Certification',
  path: '/g10-certification',
  element: <G10CertificationPage />,
  requireAuth: true,
  description: '(g)(10) Certification tracking page'
}];

// Admin routes - OPTIONAL (for admin-only features)
let AdminDynamicRoutes = [{
  name: 'ReferenceAppAdmin',
  path: '/admin/reference-app',
  element: <ReferenceAppPage adminMode={true} />,
  requireAuth: true
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Workflow items - appears in main workflow section
let SidebarWorkflows = [{
  primaryText: "Reference App",
  to: '/reference-app',
  iconName: 'dashboard',
  requireAuth: true
}, {
  primaryText: "(g)(10) Certification",
  to: '/g10-certification',
  iconName: 'checklist',
  requireAuth: true
}];

// FHIR resource navigation - appears in resources section
let SidebarElements = [{
  primaryText: "Reference Resources",
  to: '/reference-app/resources',
  iconName: 'list',
  collectionName: 'ReferenceResources',
  requireAuth: true
}];

// Clinician workflows - OPTIONAL (for clinician-specific features)
let ClinicianWorkflows = [{
  primaryText: "Clinical Reference",
  to: '/reference-app/clinical',
  iconName: 'stethoscope'
}];

// Admin sidebar elements - OPTIONAL
let AdminSidebarElements = [{
  primaryText: "Reference Admin",
  to: '/admin/reference-app',
  iconName: 'settings',
  excludeDevice: ['iPhone', 'iPad'],
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

// Page-specific footer buttons
let FooterButtons = [{
  pathname: '/reference-app',
  element: <ReferenceAppFooterButtons />
}];

// Global footer elements - OPTIONAL
let FooterElements = [{
  label: 'Reference Action',
  className: 'reference-footer-button',
  style: {
    color: '#FFF',
    backgroundColor: '#2196F3'
  },
  onClick: function() {
    console.log('Reference footer button clicked');
    // Add action logic here
  }
}];

// =============================================================================
// ADVANCED FEATURES (OPTIONAL)
// =============================================================================

// Override main landing page - OPTIONAL
const MainPage = {
  name: 'ReferenceHome',
  path: '/',
  element: <ReferenceAppPage isMainPage={true} />,
  description: 'Reference app as main landing page'
};

// Module configuration - OPTIONAL
const ModuleConfig = {
  name: 'ReferenceApp',
  version: '0.1.0',
  fhirResources: ['Patient', 'Observation', 'Procedure'],
  settings: {
    enableAdvancedFeatures: false,
    showInSidebar: true,
    requireAuthentication: true
  }
};

// Patient directory buttons - OPTIONAL
const PatientsDirectoryButtons = [{
  id: 'certify-patient-action',
  label: 'Certify',
  color: 'primary',
  onClick: function(patientId, patient) {
    console.log('Certify clicked for patient:', patientId);
    window.location.href = '/g10-certification?patient=' + patientId;
  }
}];

// Workflow tabs for header - OPTIONAL
// Note: Since we removed tabs from ReferenceAppPage, these are likely not used
// Keeping empty array to prevent breaking other components that might import this
let WorkflowTabs = [];

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.referenceApp.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
}

// Check sidebar visibility
if (!get(Meteor, 'settings.public.modules.referenceApp.showInSidebar', true)) {
  SidebarWorkflows = [];
  SidebarElements = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

// Standard exports - include all that apply to your package
export { 
  // REQUIRED
  DynamicRoutes,
  
  // RECOMMENDED
  SidebarWorkflows,
  SidebarElements,
  // FooterButtons,
  
  // OPTIONAL - Admin features
  AdminDynamicRoutes,
  AdminSidebarElements,
  ClinicianWorkflows,
  
  // OPTIONAL - Advanced features
  MainPage,
  ModuleConfig,
  PatientsDirectoryButtons,
  FooterElements,
  WorkflowTabs,
  
  // Component exports for reuse
  ReferenceAppPage,
  G10CertificationPage,
  ReferenceAppWorkflow,
  ReferenceAppFooterButtons,
  
  // Utility exports
  ReferenceAppCollections,
  ReferenceAppUtilities
};
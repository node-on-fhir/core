// packages/clinical-documents/index.jsx

import React, { lazy, Suspense } from 'react';
import { get } from 'lodash';

// Import components directly for now - we can add lazy loading later
import ClinicalDocumentsList from './client/pages/ClinicalDocumentsList';
import ClinicalDocumentDetail from './client/pages/ClinicalDocumentDetail';

// Define routes for the package
let DynamicRoutes = [];

// Only add routes if enabled in settings
if (get(Meteor, 'settings.public.clinicalDocuments.enabled', true)) {
  DynamicRoutes = [
    {
      name: 'ClinicalDocumentsList',
      path: '/clinical-documents',
      element: <ClinicalDocumentsList />,
      requireAuth: true
    },
    {
      name: 'ClinicalDocumentDetail',
      path: '/clinical-documents/:id',
      element: <ClinicalDocumentDetail />,
      requireAuth: true
    },
    {
      name: 'NewClinicalDocument',
      path: '/clinical-documents/new',
      element: <ClinicalDocumentsList />,
      requireAuth: true
    }
  ];
}

// Sidebar elements for FHIR resources
let SidebarElements = [];

if (get(Meteor, 'settings.public.clinicalDocuments.showInSidebar', true)) {
  SidebarElements = [
    {
      primaryText: 'Clinical Documents',
      to: '/clinical-documents',
      iconName: 'DocumentText',
      collectionName: 'ClinicalDocuments',
      requireAuth: true
    }
  ];
}

// Workflow items for clinical workflows section
let SidebarWorkflows = [
  {
    primaryText: 'Document Management',
    to: '/clinical-documents',
    iconName: 'document'
  }
];

// Export collections
export { ClinicalDocuments } from './lib/collections/ClinicalDocuments';
export { DocumentRevisions } from './lib/collections/DocumentRevisions';

// Export components (when implemented)
// export { ClinicalDocumentViewer } from './client/components/ClinicalDocumentViewer';
// export { ClinicalDocumentEditor } from './client/components/ClinicalDocumentEditor';

// Export routes and sidebar elements
export { 
  DynamicRoutes, 
  SidebarElements,
  SidebarWorkflows 
};
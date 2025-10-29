// packages/dicom-viewer/index.jsx

import React from 'react';
import StudyListPage from './client/StudyListPage';

// DICOM viewer routes
let DynamicRoutes = [
  {
    name: 'DicomStudies',
    path: '/dicom/studies',
    element: <StudyListPage />,
    requireAuth: true
  }
];

//=============================================================================
// SIDEBAR INTEGRATION
// Add DICOM viewer to patient sidebar

let SidebarWorkflows = [{
  primaryText: "DICOM Imaging",
  to: '/dicom/studies',
  iconName: "imaging",
  requireAuth: true
}];


export { 
  DynamicRoutes,
  SidebarWorkflows
 };

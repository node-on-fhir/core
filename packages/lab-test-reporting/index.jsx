// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/lab-test-reporting/index.jsx

import React from 'react';
import LabTestReportingPage from './client/LabTestReportingPage.jsx';

// Route registration for Honeycomb
let DynamicRoutes = [{
  name: 'LabTestReporting',
  path: '/lab-test-reporting',
  element: <LabTestReportingPage />,
  requireAuth: true
}];

// Sidebar menu integration
let SidebarWorkflows = [{
  primaryText: "Lab Test Reporting",
  to: '/lab-test-reporting',
  iconName: "biotech"
}];

// Clinician workflow integration
let ClinicianWorkflows = [{
  primaryText: "Public Health Lab Reports",
  to: '/lab-test-reporting',
  iconName: "science"
}];

export { 
  DynamicRoutes, 
  SidebarWorkflows, 
  ClinicianWorkflows
};
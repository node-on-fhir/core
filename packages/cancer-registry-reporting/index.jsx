// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/cancer-registry-reporting/index.jsx

import React from 'react';
import CancerRegistryReportingPage from './client/CancerRegistryReportingPage.jsx';

// Route registration for Honeycomb
let DynamicRoutes = [{
  name: 'CancerRegistryReporting',
  path: '/cancer-registry-reporting',
  element: <CancerRegistryReportingPage />,
  requireAuth: true
}];

// Sidebar menu integration
let SidebarWorkflows = [{
  primaryText: "Cancer Registry",
  to: '/cancer-registry-reporting',
  iconName: "biotech"
}];

// Clinician workflow integration
let ClinicianWorkflows = [{
  primaryText: "Cancer Surveillance",
  to: '/cancer-registry-reporting',
  iconName: "science"
}];

export { 
  DynamicRoutes, 
  SidebarWorkflows, 
  ClinicianWorkflows
};
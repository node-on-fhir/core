// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/case-reporting/index.jsx

import React from 'react';
import CaseReportingPage from './client/CaseReportingPage.jsx';

// Route registration for Honeycomb
let DynamicRoutes = [{
  name: 'CaseReporting',
  path: '/case-reporting',
  element: <CaseReportingPage />,
  requireAuth: true
}];

// Sidebar menu integration
let SidebarWorkflows = [{
  primaryText: "Case Reporting",
  to: '/case-reporting',
  iconName: "report"
}];

// Clinician workflow integration
let ClinicianWorkflows = [{
  primaryText: "Electronic Case Reports",
  to: '/case-reporting',
  iconName: "publicHealth"
}];

export { 
  DynamicRoutes, 
  SidebarWorkflows, 
  ClinicianWorkflows
};
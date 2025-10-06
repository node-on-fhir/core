// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/antimicrobial-reporting/index.jsx

import React from 'react';
import AntimicrobialReportingPage from './client/AntimicrobialReportingPage.jsx';

// Route registration for Honeycomb
let DynamicRoutes = [{
  name: 'AntimicrobialReporting',
  path: '/antimicrobial-reporting',
  element: <AntimicrobialReportingPage />,
  requireAuth: true
}];

// Sidebar menu integration
let SidebarWorkflows = [{
  primaryText: "Antimicrobial Surveillance",
  to: '/antimicrobial-reporting',
  iconName: "biotech"
}];

// Clinician workflow integration
let ClinicianWorkflows = [{
  primaryText: "Resistance Monitoring",
  to: '/antimicrobial-reporting',
  iconName: "coronavirus"
}];

export { 
  DynamicRoutes, 
  SidebarWorkflows, 
  ClinicianWorkflows
};
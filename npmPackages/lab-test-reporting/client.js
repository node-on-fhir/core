// npmPackages/lab-test-reporting/client.js
//
// Client entry — ONC 170.315(f)(3) lab test reporting to public health. Migrated
// from packages/lab-test-reporting (Atmosphere clinical:lab-test-reporting) 2026-06-13.

import React from 'react';
import LabTestReportingPage from './client/LabTestReportingPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'LabTestReportingPage') {
    element = <LabTestReportingPage />;
  } else {
    console.warn('[lab-test-reporting] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere SidebarWorkflows + ClinicianWorkflows → sidebarItems.
const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

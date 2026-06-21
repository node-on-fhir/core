// npmPackages/case-reporting/client.js
//
// Client entry — ONC 170.315(f)(5) electronic case reporting (eCR). Migrated
// from packages/case-reporting (Atmosphere clinical:case-reporting) 2026-06-13.

import React from 'react';
import CaseReportingPage from './client/CaseReportingPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'CaseReportingPage') {
    element = <CaseReportingPage />;
  } else {
    console.warn('[case-reporting] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere had SidebarWorkflows + ClinicianWorkflows (both → /case-reporting);
// consolidated into sidebarItems on the default export.
const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

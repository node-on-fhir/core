// npmPackages/cancer-registry-reporting/client.js
//
// Client entry — ONC 170.315(f)(4) cancer registry reporting. Migrated from
// packages/cancer-registry-reporting (Atmosphere clinical:cancer-registry-reporting) 2026-06-13.

import React from 'react';
import CancerRegistryReportingPage from './client/CancerRegistryReportingPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'CancerRegistryReportingPage') {
    element = <CancerRegistryReportingPage />;
  } else {
    console.warn('[cancer-registry-reporting] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

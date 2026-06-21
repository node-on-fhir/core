// npmPackages/antimicrobial-reporting/client.js
//
// Client entry — ONC 170.315(f)(6) antimicrobial use + resistance reporting.
// Migrated from packages/antimicrobial-reporting (Atmosphere
// clinical:antimicrobial-reporting) 2026-06-13.

import React from 'react';
import AntimicrobialReportingPage from './client/AntimicrobialReportingPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'AntimicrobialReportingPage') {
    element = <AntimicrobialReportingPage />;
  } else {
    console.warn('[antimicrobial-reporting] Unknown component in workflow.json: ' + route.component);
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

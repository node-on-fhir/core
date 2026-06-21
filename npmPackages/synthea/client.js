// npmPackages/synthea/client.js
//
// Client entry — Synthea synthetic-patient-data configuration. Migrated from
// packages/synthea (Atmosphere clinical:synthea) 2026-06-13.

import React from 'react';
import SyntheaConfigurationPage from './client/SyntheaConfigurationPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'SyntheaConfigurationPage') {
    element = <SyntheaConfigurationPage />;
  } else {
    console.warn('[synthea] Unknown component in workflow.json: ' + route.component);
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

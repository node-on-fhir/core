// npmPackages/healthcare-surveys/client.js
//
// Client entry — public-health surveys transmission (ONC §170.315(f)(7)).
// Migrated from packages/healthcare-surveys (Atmosphere) 2026-06-13. The
// Atmosphere client mainModule was index.jsx (clean ES-module style); this
// consolidates into a self-contained entry that builds the route/sidebar from
// workflow.json and preserves the SidebarElements/SidebarWorkflows exports.

import React from 'react';
import HealthcareSurveysPage from './client/HealthcareSurveysPage';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'HealthcareSurveysPage') {
    element = <HealthcareSurveysPage />;
  } else {
    console.warn('[healthcare-surveys] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false, description: route.description };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Per-collection sidebar flavor preserved as a named export.
const SidebarElements = [{
  primaryText: 'Healthcare Surveys', to: '/healthcare-surveys', iconName: 'Analytics', collectionName: 'Compositions'
}];

export { DynamicRoutes, SidebarElements, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

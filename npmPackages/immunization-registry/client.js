// npmPackages/immunization-registry/client.js
//
// Client entry — ONC 170.315(f)(1) immunization registry reporting. Migrated
// from packages/immunization-registry (Atmosphere clinical:immunization-registry) 2026-06-13.

import React from 'react';
import ImmunizationRegistryPage from './client/ImmunizationRegistryPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'ImmunizationRegistryPage') {
    element = <ImmunizationRegistryPage />;
  } else {
    console.warn('[immunization-registry] Unknown component in workflow.json: ' + route.component);
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

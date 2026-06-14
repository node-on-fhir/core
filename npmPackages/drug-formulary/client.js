// npmPackages/drug-formulary/client.js
//
// Client entry — ONC 170.315(a)(10) drug formulary + preferred drug list checks.
// Migrated from packages/drug-formulary (Atmosphere clinical:drug-formulary) 2026-06-13.

import React from 'react';
import DrugFormularyPage from './client/DrugFormularyPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'DrugFormularyPage') {
    element = <DrugFormularyPage />;
  } else {
    console.warn('[drug-formulary] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere SidebarElements (collectionName FormularyDrugs) → sidebarItems.
const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false,
    collectionName: item.collectionName
  };
});

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

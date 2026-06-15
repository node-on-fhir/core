// npmPackages/clinical-lists/client.js
//
// Client entry — ONC 170.315(a)(6-8) problem / medication-allergy / medication
// lists. Migrated from packages/clinical-lists (Atmosphere clinical:clinical-lists)
// 2026-06-13.

import React from 'react';
import ProblemListPage from './client/ProblemListPage.jsx';
import MedicationAllergyListPage from './client/MedicationAllergyListPage.jsx';
import MedicationListPage from './client/MedicationListPage.jsx';
import workflowConfig from './workflow.json';

const COMPONENTS = {
  ProblemListPage: <ProblemListPage />,
  MedicationAllergyListPage: <MedicationAllergyListPage />,
  MedicationListPage: <MedicationListPage />
};

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[clinical-lists] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere SidebarElements (collectionName badges) → sidebarItems.
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

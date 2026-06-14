// npmPackages/family-health-history/client.js
//
// Client entry — ONC 170.315(a)(12) family health history + family-tree viz.
// Migrated from packages/family-health-history (Atmosphere
// clinical:family-health-history) 2026-06-13.

import React from 'react';
import FamilyHealthHistoryPage from './client/FamilyHealthHistoryPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'FamilyHealthHistoryPage') {
    element = <FamilyHealthHistoryPage />;
  } else {
    console.warn('[family-health-history] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere had SidebarElements (with collectionName badge) + SidebarWorkflows
// (Family Tree); both consolidated into sidebarItems on the default export.
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

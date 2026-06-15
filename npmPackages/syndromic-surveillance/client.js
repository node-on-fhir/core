// npmPackages/syndromic-surveillance/client.js
//
// Client entry — ONC 170.315(f)(2) syndromic-surveillance route. Migrated from
// packages/syndromic-surveillance (Atmosphere clinical:syndromic-surveillance)
// 2026-06-13.

import React from 'react';
import SyndromicSurveillancePage from './client/SyndromicSurveillancePage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'SyndromicSurveillancePage') {
    element = <SyndromicSurveillancePage />;
  } else {
    console.warn('[syndromic-surveillance] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere exported SidebarElements (with collectionName for a badge count);
// the host WorkflowRegistry reads sidebarItems off the default export, so the
// sidebar entry (incl. collectionName) is carried there.
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

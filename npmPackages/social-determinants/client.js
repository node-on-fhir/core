// npmPackages/social-determinants/client.js
//
// Client entry — ONC 170.315(a)(15) SDOH screening + assessment. Migrated from
// packages/social-determinants (Atmosphere clinical:social-determinants) 2026-06-13.

import React from 'react';
import SocialDeterminantsPage from './client/SocialDeterminantsPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'SocialDeterminantsPage') {
    element = <SocialDeterminantsPage />;
  } else {
    console.warn('[social-determinants] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

// Atmosphere SidebarElements (collectionName Observations badge) + SidebarWorkflows
// (SDOH Screening) consolidated into sidebarItems on the default export.
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

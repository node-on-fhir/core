// npmPackages/accounts-management/client.js
//
// Client entry — user accounts + access-control management. Migrated from
// packages/accounts-management (Atmosphere) 2026-06-14. The Atmosphere client
// mainModule was index.jsx, which exported a single DynamicRoute and no sidebar
// item (the page is reached by URL / header menu, not the sidebar). This entry
// builds routes from workflow.json and preserves the AccountsManagementPage
// named export.

import React from 'react';
import AccountsManagementPage from './client/AccountsManagementPage';
import workflowConfig from './workflow.json';

const COMPONENTS = { AccountsManagementPage };

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[accounts-management] Unknown component in workflow.json: ' + route.component);
  }
  return {
    name: route.name,
    path: route.path,
    element: Comp ? <Comp /> : null,
    requireAuth: route.requireAuth || false,
    description: route.description
  };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { DynamicRoutes, SidebarWorkflows, AccountsManagementPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

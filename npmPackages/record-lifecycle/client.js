// npmPackages/record-lifecycle/client.js

import React from 'react';
import RecordLifecyclePage from './client/RecordLifecyclePage.jsx';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;

  switch (route.component) {
    case 'RecordLifecyclePage':
      element = <RecordLifecyclePage />;
      break;
    default:
      console.warn(`[record-lifecycle] Unknown component: ${route.component}`);
  }

  return {
    name: route.name,
    path: route.path,
    element: element,
    requireAuth: route.requireAuth || false
  };
});

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false
  };
});

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DynamicRoutes,
  SidebarWorkflows,
  RecordLifecyclePage
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

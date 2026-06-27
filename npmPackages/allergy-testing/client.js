// npmPackages/allergy-testing/client.js

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import AllergyTestingPage from './client/AllergyTestingPage.jsx';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

const COMPONENTS = { AllergyTestingPage };

let DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[allergy-testing] Unknown component: ' + route.component);
  }
  return {
    name: route.name,
    path: route.path,
    element: Comp ? <Comp /> : null,
    requireAuth: route.requireAuth || false
  };
});

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

let SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false
  };
});

// =============================================================================
// SETTINGS GATE
// =============================================================================

if (!get(Meteor, 'settings.public.modules.allergyTesting.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { DynamicRoutes, SidebarWorkflows, AllergyTestingPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

// npmPackages/decision-support/client.js

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import DecisionSupportPage from './client/DecisionSupportPage.jsx';
import InterventionEditor from './client/InterventionEditor.jsx';
import DsiSourceAttributePolicy from './client/components/DsiSourceAttributePolicy.jsx';
import DsiInitialize from './client/components/DsiInitialize.jsx';
import DsiAlert, { useDecisionSupport } from './client/components/DsiAlert.jsx';
import { DecisionSupportFeedback } from './lib/collections.js';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

const COMPONENTS = { DecisionSupportPage, InterventionEditor };

let DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[decision-support] Unknown component: ' + route.component);
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
// SERVER CONFIGS (source-attribute usage policy tab)
// =============================================================================

const ServerConfigs = [
  <DsiInitialize key="dsi-initialize" />,
  <DsiSourceAttributePolicy key="dsi-source-attribute-policy" />
];

// =============================================================================
// MODULE CONFIG (certification metadata)
// =============================================================================

const ModuleConfig = {
  name: 'DecisionSupport',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(b)(11) - Decision support interventions'],
  standards: ['USCDI', 'FHIR PlanDefinition', 'FHIR GuidanceResponse'],
  fhirResources: ['PlanDefinition', 'GuidanceResponse', 'DetectedIssue', 'Citation', 'ServiceRequest'],
  settings: { showInSidebar: true, requireAuthentication: true }
};

// =============================================================================
// SETTINGS GATE
// =============================================================================

if (!get(Meteor, 'settings.public.modules.decisionSupport.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DynamicRoutes,
  SidebarWorkflows,
  ServerConfigs,
  ModuleConfig,
  DecisionSupportPage,
  InterventionEditor,
  DsiSourceAttributePolicy,
  DsiInitialize,
  DsiAlert,
  useDecisionSupport,
  DecisionSupportFeedback
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  serverConfigs: ServerConfigs
};

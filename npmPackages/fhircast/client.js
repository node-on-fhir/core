// npmPackages/fhircast-module/client.js

import React from 'react';
import FhircastConfigPage from './client/FhircastConfigPage.jsx';
import FhircastSubscribePage from './client/FhircastSubscribePage.jsx';
import FhircastPublishPage from './client/FhircastPublishPage.jsx';
import FhircastNavButtons from './client/components/FhircastNavButtons.jsx';
import CollectionsToPublish from './client/components/CollectionsToPublish.jsx';
import SubscribeButton from './client/components/SubscribeButton.jsx';
import { FhircastEvents } from './lib/FhircastEvents';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;

  switch (route.component) {
    case 'FhircastConfigPage':
      element = <FhircastConfigPage />;
      break;
    case 'FhircastSubscribePage':
      element = <FhircastSubscribePage />;
      break;
    case 'FhircastPublishPage':
      element = <FhircastPublishPage />;
      break;
    default:
      console.warn('[fhircast-module] Unknown component: ' + route.component);
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
// FOOTER BUTTONS
// =============================================================================

const FooterButtons = [{
  pathname: ['/fhircast-config', '/fhircast-subscribe', '/fhircast-publish'],
  element: <FhircastNavButtons />
}];

// =============================================================================
// SERVER CONFIGS
// =============================================================================

const ServerConfigs = [<CollectionsToPublish key="fhircast-collections" />];

// =============================================================================
// EXPORTS
// =============================================================================

// Named exports (for direct import)
export {
  DynamicRoutes,
  SidebarWorkflows,
  FooterButtons,
  ServerConfigs,
  FhircastConfigPage,
  FhircastSubscribePage,
  FhircastPublishPage,
  FhircastNavButtons,
  CollectionsToPublish,
  SubscribeButton
};

// Default export (for WorkflowRegistry.registerWorkflow())
export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons,
  serverConfigs: ServerConfigs
};

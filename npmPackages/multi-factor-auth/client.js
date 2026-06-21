// npmPackages/multi-factor-auth/client.js
//
// Client entry — ONC 170.315(d)(13) multi-factor authentication (TOTP + backup
// codes). Migrated from packages/multi-factor-auth (Atmosphere
// clinical:multi-factor-auth) 2026-06-13.

import React from 'react';
import { MFASetupPage } from './client/pages/MFASetupPage.jsx';
import { MFAManagementPage } from './client/pages/MFAManagementPage.jsx';
import workflowConfig from './workflow.json';

const COMPONENTS = {
  MFASetupPage: <MFASetupPage />,
  MFAManagementPage: <MFAManagementPage />
};

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[multi-factor-auth] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// The Atmosphere package registered two no-op footers (components returning
// null); equivalent to none under the host's {pathname, element} contract.
const FooterButtons = [];

export { DynamicRoutes, SidebarWorkflows, FooterButtons, MFASetupPage, MFAManagementPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

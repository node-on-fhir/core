// npmPackages/consent-generator/client.js
//
// Client entry — FHIR consent document generator. Migrated from
// packages/consent-generator (Atmosphere) 2026-06-13. The Atmosphere client
// mainModule was index.jsx; this consolidates into a self-contained entry that
// builds routes/sidebar from workflow.json and re-exports the named exports.
// (index.jsx referenced React + ConsentGeneratorPage as values while only
// re-exporting them — latent bugs avoided here by importing the component.)

import React from 'react';
import { ConsentGeneratorPage } from './client/ConsentGeneratorPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'ConsentGeneratorPage') {
    element = <ConsentGeneratorPage />;
  } else {
    console.warn('[consent-generator] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Library surface preserved
export { ConsentGeneratorPage };
export { ConsentTemplates } from './lib/ConsentTemplates';

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

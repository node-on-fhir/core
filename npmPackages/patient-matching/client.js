// npmPackages/patient-matching/client.js
//
// Client entry — patient matching + identity assurance (IDI / NIST 800-63 AAL).
// Migrated from packages/patient-matching (Atmosphere) 2026-06-13. The Atmosphere
// client mainModule was index.jsx; this consolidates into a self-contained entry
// that builds routes/sidebar from workflow.json and re-exports the library surface.

import React from 'react';
import PatientMatchingPageComponent from './client/pages/PatientMatchingPage.jsx';
import IdentityAssurancePageComponent from './client/pages/IdentityAssurancePage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'PatientMatchingPage') {
    element = <PatientMatchingPageComponent />;
  } else if (route.component === 'IdentityAssurancePage') {
    element = <IdentityAssurancePageComponent />;
  } else {
    console.warn('[patient-matching] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Library surface preserved (namespace + pages)
export { PatientMatching } from './lib/PatientMatching.js';
export {
  PatientMatchingPageComponent as PatientMatchingPage,
  IdentityAssurancePageComponent as IdentityAssurancePage
};

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

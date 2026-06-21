// npmPackages/vital-signs/client.js
//
// Client entry — HL7 FHIR Vital Signs IG (panels, recording, display). Migrated
// from packages/vital-signs (Atmosphere) 2026-06-13. The Atmosphere client
// mainModule was index.jsx; this consolidates into a self-contained entry that
// builds routes/sidebar from workflow.json, re-exports the lib surface, and adds
// the `Meteor` import that index.jsx relied on as an Atmosphere global.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { VitalSignsPageWrapper } from './client/VitalSignsPageWrapper';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'VitalSignsPageWrapper') {
    element = <VitalSignsPageWrapper />;
  } else {
    console.warn('[vital-signs] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarElements = [{
  primaryText: 'Vital Signs', to: '/vital-signs', iconName: 'Favorite', requireAuth: true, collectionName: 'Observations'
}];

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { DynamicRoutes, SidebarElements, SidebarWorkflows };

// Re-export the shared lib surface (VitalSigns collection handle, schemas,
// value sets, extensions, utilities, package metadata) — same as index.jsx.
export * from './lib/index.js';

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

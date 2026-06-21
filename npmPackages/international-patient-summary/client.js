// npmPackages/international-patient-summary/client.js
//
// Client entry — International Patient Summary (IPS) viewer/export. Migrated from
// packages/international-patient-summary (Atmosphere) 2026-06-13. The Atmosphere
// client mainModule was index.jsx; this consolidates into a self-contained entry
// that builds routes/sidebar from workflow.json and preserves the named exports.
//
// Note: the page lazy-loads @mlc-ai/web-llm by injecting a `<script type=module>`
// whose innerHTML is a string `import` from https://esm.run/... — it is NOT a
// bundler import, so Rspack does not process or need that dependency.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import InternationalPatientSummaryPage from './client/InternationalPatientSummaryPage';
import IpsContent from './client/IpsContent';
import { IPSFooterButtons } from './client/FooterButtons';
import workflowConfig from './workflow.json';

// Preserve the Atmosphere side effect: expose IpsContent on Meteor for other modules.
Meteor.startup(function() {
  Meteor.IpsContent = IpsContent;
});

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'InternationalPatientSummaryPage') {
    element = <InternationalPatientSummaryPage />;
  } else {
    console.warn('[international-patient-summary] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

const SidebarElements = [];

const FooterButtons = [{
  pathname: '/international-patient-summary',
  element: <IPSFooterButtons />
}];

export { FooterButtons, SidebarWorkflows, SidebarElements, DynamicRoutes, IpsContent };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

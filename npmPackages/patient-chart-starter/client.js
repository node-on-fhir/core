// npmPackages/patient-chart-starter/client.js
//
// Client entry — patient chart starter (SMART on FHIR demo). Migrated from
// packages/patient-chart-starter (Atmosphere mitre:patient-chart-starter)
// 2026-06-13. Client-only (no server code).

import React from 'react';
import PatientChart from './client/PatientChart.jsx';
import { PatientChartButtons } from './client/FooterButtons.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'PatientChart') {
    element = <PatientChart />;
  } else {
    console.warn('[patient-chart-starter] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

const FooterButtons = [{
  pathname: '/patient-chart-starter',
  element: <PatientChartButtons />
}];

// MainPage / override preserved as a named export (not forced into routes).
const MainPage = { name: 'Patient Chart', path: '/', element: <PatientChart /> };

export { DynamicRoutes, SidebarWorkflows, FooterButtons, MainPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

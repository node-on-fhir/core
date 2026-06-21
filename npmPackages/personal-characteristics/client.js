// npmPackages/personal-characteristics/client.js
//
// Client entry — phenotype domains + dermatome visualizations. Migrated from
// packages/personal-characteristics (Atmosphere clinical:personal-characteristics)
// 2026-06-13. Client-only package (no server code). Settings-gated: routes/sidebar
// appear only when settings.public.defaults.sidebar.menuItems.PatientCharacteristics
// is true (default false, preserved from the original).

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import PatientCharacteristicsPage from './client/PatientCharacteristicsPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.defaults.sidebar.menuItems.PatientCharacteristics', false);

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'PatientCharacteristicsPage') {
    element = <PatientCharacteristicsPage />;
  } else {
    console.warn('[personal-characteristics] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

const SidebarWorkflows = isEnabled ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

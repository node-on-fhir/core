// npmPackages/implantable-devices/client.js
//
// Client entry — ONC 170.315(g)(7) implantable device registry (UDI/GUDID).
// Migrated from packages/implantable-devices (Atmosphere clinical:implantable-devices)
// 2026-06-13. Settings-gated (implantableDevices.enabled / .showInWorkflows).

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import ImplantableDevicesPage from './client/ImplantableDevicesPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.modules.implantableDevices.enabled', true);
const showInWorkflows = get(Meteor, 'settings.public.modules.implantableDevices.showInWorkflows', true);

const COMPONENTS = {
  ImplantableDevicesPage: <ImplantableDevicesPage />,
  ImplantableDevicesPage_Detail: <ImplantableDevicesPage viewMode="detail" />
};

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[implantable-devices] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

const SidebarWorkflows = (isEnabled && showInWorkflows) ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

// No footer buttons — device assignment is handled inline on the page
// (Assign to Patient in the device detail panel).
const FooterButtons = [];

const ModuleConfig = {
  name: 'ImplantableDevices',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(g)(7) - Implantable Device List'],
  fhirResources: ['Device', 'DeviceUseStatement', 'DeviceRequest', 'Procedure']
};

export { DynamicRoutes, SidebarWorkflows, FooterButtons, ModuleConfig, ImplantableDevicesPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

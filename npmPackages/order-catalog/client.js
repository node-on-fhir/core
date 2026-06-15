// npmPackages/order-catalog/client.js
//
// Client entry — ONC 170.315(a)(1-3) CPOE (computerized provider order entry).
// Migrated from packages/order-catalog (Atmosphere clinical:order-catalog)
// 2026-06-13. Settings-gated (orderCatalog.enabled / .showInWorkflows).

import React from 'react';
import { Button } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import OrderCatalogPage from './client/OrderCatalogPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.modules.orderCatalog.enabled', true);
const showInWorkflows = get(Meteor, 'settings.public.modules.orderCatalog.showInWorkflows', true);

const COMPONENTS = {
  OrderCatalogPage: <OrderCatalogPage />,
  OrderCatalogPage_Medication: <OrderCatalogPage defaultType="medication" />,
  OrderCatalogPage_Laboratory: <OrderCatalogPage defaultType="laboratory" />,
  OrderCatalogPage_Radiology: <OrderCatalogPage defaultType="radiology" />
};

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[order-catalog] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

// Atmosphere ClinicianWorkflows → sidebarItems (SidebarWorkflows was empty).
const SidebarWorkflows = (isEnabled && showInWorkflows) ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

const FooterButtons = isEnabled ? [{
  pathname: '/order-catalog',
  element: (
    <Button id="submitOrdersButton" color="primary" variant="contained"
      onClick={function() { console.log('Submit orders clicked'); }}>
      Submit Orders
    </Button>
  )
}] : [];

const ModuleConfig = {
  name: 'OrderCatalog',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(a)(1) - CPOE Medications',
    '170.315(a)(2) - CPOE Laboratory',
    '170.315(a)(3) - CPOE Diagnostic Imaging',
    '170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks'
  ],
  fhirResources: ['ServiceRequest', 'MedicationRequest', 'PlanDefinition', 'ActivityDefinition', 'SpecimenDefinition', 'ImagingStudy']
};

export { DynamicRoutes, SidebarWorkflows, FooterButtons, ModuleConfig, OrderCatalogPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

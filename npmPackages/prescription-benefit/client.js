// npmPackages/prescription-benefit/client.js

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import PrescriptionBenefitPage from './client/PrescriptionBenefitPage.jsx';
import { PrescriptionBenefitFooterButtons } from './client/FooterButtons.jsx';
import {
  PrescriptionBenefitRequest,
  PrescriptionBenefitResponse
} from './lib/collections.js';
import workflowConfig from './workflow.json';

// =============================================================================
// DYNAMIC ROUTES
// =============================================================================

let DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;

  switch (route.component) {
    case 'PrescriptionBenefitPage':
      element = <PrescriptionBenefitPage />;
      break;
    default:
      console.warn('[prescription-benefit] Unknown component: ' + route.component);
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

let SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return {
    primaryText: item.primaryText,
    to: item.to,
    iconName: item.iconName,
    requireAuth: item.requireAuth || false
  };
});

// =============================================================================
// FOOTER BUTTONS (scoped to /prescription-benefits)
// =============================================================================

const FooterButtons = [{
  pathname: '/prescription-benefits',
  element: <PrescriptionBenefitFooterButtons />
}];

// =============================================================================
// MODULE CONFIG (informational / certification metadata)
// =============================================================================

const ModuleConfig = {
  name: 'PrescriptionBenefit',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(b)(4) - Real-time prescription benefit'],
  standards: ['NCPDP Real-Time Prescription Benefit IG v13', 'RxNorm', 'NDC'],
  fhirResources: ['Patient', 'MedicationRequest', 'Coverage'],
  settings: { showInSidebar: true, requireAuthentication: true }
};

// =============================================================================
// SETTINGS GATE
// =============================================================================

if (!get(Meteor, 'settings.public.modules.prescriptionBenefit.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DynamicRoutes,
  SidebarWorkflows,
  FooterButtons,
  ModuleConfig,
  PrescriptionBenefitPage,
  PrescriptionBenefitFooterButtons,
  PrescriptionBenefitRequest,
  PrescriptionBenefitResponse
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

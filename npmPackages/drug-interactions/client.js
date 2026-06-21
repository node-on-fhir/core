// npmPackages/drug-interactions/client.js
//
// Client entry — ONC 170.315(a)(4) drug-drug + drug-allergy interaction checks.
// Migrated from packages/drug-interactions (Atmosphere clinical:drug-interactions)
// 2026-06-13. Settings-gated (drugInteractions.enabled / .showInWorkflows).

import React from 'react';
import { Button } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import DrugInteractionCheckerPage from './client/DrugInteractionCheckerPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.modules.drugInteractions.enabled', true);
const showInWorkflows = get(Meteor, 'settings.public.modules.drugInteractions.showInWorkflows', true);

// Component keys encode the defaultMode prop variants (same page, different mode).
const COMPONENTS = {
  DrugInteractionCheckerPage: <DrugInteractionCheckerPage />,
  DrugInteractionCheckerPage_DrugDrug: <DrugInteractionCheckerPage defaultMode="drug-drug" />,
  DrugInteractionCheckerPage_DrugAllergy: <DrugInteractionCheckerPage defaultMode="drug-allergy" />
};

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[drug-interactions] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

// Atmosphere ClinicianWorkflows → sidebarItems (gated by enabled + showInWorkflows).
const SidebarWorkflows = (isEnabled && showInWorkflows) ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

// Footer button (carried from the Atmosphere FooterButtons export)
const FooterButtons = isEnabled ? [{
  pathname: '/drug-interactions',
  element: (
    <Button id="checkInteractionsButton" color="primary" variant="contained"
      onClick={function() { console.log('Check interactions clicked'); }}>
      Check Interactions
    </Button>
  )
}] : [];

const ModuleConfig = {
  name: 'DrugInteractions',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks'],
  fhirResources: ['MedicationRequest', 'MedicationStatement', 'AllergyIntolerance', 'DetectedIssue']
};

export { DynamicRoutes, SidebarWorkflows, FooterButtons, ModuleConfig, DrugInteractionCheckerPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

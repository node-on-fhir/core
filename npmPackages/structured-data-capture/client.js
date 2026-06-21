// npmPackages/structured-data-capture/client.js
//
// Client entry — FHIR Structured Data Capture (Questionnaire / QuestionnaireResponse:
// forms, builder, library, response analytics). Migrated from
// packages/structured-data-capture (Atmosphere) 2026-06-13. The Atmosphere client
// mainModule was index.jsx; this consolidates into a self-contained entry that
// builds routes/sidebar from workflow.json and preserves the named exports
// (SidebarWorkflows, ClinicianWorkflows, FooterButtons, ModuleConfig, utils).

import React from 'react';
import StructuredDataCaptureLandingPage from './client/pages/StructuredDataCaptureLandingPage';
import StructuredDataCapturePage from './client/pages/StructuredDataCapturePage';
import { QuestionnaireBuilderPage } from './client/pages/QuestionnaireBuilderPage';
import { QuestionnaireLibraryPage } from './client/pages/QuestionnaireLibraryPage';
import { ResponseAnalyticsPage } from './client/pages/ResponseAnalyticsPage';
import workflowConfig from './workflow.json';

const COMPONENTS = {
  StructuredDataCaptureLandingPage,
  StructuredDataCapturePage,
  QuestionnaireBuilderPage,
  QuestionnaireLibraryPage,
  ResponseAnalyticsPage
};

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[structured-data-capture] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: Comp ? <Comp /> : null, requireAuth: route.requireAuth || false };
});

// SidebarWorkflows intentionally empty (items now reached via the main SDC page).
const SidebarWorkflows = [];

// Clinician workflow sidebar entries (the active nav flavor).
const ClinicianWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Footer buttons (label/onClick config style, preserved from the Atmosphere package).
const FooterButtons = [
  {
    pathname: '/questionnaires',
    label: 'New Questionnaire',
    onClick: function() { window.location.href = '/questionnaires/new'; }
  },
  {
    pathname: '/questionnaire-responses',
    label: 'Export Responses',
    className: 'export-responses',
    style: { backgroundColor: '#4CAF50', color: 'white' },
    onClick: function() { console.log('Exporting questionnaire responses...'); }
  }
];

const ModuleConfig = {
  name: 'StructuredDataCapture',
  version: '0.1.0',
  fhirResources: ['Questionnaire', 'QuestionnaireResponse'],
  dependencies: ['clinical:hl7-resource-datatypes']
};

// Library surface preserved
export { QuestionnaireForm } from './lib/index';
export { QuestionnaireUtils } from './lib/QuestionnaireUtils';
export { ResponseUtils } from './lib/ResponseUtils';
export { ValidationUtils } from './lib/ValidationUtils';

export { DynamicRoutes, SidebarWorkflows, ClinicianWorkflows, FooterButtons, ModuleConfig };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: ClinicianWorkflows,
  footerButtons: FooterButtons
};

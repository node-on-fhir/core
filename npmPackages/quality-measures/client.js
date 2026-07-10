// npmPackages/quality-measures/client.js
//
// Client entry — Clinical Quality Measures (ONC §170.315(c)(1-4)) + PACIO
// I-CARE / CMS1317v1 ACP. Migrated from packages/quality-measures (Atmosphere
// clinical:quality-measures) 2026-06-14. Route /quality-measures
// (QualityMeasuresPage, requireAuth), ClinicianWorkflows / ModuleConfig named
// exports, settings gates, and a Terminology (VSAC BYOK) panel contributed to
// /server-configuration. The isomorphic lib/collections.js (addFiles
// ['client','server']) is imported here for client-side Minimongo parity.
// The legacy dead "Calculate Measures" footer button was retired 2026-07-09.

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import QualityMeasuresPage from './client/QualityMeasuresPage';
import TerminologyConfig from './client/components/TerminologyConfig';
import workflowConfig from './workflow.json';
import './lib/collections.js';

// =============================================================================
// ROUTES
// =============================================================================

let DynamicRoutes = [{
  name: 'QualityMeasures',
  path: '/quality-measures',
  element: <QualityMeasuresPage />,
  requireAuth: true,
  description: 'Clinical Quality Measures - ONC §170.315(c)(1-4)'
}];

// =============================================================================
// SIDEBAR
// =============================================================================

let ClinicianWorkflows = [{
  primaryText: "Quality Measures",
  to: '/quality-measures',
  iconName: 'Assessment',
  requireAuth: true
}];

// =============================================================================
// SERVER CONFIGURATION PANEL
// =============================================================================

// Terminology (VSAC/UMLS BYOK) + measure-package fetch panel, rendered as an
// extension tab on /server-configuration via WorkflowRegistry serverConfigs.
const ServerConfigs = [
  <TerminologyConfig key="quality-measures-terminology" />
];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'QualityMeasures',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(c)(1) - CQMs - Record and Export',
    '170.315(c)(2) - CQMs - Import and Calculate',
    '170.315(c)(3) - CQMs - Report',
    '170.315(c)(4) - CQMs - Quality Management System'
  ],
  supportedMeasures: [
    'CMS2 - Preventive Care and Screening',
    'CMS22 - Preventive Care and Screening: Screening for High Blood Pressure',
    'CMS69 - Preventive Care and Screening: BMI Screening and Follow-Up',
    'CMS90 - Functional Status Assessments for Heart Failure',
    'CMS117 - Childhood Immunization Status',
    'CMS122 - Diabetes: HbA1c Poor Control',
    'CMS125 - Breast Cancer Screening',
    'CMS130 - Colorectal Cancer Screening',
    'CMS146 - Appropriate Testing for Pharyngitis',
    'CMS165 - Controlling High Blood Pressure',
    'PACIO-ICARE - Interoperability Capability & Readiness Evaluation',
    'CMS1317v1 - Advance Care Planning (PACIO FHIR mapping)'
  ],
  fhirResources: [
    'Measure', 'MeasureReport', 'Library', 'Patient', 'Observation',
    'Condition', 'Procedure', 'Encounter', 'DocumentReference', 'Composition'
  ],
  settings: {
    enableCQL: true, cqlVersion: '1.5', measureYear: 2026, enableQRDA: true,
    enableBulkExport: true, maxPatientsPerCalculation: 1000
  }
};

// =============================================================================
// SETTINGS GATES (preserved from index.jsx)
// =============================================================================

if (!get(Meteor, 'settings.public.modules.qualityMeasures.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
}
if (!get(Meteor, 'settings.public.modules.qualityMeasures.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

// SidebarWorkflows alias — what the WorkflowRegistry default export consumes.
const SidebarWorkflows = ClinicianWorkflows;

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DynamicRoutes,
  ClinicianWorkflows,
  SidebarWorkflows,
  ServerConfigs,
  ModuleConfig,
  QualityMeasuresPage
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: ClinicianWorkflows,
  serverConfigs: ServerConfigs
};

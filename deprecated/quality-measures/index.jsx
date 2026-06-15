// packages/quality-measures/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import QualityMeasuresPage from './client/QualityMeasuresPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

let DynamicRoutes = [{
  name: 'QualityMeasures',
  path: '/quality-measures',
  element: <QualityMeasuresPage />,
  requireAuth: true,
  description: 'Clinical Quality Measures - ONC §170.315(c)(1-4)'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

let ClinicianWorkflows = [{
  primaryText: "Quality Measures",
  to: '/quality-measures',
  iconName: 'assessment',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

let FooterButtons = [{
  pathname: '/quality-measures',
  element: (
    <Button
      id="calculateMeasuresButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('Calculate measures clicked');
      }}
    >
      Calculate Measures
    </Button>
  )
}];

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
    'Measure',
    'MeasureReport',
    'Library',
    'Patient',
    'Observation',
    'Condition',
    'Procedure',
    'Encounter',
    'DocumentReference',
    'Composition'
  ],
  settings: {
    enableCQL: true,
    cqlVersion: '1.5',
    measureYear: 2026,
    enableQRDA: true,
    enableBulkExport: true,
    maxPatientsPerCalculation: 1000
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

if (!get(Meteor, 'settings.public.modules.qualityMeasures.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
}

if (!get(Meteor, 'settings.public.modules.qualityMeasures.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  DynamicRoutes,
  ClinicianWorkflows,
  FooterButtons,
  ModuleConfig,
  QualityMeasuresPage
};
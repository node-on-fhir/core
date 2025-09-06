// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/index.jsx

import React from 'react';
import { 
  Assignment as QuestionnaireIcon,
  Psychology as SmartFormIcon,
  ListAlt as FormListIcon,
  DynamicForm as DynamicFormIcon,
  CheckBox as ChecklistIcon,
  LocalHospital as ClinicalIcon
} from '@mui/icons-material';

// Import pages directly (no lazy loading for packages)
import StructuredDataCapturePage from './client/pages/StructuredDataCapturePage';
import { QuestionnaireBuilderPage } from './client/pages/QuestionnaireBuilderPage';
import { QuestionnaireLibraryPage } from './client/pages/QuestionnaireLibraryPage';
import { ResponseAnalyticsPage } from './client/pages/ResponseAnalyticsPage';

// Export routes for the app to discover
export const DynamicRoutes = [
  {
    name: 'StructuredDataCapture',
    path: '/structured-data-capture',
    element: <StructuredDataCapturePage />,
    requireAuth: true
  },
  {
    name: 'QuestionnaireBuilder',
    path: '/questionnaire-builder',
    element: <QuestionnaireBuilderPage />,
    requireAuth: true
  },
  {
    name: 'QuestionnaireLibrary',
    path: '/questionnaire-library',
    element: <QuestionnaireLibraryPage />,
    requireAuth: true
  },
  {
    name: 'ResponseAnalytics',
    path: '/response-analytics',
    element: <ResponseAnalyticsPage />,
    requireAuth: true
  }
];

// Workflow items for the sidebar
export const SidebarWorkflows = [
  {
    primaryText: 'Form Builder',
    to: '/questionnaire-builder',
    iconName: 'notepad',
    requireAuth: true
  },
  {
    primaryText: 'Form Library',
    to: '/questionnaire-library',
    iconName: 'list',
    requireAuth: true
  },
  {
    primaryText: 'Response Analytics',
    to: '/response-analytics',
    iconName: 'dashboard',
    requireAuth: true
  }
];

// Clinical workflows
export const ClinicianWorkflows = [
  {
    primaryText: 'Patient Assessments',
    to: '/structured-data-capture',
    iconName: 'notepad'
  },
  {
    primaryText: 'PHQ-9 Screening',
    to: '/structured-data-capture?form=phq9',
    iconName: 'ic_hearing'
  },
  {
    primaryText: 'Intake Forms',
    to: '/structured-data-capture?form=intake',
    iconName: 'document'
  },
  {
    primaryText: 'Consent Forms',
    to: '/structured-data-capture?form=consent',
    iconName: 'notepad'
  }
];

// Footer buttons for questionnaire pages
export const FooterButtons = [
  {
    pathname: '/questionnaires',
    label: 'New Questionnaire',
    onClick: () => {
      window.location.href = '/questionnaires/new';
    }
  },
  {
    pathname: '/questionnaire-responses',
    label: 'Export Responses',
    className: 'export-responses',
    style: {
      backgroundColor: '#4CAF50',
      color: 'white'
    },
    onClick: () => {
      // Export functionality
      console.log('Exporting questionnaire responses...');
    }
  }
];

// Module configuration
export const ModuleConfig = {
  name: 'StructuredDataCapture',
  version: '0.1.0',
  fhirResources: [
    'Questionnaire',
    'QuestionnaireResponse'
  ],
  dependencies: [
    'clinical:hl7-resource-datatypes'
  ]
};

// Re-export the components and utilities
export { QuestionnaireForm } from './lib/index';
export { QuestionnaireUtils } from './lib/QuestionnaireUtils';
export { ResponseUtils } from './lib/ResponseUtils';
export { ValidationUtils } from './lib/ValidationUtils';
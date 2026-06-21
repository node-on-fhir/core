// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/index.jsx

// Import pages directly (no lazy loading for packages)
import StructuredDataCaptureLandingPage from './client/pages/StructuredDataCaptureLandingPage';
import StructuredDataCapturePage from './client/pages/StructuredDataCapturePage';
import { QuestionnaireBuilderPage } from './client/pages/QuestionnaireBuilderPage';
import { QuestionnaireLibraryPage } from './client/pages/QuestionnaireLibraryPage';
import { ResponseAnalyticsPage } from './client/pages/ResponseAnalyticsPage';

// Export routes for the app to discover
export const DynamicRoutes = [
  {
    name: 'StructuredDataCapture',
    path: '/structured-data-capture',
    component: StructuredDataCaptureLandingPage,
    requireAuth: true
  },
  {
    name: 'StructuredDataCaptureForms',
    path: '/structured-data-capture-forms',
    component: StructuredDataCapturePage,
    requireAuth: true
  },
  {
    name: 'QuestionnaireBuilder',
    path: '/questionnaire-builder',
    component: QuestionnaireBuilderPage,
    requireAuth: true
  },
  {
    name: 'QuestionnaireLibrary',
    path: '/questionnaire-library',
    component: QuestionnaireLibraryPage,
    requireAuth: true
  },
  {
    name: 'ResponseAnalytics',
    path: '/response-analytics',
    component: ResponseAnalyticsPage,
    requireAuth: true
  }
];

// Workflow items for the sidebar - commented out as these are now accessible via the main SDC page
// export const SidebarWorkflows = [
//   {
//     primaryText: 'Form Builder',
//     to: '/questionnaire-builder',
//     iconName: 'notepad',
//     requireAuth: true
//   },
//   {
//     primaryText: 'Form Library',
//     to: '/questionnaire-library',
//     iconName: 'list',
//     requireAuth: true
//   },
//   {
//     primaryText: 'Response Analytics',
//     to: '/response-analytics',
//     iconName: 'dashboard',
//     requireAuth: true
//   }
// ];
export const SidebarWorkflows = [];

// Clinical workflows - navigate to forms page with form param
export const ClinicianWorkflows = [
  {
    primaryText: 'Patient Assessments',
    to: '/structured-data-capture',
    iconName: 'notepad'
  },
  {
    primaryText: 'PHQ-9 Screening',
    to: '/structured-data-capture-forms?form=phq9',
    iconName: 'ic_hearing'
  },
  {
    primaryText: 'Intake Forms',
    to: '/structured-data-capture-forms?form=intake',
    iconName: 'document'
  },
  {
    primaryText: 'Consent Forms',
    to: '/structured-data-capture-forms?form=consent',
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
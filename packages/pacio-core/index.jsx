// /packages/pacio-core/index.jsx

import React, { Suspense } from 'react';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { CircularProgress, Box, Typography } from '@mui/material';

// Import client startup to initialize subscriptions
import './client/startup';

// Import components we'll use for patient directory buttons
import { AssignToBedModal } from './client/components/beds/AssignToBedModal';
import { 
  Bed as BedIcon,
  LocalHospital as AdmitIcon,
  ExitToApp as DischargeIcon,
  SwapHoriz as TransferIcon
} from '@mui/icons-material';

// Loading component
const Loading = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    height="100vh"
    sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50]
        : theme.palette.background.default
    }}
  >
    <CircularProgress />
  </Box>
);

// Wrap components with Suspense
const withSuspense = (Component) => {
  return (props) => (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  );
};

// Page Components - Lazy loaded
const PatientAdvanceDirectivesLazy = React.lazy(() => 
  import('./client/pages/PatientAdvanceDirectives').then(module => ({ default: module.PatientAdvanceDirectives }))
);
const PatientAdvanceDirectives = withSuspense(PatientAdvanceDirectivesLazy);

const PatientTransitionOfCareLazy = React.lazy(() => 
  import('./client/pages/PatientTransitionOfCare').then(module => ({ default: module.PatientTransitionOfCare }))
);
const PatientTransitionOfCare = withSuspense(PatientTransitionOfCareLazy);

const PatientGoalsLazy = React.lazy(() => 
  import('./client/pages/PatientGoals').then(module => ({ default: module.PatientGoals }))
);
const PatientGoals = withSuspense(PatientGoalsLazy);

const PatientMedicationListsLazy = React.lazy(() => 
  import('./client/pages/PatientMedicationLists').then(module => ({ default: module.PatientMedicationLists }))
);
const PatientMedicationLists = withSuspense(PatientMedicationListsLazy);

const PatientNutritionOrdersLazy = React.lazy(() => 
  import('./client/pages/PatientNutritionOrders').then(module => ({ default: module.PatientNutritionOrders }))
);
const PatientNutritionOrders = withSuspense(PatientNutritionOrdersLazy);

// Detail Views - Lazy loaded
const AdvanceDirectiveDetailLazy = React.lazy(() => 
  import('./client/components/advanceDirectives/AdvanceDirectiveDetail')
);
const AdvanceDirectiveDetail = withSuspense(AdvanceDirectiveDetailLazy);

const AdvanceDirectiveRevokeLazy = React.lazy(() => 
  import('./client/components/advanceDirectives/AdvanceDirectiveRevoke').then(module => ({ default: module.AdvanceDirectiveRevoke }))
);
const AdvanceDirectiveRevoke = withSuspense(AdvanceDirectiveRevokeLazy);

const TransitionOfCareDetailLazy = React.lazy(() => 
  import('./client/components/transitionOfCare/TransitionOfCareDetail')
);
const TransitionOfCareDetail = withSuspense(TransitionOfCareDetailLazy);

// Keep only the local MedicationsPage that's in the package
const MedicationsPageLazy = React.lazy(() => 
  import('./client/pages/MedicationsPage').then(module => ({ default: module.MedicationsPage }))
);
const MedicationsPage = withSuspense(MedicationsPageLazy);

// New stub pages for main workflows
const AdvanceDirectivesPageLazy = React.lazy(() => 
  import('./client/pages/AdvanceDirectivesPage')
);
const AdvanceDirectivesPage = withSuspense(AdvanceDirectivesPageLazy);

const TransitionOfCarePageLazy = React.lazy(() => 
  import('./client/pages/TransitionOfCarePage')
);
const TransitionOfCarePage = withSuspense(TransitionOfCarePageLazy);

const MedicationListsPageLazy = React.lazy(() => 
  import('./client/pages/MedicationListsPage')
);
const MedicationListsPage = withSuspense(MedicationListsPageLazy);

const CareTeamsPageLazy = React.lazy(() => 
  import('./client/pages/CareTeamsPage').then(module => ({ default: module.CareTeamsPage }))
);
const CareTeamsPage = withSuspense(CareTeamsPageLazy);

const TakeVitalSignsPageLazy = React.lazy(() => 
  import('./client/pages/TakeVitalSignsPage')
);
const TakeVitalSignsPage = withSuspense(TakeVitalSignsPageLazy);

const MainPageLazy = React.lazy(() => 
  import('./client/pages/MainPage').then(module => ({ default: module.MainPage }))
);

const MainPageComponent = withSuspense(MainPageLazy);

export const MainPage = {
  'name': 'PACIO Dashboard',
  'path': '/',
  'element': <MainPageComponent />,
  'description': 'Main PACIO facility dashboard and patient overview'
};

// Patient Fetch Page - Lazy loaded
const PatientFetchPageLazy = React.lazy(() => 
  import('./client/pages/PatientFetchPage').then(module => ({ default: module.PatientFetchPage }))
);
const PatientFetchPage = withSuspense(PatientFetchPageLazy);

// Lazy load FHIR resource pages
const TasksPageLazy = React.lazy(() => 
  import('/imports/ui-fhir/tasks/TasksPage').then(module => ({ default: module.TasksPage }))
);
const TasksPage = withSuspense(TasksPageLazy);

// Placeholder components for missing pages
const PractitionersPage = () => (
  <Box p={3}>
    <Typography variant="h4">Practitioners</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Practitioners page is under development.
    </Typography>
  </Box>
);

const ListsPage = () => (
  <Box p={3}>
    <Typography variant="h4">Lists</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Lists page is under development.
    </Typography>
  </Box>
);

const CommunicationsPage = () => (
  <Box p={3}>
    <Typography variant="h4">Communications</Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      Communications page is under development.
    </Typography>
  </Box>
);

// Dynamic Routes
export const DynamicRoutes = [
  // Main dashboard
  {
    name: 'PacioDashboard',
    path: '/pacio-dashboard',
    element: <MainPageComponent />,
    requireAuth: true,
    description: 'PACIO facility dashboard and overview'
  },
  // List routes (no patient ID)
  {
    name: 'AdvanceDirectivesList',
    path: '/advance-directives',
    element: <AdvanceDirectivesPage />,
    requireAuth: true,
    description: 'Browse and manage all advance directives'
  },
  {
    name: 'TransitionOfCareList', 
    path: '/transition-of-care',
    element: <TransitionOfCarePage />,
    requireAuth: true,
    description: 'View all transition of care documents'
  },
  {
    name: 'MedicationListsList',
    path: '/medication-lists',
    element: <MedicationListsPage />,
    requireAuth: true,
    description: 'Manage medication lists across patients'
  },
  {
    name: 'PatientFetch',
    path: '/patient-fetch',
    element: <PatientFetchPage />,
    requireAuth: true,
    description: 'Import patient data from external FHIR servers'
  },
  // Patient-specific routes
  {
    name: 'PatientAdvanceDirectives',
    path: '/patient/:id/advance-directives',
    element: <PatientAdvanceDirectives />,
    requireAuth: true,
    description: 'View and manage advance directives for a specific patient'
  },
  {
    name: 'AdvanceDirectiveDetail',
    path: '/advance-directive/:id',
    element: <AdvanceDirectiveDetail />,
    requireAuth: true,
    description: 'View details of a specific advance directive document'
  },
  {
    name: 'AdvanceDirectiveRevoke',
    path: '/advance-directive/:id/revoke',
    element: <AdvanceDirectiveRevoke />,
    requireAuth: true,
    description: 'Revoke an existing advance directive'
  },
  {
    name: 'PatientTransitionOfCare',
    path: '/patient/:id/transition-of-care',
    element: <PatientTransitionOfCare />,
    requireAuth: true,
    description: 'Manage transition of care documents for a patient'
  },
  {
    name: 'TransitionOfCareDetail',
    path: '/transition-of-care/:id',
    element: <TransitionOfCareDetail />,
    requireAuth: true,
    description: 'View details of a specific transition of care document'
  },
  {
    name: 'PatientGoals',
    path: '/patient/:id/goals',
    element: <PatientGoals />,
    requireAuth: true,
    description: 'Track and manage patient care goals'
  },
  {
    name: 'PatientMedicationLists',
    path: '/patient/:id/medication-lists',
    element: <PatientMedicationLists />,
    requireAuth: true,
    description: 'View and manage medication lists for a patient'
  },
  {
    name: 'PatientNutritionOrders',
    path: '/patient/:id/nutrition-orders',
    element: <PatientNutritionOrders />,
    requireAuth: true,
    description: 'Manage nutrition and dietary orders for a patient'
  },
  {
    name: 'PdfViewer',
    path: '/pdf/:binaryId',
    element: Meteor.PdfViewer ? <Meteor.PdfViewer /> : <div>PdfViewer not available</div>,
    requireAuth: true,
    description: 'View PDF documents with watermarking support'
  },
  {
    name: 'TakeVitalSigns',
    path: '/take-vital-signs',
    element: <TakeVitalSignsPage />,
    requireAuth: true,
    description: 'Record patient vital signs and measurements'
  }
];

// SidebarWorkflows - PACIO workflow items
export const SidebarWorkflows = [
  {
    primaryText: 'Facility Dashboard',
    to: '/pacio-dashboard',
    iconName: 'dashboard'
  },
  {
    primaryText: 'Patient Fetch',
    to: '/patient-fetch',
    iconName: 'documentIcon'
  },
  {
    primaryText: 'Advance Directives',
    to: '/advance-directives',
    iconName: 'notepad'
  },
  {
    primaryText: 'Continuity of Care',
    to: '/transition-of-care',
    iconName: 'ic_transfer_within_a_station'
  },
  {
    primaryText: 'Medication Lists',
    to: '/medication-lists',
    iconName: 'ic_local_pharmacy'
  },
  {
    primaryText: 'Take Vital Signs',
    to: '/take-vital-signs',
    iconName: 'heartbeat'
  },
  {
    primaryText: 'Structured Data Capture',
    to: '/structured-data-capture',
    iconName: 'notepad'
  }
];

// Additional FHIR Resources for sidebar (alphabetically ordered)
export const SidebarElements = [
  {
    primaryText: 'Allergy Intolerances',
    to: '/allergy-intolerances',
    iconName: 'users',
    collectionName: 'AllergyIntolerances'
  },
  {
    primaryText: 'Care Plans',
    to: '/care-plans',
    iconName: 'users',
    collectionName: 'CarePlans'
  },
  {
    primaryText: 'Care Teams',
    to: '/care-teams',
    iconName: 'users',
    collectionName: 'CareTeams'
  },
  {
    primaryText: 'Communications',
    to: '/communications',
    iconName: 'envelopeO',
    collectionName: 'Communications'
  },
  {
    primaryText: 'Compositions',
    to: '/compositions',
    iconName: 'document',
    collectionName: 'Compositions'
  },
  {
    primaryText: 'Conditions',
    to: '/conditions',
    iconName: 'hospitalO',
    collectionName: 'Conditions'
  },
  {
    primaryText: 'Document References',
    to: '/document-references',
    iconName: 'document',
    collectionName: 'DocumentReferences'
  },
  {
    primaryText: 'Goals',
    to: '/goals',
    iconName: 'heartO',
    collectionName: 'Goals'
  },
  {
    primaryText: 'Lists',
    to: '/lists',
    iconName: 'list',
    collectionName: 'Lists'
  },
  {
    primaryText: 'Locations',
    to: '/locations',
    iconName: 'location',
    collectionName: 'Locations'
  },
  {
    primaryText: 'Medication Administrations',
    to: '/medication-administrations',
    iconName: 'ic_local_pharmacy',
    collectionName: 'MedicationAdminstrations'
  },
  {
    primaryText: 'Medication Requests',
    to: '/medication-requests',
    iconName: 'ic_local_pharmacy',
    collectionName: 'MedicationRequests'
  },
  {
    primaryText: 'Medications',
    to: '/medications',
    iconName: 'ic_local_pharmacy',
    collectionName: 'Medications'
  },
  {
    primaryText: 'Nutrition Orders',
    to: '/nutrition-orders',
    iconName: 'dashboard',
    collectionName: 'NutritionOrders'
  },
  {
    primaryText: 'Observations',
    to: '/observations',
    iconName: 'thermometer3',
    collectionName: 'Observations'
  },
  {
    primaryText: 'Patients',
    to: '/patients',
    iconName: 'user',
    collectionName: 'Patients'
  },
  {
    primaryText: 'Practitioners',
    to: '/practitioners',
    iconName: 'userMd',
    collectionName: 'Practitioners'
  },
  {
    primaryText: 'Procedures',
    to: '/procedures',
    iconName: 'userMd',
    collectionName: 'Procedures'
  },
  {
    primaryText: 'Questionnaires',
    to: '/questionnaires',
    iconName: 'notepad',
    collectionName: 'Questionnaires'
  },
  {
    primaryText: 'Questionnaire Responses',
    to: '/questionnaire-responses',
    iconName: 'notepad',
    collectionName: 'QuestionnaireResponses'
  },
  {
    primaryText: 'Service Requests',
    to: '/service-requests',
    iconName: 'notepad',
    collectionName: 'ServiceRequests'
  },
  {
    primaryText: 'Tasks',
    to: '/tasks',
    iconName: 'ic_playlist_add_check',
    collectionName: 'Tasks'
  }
];

// Footer Elements
export const FooterElements = [
  {
    label: 'Sync Patient Record',
    className: 'sync-patient-record',
    style: {
      color: '#FFF',
      backgroundColor: '#2196F3',
      marginLeft: '10px'
    },
    onClick: function() {
      const patientId = Session.get('selectedPatientId');
      if (!patientId) {
        Session.set('mainAppDialogJson', {
          title: 'No Patient Selected',
          message: 'Please select a patient before syncing records.'
        });
        return;
      }
      
      Session.set('mainAppDialogJson', {
        title: 'Syncing Patient Record',
        message: 'Synchronizing patient data from FHIR server...'
      });
      
      Meteor.call('pacio.syncPatientRecord', patientId, function(error, result) {
        if (error) {
          Session.set('mainAppDialogJson', {
            title: 'Sync Failed',
            message: error.message
          });
        } else {
          Session.set('mainAppDialogJson', {
            title: 'Sync Complete',
            message: `Successfully synchronized ${result.resourcesUpdated} resources.`
          });
        }
      });
    }
  }
];

// Module Config
export const ModuleConfig = {
  name: 'PacioCoreModule',
  version: '0.1.0',
  fhirResources: [
    'DocumentReference',
    'List',
    'NutritionOrder',
    'Composition'
  ],
  settings: {
    enableWatermarking: true,
    enableAdvanceDirectives: true,
    enableTransitionOfCare: true,
    enableEnhancedGoals: true,
    pdfViewerConfig: {
      enablePrint: false,
      enableDownload: true
    }
  }
};

// Export utilities
export { AdvanceDirectiveUtils } from './lib/utilities/AdvanceDirectiveUtils';
export { PdfUtils } from './lib/utilities/PdfUtils';


// Patient Directory Buttons - Dynamic buttons for the patients table
export const PatientsDirectoryButtons = [
  {
    id: 'assign-to-bed',
    label: 'Assign to Bed',
    icon: <BedIcon />,
    color: 'primary',
    requiresModal: true,
    modalComponent: AssignToBedModal,
    onClick: function(patientId, patient) {
      console.log('Assign to bed clicked for patient:', patientId);
      // The modal will handle the actual assignment
    }
  },
  {
    id: 'admit-patient',
    label: 'Admit',
    icon: <AdmitIcon />,
    color: 'success',
    onClick: function(patientId, patient) {
      console.log('Admit patient:', patientId);
      // TODO: Implement admission workflow
    }
  },
  {
    id: 'discharge-patient',
    label: 'Discharge',
    icon: <DischargeIcon />,
    color: 'warning',
    onClick: function(patientId, patient) {
      console.log('Discharge patient:', patientId);
      // TODO: Implement discharge workflow
    }
  },
  {
    id: 'transfer-patient',
    label: 'Transfer',
    icon: <TransferIcon />,
    color: 'info',
    onClick: function(patientId, patient) {
      console.log('Transfer patient:', patientId);
      // TODO: Implement transfer workflow
    }
  }
];

// Note: All exports are defined above using export const
// No additional export block needed

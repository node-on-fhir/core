// packages/admin-tools/index.jsx

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Client Components
import AdminToolsPage from './client/AdminToolsPage';
import SessionsPage from './client/SessionsPage';
import DatabaseAdminPage from './client/DatabaseAdminPage';
import DeletePatientPage from './client/DeletePatientPage';
import ArchivePatientPage from './client/ArchivePatientPage';
import RenamePatientPage from './client/RenamePatientPage';
import AnonymizePatientPage from './client/AnonymizePatientPage';

// Icons for PatientsDirectoryButtons
import ArchiveIcon from '@mui/icons-material/Archive';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import SecurityIcon from '@mui/icons-material/Security';

// Collections
import { AdminToolsCollections } from './lib/collections';

// Admin Methods Scanner
import {
  scanCollectionAdminMethods,
  getCollectionAdminMethods,
  getCollectionsWithAdminMethods,
  mergeWithCollectionStats
} from './lib/AdminMethodsScanner';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

let DynamicRoutes = [{
  name: 'AdminTools',
  path: '/admin-tools',
  element: <AdminToolsPage />,
  requireAuth: true,
  description: 'Admin tools dashboard'
}, {
  name: 'Sessions',
  path: '/sessions',
  element: <SessionsPage />,
  requireAuth: true,
  description: 'View and manage Meteor sessions'
}, {
  name: 'DatabaseAdmin',
  path: '/database-admin',
  element: <DatabaseAdminPage />,
  requireAuth: true,
  description: 'Database administration and collection browser'
}, {
  name: 'DeletePatient',
  path: '/delete-patient',
  element: <DeletePatientPage />,
  requireAuth: true,
  description: 'Cascade delete a patient and all linked FHIR resources'
}, {
  name: 'ArchivePatient',
  path: '/archive',
  element: <ArchivePatientPage />,
  requireAuth: true,
  description: 'Archive and remove a patient and all linked FHIR resources'
}, {
  name: 'ArchivePatientAlias',
  path: '/archive-patient',
  element: <ArchivePatientPage />,
  requireAuth: true,
  description: 'Archive and remove a patient and all linked FHIR resources'
}, {
  name: 'RenamePatient',
  path: '/rename-patient',
  element: <RenamePatientPage />,
  requireAuth: true,
  description: 'Rename a patient and update all linked FHIR resource display names'
}, {
  name: 'AnonymizePatient',
  path: '/anonymize-patient',
  element: <AnonymizePatientPage />,
  requireAuth: true,
  description: 'HIPAA Safe Harbor de-identification of a patient and all linked resources'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

let SidebarWorkflows = [{
  primaryText: "Admin Tools",
  to: '/admin-tools',
  iconName: 'adminPanelSettings',
  requireAuth: true
}, {
  primaryText: "Sessions",
  to: '/sessions',
  iconName: 'people',
  requireAuth: true
}, {
  primaryText: "Database Admin",
  to: '/database-admin',
  iconName: 'storage',
  requireAuth: true
}, {
  primaryText: "Delete Patient",
  to: '/delete-patient',
  iconName: 'personRemove',
  requireAuth: true
}, {
  primaryText: "Archive Patient",
  to: '/archive',
  iconName: 'archive',
  requireAuth: true
}, {
  primaryText: "Rename Patient",
  to: '/rename-patient',
  iconName: 'driveFileRenameOutline',
  requireAuth: true
}, {
  primaryText: "Anonymize Patient",
  to: '/anonymize-patient',
  iconName: 'security',
  requireAuth: true
}];

// =============================================================================
// ADMIN SIDEBAR ELEMENTS
// =============================================================================

let AdminSidebarElements = [{
  primaryText: "Admin Tools",
  to: '/admin-tools',
  iconName: 'adminPanelSettings',
  requireAuth: true
}, {
  primaryText: "Sessions",
  to: '/sessions',
  iconName: 'people',
  requireAuth: true
}, {
  primaryText: "Database Admin",
  to: '/database-admin',
  iconName: 'storage',
  requireAuth: true
}, {
  primaryText: "Delete Patient",
  to: '/delete-patient',
  iconName: 'personRemove',
  requireAuth: true
}, {
  primaryText: "Archive Patient",
  to: '/archive',
  iconName: 'archive',
  requireAuth: true
}, {
  primaryText: "Rename Patient",
  to: '/rename-patient',
  iconName: 'driveFileRenameOutline',
  requireAuth: true
}, {
  primaryText: "Anonymize Patient",
  to: '/anonymize-patient',
  iconName: 'security',
  requireAuth: true
}];

// =============================================================================
// PATIENTS DIRECTORY BUTTONS
// =============================================================================
// These buttons appear in the patient directory accordion row.
// Auto-discovered by PatientsTable.jsx via Package['clinical:admin-tools'].PatientsDirectoryButtons

let PatientsDirectoryButtons = [{
  id: 'archive-patient',
  label: 'ARCHIVE',
  icon: <ArchiveIcon />,
  color: 'warning',
  onClick: function(patientId, patient, navigate) {
    navigate('/archive-patient?patientId=' + patientId);
  }
}, {
  id: 'rename-patient',
  label: 'RENAME',
  icon: <DriveFileRenameOutlineIcon />,
  color: 'info',
  onClick: function(patientId, patient, navigate) {
    navigate('/rename-patient?patientId=' + patientId);
  }
}, {
  id: 'anonymize-patient',
  label: 'ANONYMIZE',
  icon: <SecurityIcon />,
  color: 'warning',
  onClick: function(patientId, patient, navigate) {
    navigate('/anonymize-patient?patientId=' + patientId);
  }
}];

// =============================================================================
// COLLECTION ADMIN METHODS
// =============================================================================
// This export allows the package scanner to discover admin methods.
// Other packages can export their own CollectionAdminMethods in the same format.
//
// Example usage in another package:
//
// let CollectionAdminMethods = [{
//   collection: 'Patients',
//   methods: [{
//     name: 'initialize',
//     label: 'Initialize',
//     description: 'Seed with sample data',
//     methodName: 'patients.initialize',
//     confirmRequired: true,
//     dangerous: false
//   }]
// }];
//
// export { CollectionAdminMethods };

let CollectionAdminMethods = [
  // Example: Core collections that admin-tools can initialize/drop
  // Individual packages should export their own methods for their collections
];

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

if (!get(Meteor, 'settings.public.modules.adminTools.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
  AdminSidebarElements = [];
  PatientsDirectoryButtons = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Routes (Required for framework auto-discovery)
  DynamicRoutes,
  SidebarWorkflows,
  AdminSidebarElements,

  // Components
  AdminToolsPage,
  SessionsPage,
  DatabaseAdminPage,
  DeletePatientPage,
  ArchivePatientPage,
  RenamePatientPage,
  AnonymizePatientPage,

  // Patient Directory Buttons
  PatientsDirectoryButtons,

  // Collections
  AdminToolsCollections,

  // Admin Methods (for framework auto-discovery)
  CollectionAdminMethods,

  // Admin Methods Scanner Utilities
  // Other packages can import these to build custom admin UIs
  scanCollectionAdminMethods,
  getCollectionAdminMethods,
  getCollectionsWithAdminMethods,
  mergeWithCollectionStats
};

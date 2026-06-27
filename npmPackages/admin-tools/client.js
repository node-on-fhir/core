// npmPackages/admin-tools/client.js
//
// Client entry — admin tools: sessions, database admin, and patient lifecycle
// operations (delete / archive / rename / anonymize). Migrated from
// packages/admin-tools (Atmosphere) 2026-06-13. The Atmosphere client mainModule
// was index.jsx; this consolidates into a self-contained entry that builds
// routes/sidebar from workflow.json and preserves every named export. The
// destructive operations are settings-gated server-side (see server/methods.js,
// the reference implementation for the settings-gated-feature pattern).

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AdminToolsPage from './client/AdminToolsPage';
import SessionsPage from './client/SessionsPage';
import DatabaseAdminPage from './client/DatabaseAdminPage';
import DeletePatientPage from './client/DeletePatientPage';
import ArchivePatientPage from './client/ArchivePatientPage';
import RenamePatientPage from './client/RenamePatientPage';
import AnonymizePatientPage from './client/AnonymizePatientPage';
import { AdminToolsCollections } from './lib/collections';
import {
  scanCollectionAdminMethods,
  getCollectionAdminMethods,
  getCollectionsWithAdminMethods,
  mergeWithCollectionStats
} from './lib/AdminMethodsScanner';
import workflowConfig from './workflow.json';

const COMPONENTS = {
  AdminToolsPage,
  SessionsPage,
  DatabaseAdminPage,
  DeletePatientPage,
  ArchivePatientPage,
  RenamePatientPage,
  AnonymizePatientPage
};

let DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[admin-tools] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: Comp ? <Comp /> : null, requireAuth: route.requireAuth || false, description: route.description };
});

let SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// AdminSidebarElements mirrors SidebarWorkflows in the Atmosphere package.
let AdminSidebarElements = SidebarWorkflows.slice();

// Patient-directory accordion button (auto-discovered by PatientsTable.jsx).
let PatientsDirectoryButtons = [{
  id: 'admin-tools',
  label: 'ADMIN',
  icon: <AdminPanelSettingsIcon />,
  color: 'error',
  onClick: function(patientId, patient, navigate) {
    navigate('/admin-tools?patient=' + patientId);
  }
}];

// Placeholder for the admin-methods scanner (packages export their own).
let CollectionAdminMethods = [];

// Settings gate (preserved from index.jsx): hide everything when disabled.
if (!get(Meteor, 'settings.public.modules.adminTools.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
  AdminSidebarElements = [];
  PatientsDirectoryButtons = [];
}

export {
  DynamicRoutes,
  SidebarWorkflows,
  AdminSidebarElements,
  AdminToolsPage,
  SessionsPage,
  DatabaseAdminPage,
  DeletePatientPage,
  ArchivePatientPage,
  RenamePatientPage,
  AnonymizePatientPage,
  PatientsDirectoryButtons,
  AdminToolsCollections,
  CollectionAdminMethods,
  scanCollectionAdminMethods,
  getCollectionAdminMethods,
  getCollectionsWithAdminMethods,
  mergeWithCollectionStats
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  patientsDirectoryButtons: PatientsDirectoryButtons
};

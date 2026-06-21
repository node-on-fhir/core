// npmPackages/data-importer/client.js
//
// Client entry — data importer (CSV/XLSX/XML/Apple-Health-zip import, collection
// management, data editor). Migrated from packages/data-importer (Atmosphere
// clinical:data-importer) 2026-06-14. The Atmosphere client mainModule was
// index.jsx; this consolidates into a self-contained entry that builds the
// routes/sidebar from workflow.json and preserves the export surface.

import React from 'react';
import DataImportPage from './client/DataImportPage';
import EditorPage from './client/EditorPage';
import { ImportButtons } from './client/DataFooterButtons';
import CollectionManagement from './client/CollectionManagement';
import MedicalRecordImporter from './lib/MedicalRecordImporter.js';
import ImportAlgorithm from './lib/ImportAlgorithm';
import workflowConfig from './workflow.json';

const COMPONENTS = { DataImportPage, EditorPage };

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[data-importer] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: Comp ? <Comp /> : null, requireAuth: route.requireAuth || false };
});

// data-importer is an admin tool — AdminDynamicRoutes mirrors DynamicRoutes.
const AdminDynamicRoutes = DynamicRoutes;

const AdminSidebarElements = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, excludeDevice: item.excludeDevice, requireAuth: item.requireAuth || false };
});

const FooterButtons = [{
  pathname: '/import-data',
  element: <ImportButtons />
}];

export {
  DynamicRoutes,
  AdminDynamicRoutes,
  AdminSidebarElements,
  FooterButtons,
  DataImportPage,
  MedicalRecordImporter,
  CollectionManagement,
  ImportAlgorithm
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: AdminSidebarElements,
  footerButtons: FooterButtons
};

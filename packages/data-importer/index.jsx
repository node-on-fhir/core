import React from 'react';

import CollectionManagement from './client/CollectionManagement';
import ImportAlgorithm from './lib/ImportAlgorithm';
import ImportPage from './client/ImportPage';
import EditorPage from './client/EditorPage';

import MedicalRecordImporter from './lib/MedicalRecordImporter.js';

import { ImportButtons } from './client/DataFooterButtons';

let DynamicRoutes = [{
  'name': 'Import',
  'path': '/import-data',
  'element': <ImportPage />
}, {
  'name': 'EditorRoute',
  'path': '/data-editor',
  'element': <EditorPage />,
  'requireAuth': true
}];

let AdminSidebarElements = [{
  primaryText: "Data Import",
  to: '/import-data',
  iconName: "fire",
  excludeDevice: ['iPhone', 'iPad'],
  requireAuth: true
}, {
  primaryText: 'Data Editor',
  to: '/data-editor',
  iconName: 'fire'
}];


let FooterButtons = [{
  pathname: '/import-data',
  element: <ImportButtons />
}];


let AdminDynamicRoutes = DynamicRoutes;

export { 
  DynamicRoutes, 
  AdminDynamicRoutes,
  AdminSidebarElements,
  FooterButtons,

  ImportPage,

  MedicalRecordImporter,

  CollectionManagement,
  ImportAlgorithm
};


// packages/admin-tools/index.jsx

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Client Components
import SessionsPage from './client/SessionsPage';
import DatabaseAdminPage from './client/DatabaseAdminPage';

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
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

let SidebarWorkflows = [{
  primaryText: "Sessions",
  to: '/sessions',
  iconName: 'people',
  requireAuth: true
}, {
  primaryText: "Database Admin",
  to: '/database-admin',
  iconName: 'storage',
  requireAuth: true
}];

// =============================================================================
// ADMIN SIDEBAR ELEMENTS
// =============================================================================

let AdminSidebarElements = [{
  primaryText: "Sessions",
  to: '/sessions',
  iconName: 'people',
  requireAuth: true
}, {
  primaryText: "Database Admin",
  to: '/database-admin',
  iconName: 'storage',
  requireAuth: true
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
  SessionsPage,
  DatabaseAdminPage,

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

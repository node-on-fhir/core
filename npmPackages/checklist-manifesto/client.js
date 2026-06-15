// npmPackages/checklist-manifesto/client.js
//
// Client entry — checklist / protocol management (surgical-safety-checklist
// style). Migrated from packages/checklist-manifesto (Atmosphere
// clinical:checklist-manifesto) 2026-06-13. The Atmosphere client mainModule was
// client/index.js (collections + re-export of index.jsx); this consolidates into
// a self-contained entry with the default export the WorkflowRegistry needs.

import React from 'react';

// Client-side collection registration (side-effect imports)
import './lib/collections/ChecklistTasks.js';
import './lib/collections/ChecklistLists.js';

import { ChecklistManifestoPage } from './ui/pages/ChecklistManifestoPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'ChecklistManifestoPage') {
    element = <ChecklistManifestoPage />;
  } else {
    console.warn('[checklist-manifesto] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

export { ChecklistTasks } from './lib/collections/ChecklistTasks.js';
export { ChecklistLists } from './lib/collections/ChecklistLists.js';
export { ChecklistManifestoPage, DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

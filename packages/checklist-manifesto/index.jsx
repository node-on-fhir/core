// /packages/checklist-manifesto/index.jsx

import React from 'react';

// Import the main page component
import { ChecklistManifestoPage } from './ui/pages/ChecklistManifestoPage';

// Export collections
export { ChecklistTasks } from './lib/collections/ChecklistTasks';
export { ChecklistLists } from './lib/collections/ChecklistLists';

// Export the main page component
export { ChecklistManifestoPage };

// Export sidebar workflows for Honeycomb integration
export const SidebarWorkflows = [{
  id: 'checklistManifestoWorkflow',
  name: 'Checklist Manifesto',
  primaryText: 'Checklists',
  iconName: 'checklist',
  to: '/checklists',
  requireAuth: true
}];

// Export dynamic routes for automatic registration
export const DynamicRoutes = [{
  name: 'ChecklistManifesto',
  path: '/checklists',
  element: <ChecklistManifestoPage />,
  requireAuth: true
}];
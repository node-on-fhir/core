// npmPackages/workqueues/client.js
//
// Client entry — work queues / task management. Migrated from
// packages/workqueues (Atmosphere clinical:workqueues) 2026-06-13. The Atmosphere
// client mainModule was client/index.js (a re-export hub); this consolidates into
// a self-contained entry with the WorkflowRegistry default export.

import React from 'react';
import { WorkQueuesPage } from './ui/pages/WorkQueuesPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'WorkQueuesPage') {
    element = <WorkQueuesPage />;
  } else {
    console.warn('[workqueues] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Library surface preserved (collections, components, pages, hooks)
export { WorkQueues, WorkQueueItems } from './lib/collections.js';
export { WorkQueueList } from './ui/components/WorkQueueList.jsx';
export { WorkItemCard } from './ui/components/WorkItemCard.jsx';
export { WorkItemDetail } from './ui/components/WorkItemDetail.jsx';
export { WorkQueueFilters } from './ui/components/WorkQueueFilters.jsx';
export { QuickAddTask } from './ui/components/QuickAddTask.jsx';
export { WorkQueuesPage } from './ui/pages/WorkQueuesPage.jsx';
export { WorkQueuesSimplePage } from './ui/pages/WorkQueuesSimplePage.jsx';
export { useWorkQueue } from './client/hooks/useWorkQueue.js';
export { useWorkQueueItem } from './client/hooks/useWorkQueueItem.js';

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

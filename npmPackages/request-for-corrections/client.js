// npmPackages/request-for-corrections/client.js
//
// Client entry — patient request-for-corrections / amendments (ONC §170.315(d)(4)).
// Migrated from packages/request-for-corrections (Atmosphere) 2026-06-13. The
// Atmosphere client mainModule was index.jsx; this consolidates into a
// self-contained entry that builds routes/sidebar from workflow.json and
// preserves the named exports (pages, components, collections, workflow).

import React from 'react';
import CorrectionRequestsPage from './client/pages/CorrectionRequestsPage';
import CorrectionRequestDetailPage from './client/pages/CorrectionRequestDetailPage';
import NewCorrectionRequestPage from './client/pages/NewCorrectionRequestPage';
import CorrectionRequestApproval from './client/pages/CorrectionRequestApproval';
import CorrectionRequestRouter from './client/pages/CorrectionRequestRouter';
import CorrectionRequestsList from './client/components/CorrectionRequestsList';
import CorrectionRequestForm from './client/components/CorrectionRequestForm';
import CorrectionTaskStatus from './client/components/CorrectionTaskStatus';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'CorrectionRequestsPage') {
    element = <CorrectionRequestsPage />;
  } else if (route.component === 'NewCorrectionRequestPage') {
    element = <NewCorrectionRequestPage />;
  } else if (route.component === 'CorrectionRequestRouter') {
    element = <CorrectionRequestRouter />;
  } else {
    console.warn('[request-for-corrections] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false, description: route.description };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Library surface preserved (pages, components, collections, workflow)
export {
  CorrectionRequestsList,
  CorrectionRequestForm,
  CorrectionTaskStatus,
  CorrectionRequestsPage,
  CorrectionRequestDetailPage,
  NewCorrectionRequestPage,
  CorrectionRequestApproval,
  CorrectionRequestRouter
};
export { CorrectionRequests } from './lib/collections/CorrectionRequests';
export { CorrectionTasks } from './lib/collections/CorrectionTasks';
export { CorrectionCommunications } from './lib/collections/CorrectionCommunications';
export { CorrectionWorkflow } from './lib/CorrectionWorkflow';

export { DynamicRoutes, SidebarWorkflows };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};

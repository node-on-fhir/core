// packages/request-for-corrections/index.jsx

import React from 'react';

// Import pages
import CorrectionRequestsPage from './client/pages/CorrectionRequestsPage';
import CorrectionRequestDetailPage from './client/pages/CorrectionRequestDetailPage';
import NewCorrectionRequestPage from './client/pages/NewCorrectionRequestPage';
import CorrectionRequestApproval from './client/pages/CorrectionRequestApproval';
import CorrectionRequestRouter from './client/pages/CorrectionRequestRouter';

// Import components for external use
import CorrectionRequestsList from './client/components/CorrectionRequestsList';
import CorrectionRequestForm from './client/components/CorrectionRequestForm';
import CorrectionTaskStatus from './client/components/CorrectionTaskStatus';

// Define routes for the application
let DynamicRoutes = [
  {
    path: '/correction-requests',
    element: <CorrectionRequestsPage />,
    label: 'Correction Requests',
    icon: 'Edit'
  },
  {
    path: '/correction-requests/new',
    element: <NewCorrectionRequestPage />,
    label: 'New Correction Request',
    icon: 'Add'
  },
  {
    path: '/correction-requests/:id',
    element: <CorrectionRequestRouter />,
    label: 'Correction Request Detail',
    hide: true
  }
];

// Define sidebar workflows
let SidebarWorkflows = [
  {
    primaryText: 'Request Corrections',
    to: '/correction-requests',
    iconName: 'edit',
    requireAuth: true
  }
];

// Export routes and workflows
export { DynamicRoutes, SidebarWorkflows };

// Import collections for export
import { CorrectionRequests as _CorrectionRequests } from './lib/collections/CorrectionRequests';
import { CorrectionTasks as _CorrectionTasks } from './lib/collections/CorrectionTasks';
import { CorrectionCommunications as _CorrectionCommunications } from './lib/collections/CorrectionCommunications';
import { CorrectionWorkflow as _CorrectionWorkflow } from './lib/CorrectionWorkflow';

// Create mutable references
let CorrectionRequests = _CorrectionRequests;
let CorrectionTasks = _CorrectionTasks;
let CorrectionCommunications = _CorrectionCommunications;
let CorrectionWorkflow = _CorrectionWorkflow;

// Export components for use in other packages
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

// Export collections and workflow
export {
  CorrectionRequests,
  CorrectionTasks,
  CorrectionCommunications,
  CorrectionWorkflow
};

// For Meteor package exports (api.export)
// Debug logging
console.log('Request for Corrections package - index.jsx loading');
console.log('DynamicRoutes:', DynamicRoutes);
console.log('SidebarWorkflows:', SidebarWorkflows);

// Attach to global scope for Meteor package exports
DynamicRoutes = DynamicRoutes;
SidebarWorkflows = SidebarWorkflows;
CorrectionRequests = CorrectionRequests;
CorrectionTasks = CorrectionTasks;
CorrectionCommunications = CorrectionCommunications;
CorrectionWorkflow = CorrectionWorkflow;
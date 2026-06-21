// /packages/workqueues/index.jsx

import React from 'react';

import { 
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';

import { 
  Assignment as AssignmentIcon,
  CheckBox as CheckBoxIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';

// Main package exports
export { WorkQueues, WorkQueueItems } from './lib/collections';
export { WorkQueuesPage } from './ui/pages/WorkQueuesPage.jsx';
export { WorkQueuesSimplePage } from './ui/pages/WorkQueuesSimplePage.jsx';
export { WorkQueueList } from './ui/components/WorkQueueList.jsx';
export { WorkItemCard } from './ui/components/WorkItemCard.jsx';
export { WorkItemDetail } from './ui/components/WorkItemDetail.jsx';
export { WorkQueueFilters } from './ui/components/WorkQueueFilters.jsx';
export { QuickAddTask } from './ui/components/QuickAddTask.jsx';
export { useWorkQueue } from './client/hooks/useWorkQueue.js';
export { useWorkQueueItem } from './client/hooks/useWorkQueueItem.js';

// Sidebar workflow configuration
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useNavigate } from "react-router-dom";

// SidebarWorkflows export for the main app (note: plural!)
export const SidebarWorkflows = [{
  id: 'workQueuesWorkflow',
  name: 'Work Queues',
  primaryText: 'Work Queues',  // This is what PatientSidebar expects
  iconName: 'list',
  iconText: 'WQ',
  to: '/workqueues',
  pathname: '/workqueues',
  requireAuth: true
}];

// Import the page component for the route
import { WorkQueuesSimplePage } from './ui/pages/WorkQueuesSimplePage.jsx';

// DynamicRoutes export for automatic route registration
export const DynamicRoutes = [{
  name: 'WorkQueues',
  path: '/workqueues',
  element: <WorkQueuesSimplePage />,
  requireAuth: true
}];

// Log to verify the export is working
if (Meteor.isClient) {
  console.log('WorkQueues package: SidebarWorkflows exported', SidebarWorkflows);
  console.log('WorkQueues package: DynamicRoutes exported', DynamicRoutes);
}

// Alternative MenuItem export (some apps may use this pattern)
export const WorkQueuesMenuItem = function(props) {
  const navigate = useNavigate();
  
  function handleClick() {
    Session.set('selectedPatient', null);
    navigate('/workqueues');
  }

  return (
    <ListItem 
      id="workQueuesMenuItem" 
      button 
      onClick={handleClick}
    >
      <ListItemIcon>
        <AssignmentIcon />
      </ListItemIcon>
      <ListItemText primary="Work Queues" />
    </ListItem>
  );
};
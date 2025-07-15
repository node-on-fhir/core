// packages/hipaa-compliance/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Import components
import AuditLogPage from './client/AuditLogPage';
import PolicyMenuPage from './client/PolicyMenuPage';
import PolicyPage from './client/PolicyPage';

// Dynamic route injection for Honeycomb
let DynamicRoutes = [{
  name: 'HipaaAuditLog',
  path: '/hipaa/audit-log',
  element: <AuditLogPage />,
  requireAuth: true
}, {
  name: 'HipaaPolicyMenu',
  path: '/hipaa/policies',
  element: <PolicyMenuPage />,
  requireAuth: false
}, {
  name: 'HipaaPolicy',
  path: '/hipaa/policies/:policyId',
  element: <PolicyPage />,
  requireAuth: false
}];

// Admin routes
let AdminDynamicRoutes = [];

// Sidebar elements for navigation
let SidebarElements = [{
  primaryText: "Audit Log",
  to: '/hipaa/audit-log',
  iconName: "shield",
  requireAuth: true,
  collectionName: 'HipaaAuditLog'
}, {
  primaryText: "HIPAA Policies",
  to: '/hipaa/policies',
  iconName: "description",
  requireAuth: false
}];

// Sidebar workflows
let SidebarWorkflows = [{
  primaryText: "HIPAA Compliance",
  to: '/hipaa/audit-log',
  iconName: "security"
}, {
  primaryText: "Compliance Policies",
  to: '/hipaa/policies',
  iconName: "policy"
}];

// Footer buttons for context-sensitive actions
let FooterButtons = [{
  pathname: '/hipaa/audit-log',
  element: (
    <Button 
      id="exportAuditLogButton"
      color="primary"
      variant="contained"
      startIcon={<SecurityIcon />}
      onClick={() => {
        // Export functionality will be handled by the AuditLogPage component
        console.log('Export audit log triggered from footer');
      }}
    >
      Export Audit Log
    </Button>
  )
}];

// Export for Honeycomb integration
export { 
  DynamicRoutes, 
  AdminDynamicRoutes,
  SidebarElements, 
  SidebarWorkflows,
  FooterButtons 
};

// Import HipaaLogger wrapper that accesses the global logger
import { HipaaLogger } from './lib/HipaaLoggerAccess';

// Also export local modules for direct use by other packages
export { HipaaLogger };
export { HipaaAuditLog } from './lib/Collections';
export { EventTypes, SecurityLevels, UserRoles } from './lib/Constants';
export { SecurityValidators } from './lib/SecurityValidators';

// Export a configuration helper for other packages
export const HipaaAuditConfig = {
  // Check if audit logging is enabled
  isEnabled: function() {
    return Meteor.settings?.public?.hipaa?.features?.auditLogging !== false;
  },
  
  // Get current environment
  getEnvironment: function() {
    return Meteor.settings?.public?.hipaa?.compliance?.environment || 'production';
  },
  
  // Check if automatic hooks are enabled
  areHooksEnabled: function() {
    return Meteor.settings?.public?.hipaa?.features?.automaticHooks !== false;
  }
};
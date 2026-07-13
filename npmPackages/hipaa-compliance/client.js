// npmPackages/hipaa-compliance/client.js
//
// Client entry — HIPAA audit logging + compliance policy management
// (ONC §170.315(d)(2),(d)(3),(d)(10)). Migrated from packages/hipaa-compliance
// (Atmosphere clinical:hipaa-compliance) 2026-06-13. The Atmosphere client
// mainModule was index.jsx; this consolidates into a self-contained entry that
// builds routes/sidebar from workflow.json and preserves every named export.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import AuditLogPage from './client/AuditLogPage.jsx';
import PolicyMenuPage from './client/PolicyMenuPage.jsx';
import PolicyPage from './client/PolicyPage.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'AuditLogPage') {
    element = <AuditLogPage />;
  } else if (route.component === 'PolicyMenuPage') {
    element = <PolicyMenuPage />;
  } else if (route.component === 'PolicyPage') {
    element = <PolicyPage />;
  } else {
    console.warn('[hipaa-compliance] Unknown component in workflow.json: ' + route.component);
  }
  return {
    name: route.name,
    path: route.path,
    element: element,
    requireAuth: route.requireAuth || false,
    description: route.description
  };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// No admin routes in this package
const AdminDynamicRoutes = [];

// Per-collection sidebar flavor preserved as a named export (host may consume it
// distinctly from the workflow nav above).
const SidebarElements = [{
  primaryText: 'Audit Log', to: '/hipaa/audit-log', iconName: 'Shield', requireAuth: true, collectionName: 'AuditEvents'
}, {
  primaryText: 'HIPAA Policies', to: '/hipaa/policies', iconName: 'Description', requireAuth: false
}];

// Context-sensitive footer button (audit-log export) — inline element preserved.
const FooterButtons = [{
  pathname: '/hipaa/audit-log',
  element: (
    <Button
      id="exportAuditLogButton"
      color="primary"
      variant="contained"
      startIcon={<SecurityIcon />}
      onClick={function() { console.log('Export audit log triggered from footer'); }}
    >
      Export Audit Log
    </Button>
  )
}];

// Library surface (HipaaAuditLog is gone — FHIR AuditEvents is the only
// audit store; HipaaLogger is the real logger, no more global indirection)
export { HipaaLogger } from './lib/HipaaLogger';
export { EventTypes, SecurityLevels, UserRoles } from './lib/Constants';
export { SecurityValidators } from './lib/SecurityValidators';
export { flattenAuditEvent, buildAuditQuery } from './lib/AuditEventMapping';

export const HipaaAuditConfig = {
  isEnabled: function() {
    return Meteor.settings?.public?.hipaa?.features?.auditLogging !== false;
  },
  getEnvironment: function() {
    return Meteor.settings?.public?.hipaa?.compliance?.environment || 'production';
  },
  areHooksEnabled: function() {
    return Meteor.settings?.public?.hipaa?.features?.automaticHooks !== false;
  }
};

export { DynamicRoutes, AdminDynamicRoutes, SidebarElements, SidebarWorkflows, FooterButtons };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

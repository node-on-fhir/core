// npmPackages/secure-messaging/client.js
//
// Client entry — ONC 170.315(e)(2) + (h)(1) secure messaging / Direct Project.
// Migrated from packages/secure-messaging (Atmosphere clinical:secure-messaging)
// 2026-06-13. Settings-gated (secureMessaging.enabled / .showInWorkflows).

import React from 'react';
import { Button } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import SecureMessagingPage from './client/SecureMessagingPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.modules.secureMessaging.enabled', true);
const showInWorkflows = get(Meteor, 'settings.public.modules.secureMessaging.showInWorkflows', true);

// Component keys encode the defaultTab prop variants.
const COMPONENTS = {
  SecureMessagingPage: <SecureMessagingPage />,
  SecureMessagingPage_Direct: <SecureMessagingPage defaultTab="direct" />,
  SecureMessagingPage_Patient: <SecureMessagingPage defaultTab="patient" />
};

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  const element = COMPONENTS[route.component] || null;
  if (!element) {
    console.warn('[secure-messaging] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

// Atmosphere PatientWorkflows + ClinicianWorkflows → sidebarItems.
const SidebarWorkflows = (isEnabled && showInWorkflows) ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

const FooterButtons = isEnabled ? [{
  pathname: '/secure-messaging',
  element: (
    <Button id="composeMessageButton" color="primary" variant="contained"
      onClick={function() { console.log('Compose message clicked'); }}>
      Compose Message
    </Button>
  )
}] : [];

const ModuleConfig = {
  name: 'SecureMessaging',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(e)(2) - Secure Messaging', '170.315(h)(1) - Direct Project'],
  fhirResources: ['Communication', 'CommunicationRequest', 'DocumentReference', 'Binary', 'AuditEvent']
};

export { DynamicRoutes, SidebarWorkflows, FooterButtons, ModuleConfig, SecureMessagingPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};

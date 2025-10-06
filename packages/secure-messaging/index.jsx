// packages/secure-messaging/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import SecureMessagingPage from './client/SecureMessagingPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes for Secure Messaging and Direct Project
let DynamicRoutes = [{
  name: 'SecureMessaging',
  path: '/secure-messaging',
  element: <SecureMessagingPage />,
  requireAuth: true,
  description: 'Secure Messaging Hub - ONC §170.315(e)(2) and §170.315(h)(1)'
}, {
  name: 'DirectMessages',
  path: '/secure-messaging/direct',
  element: <SecureMessagingPage defaultTab="direct" />,
  requireAuth: true,
  description: 'Direct Project Messages - ONC §170.315(h)(1)'
}, {
  name: 'PatientMessages',
  path: '/secure-messaging/patient',
  element: <SecureMessagingPage defaultTab="patient" />,
  requireAuth: true,
  description: 'Patient Portal Messages - ONC §170.315(e)(2)'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Patient workflows
let PatientWorkflows = [{
  primaryText: "Message Provider",
  to: '/secure-messaging/patient',
  iconName: 'message',
  requireAuth: true
}];

// Clinician workflows  
let ClinicianWorkflows = [{
  primaryText: "Secure Messaging",
  to: '/secure-messaging',
  iconName: 'mail',
  requireAuth: true
}, {
  primaryText: "Direct Messages",
  to: '/secure-messaging/direct',
  iconName: 'security',
  requireAuth: true
}, {
  primaryText: "Patient Messages",
  to: '/secure-messaging/patient',
  iconName: 'chat',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

let FooterButtons = [{
  pathname: '/secure-messaging',
  element: (
    <Button
      id="composeMessageButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('Compose message clicked');
      }}
    >
      Compose Message
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'SecureMessaging',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(e)(2) - Secure Messaging',
    '170.315(h)(1) - Direct Project'
  ],
  fhirResources: [
    'Communication',
    'CommunicationRequest',
    'DocumentReference',
    'Binary',
    'AuditEvent'
  ],
  settings: {
    enableDirectMessaging: true,
    enablePatientMessaging: true,
    requireEncryption: true,
    enableReadReceipts: true,
    enableMDN: true, // Message Disposition Notifications
    maxAttachmentSize: 25, // MB
    retentionPeriod: 730 // days
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.secureMessaging.enabled', true)) {
  DynamicRoutes = [];
  PatientWorkflows = [];
  ClinicianWorkflows = [];
}

// Check workflow visibility
if (!get(Meteor, 'settings.public.modules.secureMessaging.showInWorkflows', true)) {
  PatientWorkflows = [];
  ClinicianWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  // Routes
  DynamicRoutes,
  
  // Sidebar items
  PatientWorkflows,
  ClinicianWorkflows,
  
  // Footer
  FooterButtons,
  
  // Configuration
  ModuleConfig,
  
  // Main component for reuse
  SecureMessagingPage
};
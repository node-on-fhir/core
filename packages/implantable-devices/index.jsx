// packages/implantable-devices/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import ImplantableDevicesPage from './client/ImplantableDevicesPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes for Implantable Device Registry
let DynamicRoutes = [{
  name: 'ImplantableDevices',
  path: '/implantable-devices',
  element: <ImplantableDevicesPage />,
  requireAuth: true,
  description: 'Implantable Device Registry - ONC §170.315(g)(7)'
}, {
  name: 'ImplantableDeviceDetail',
  path: '/implantable-devices/:id',
  element: <ImplantableDevicesPage viewMode="detail" />,
  requireAuth: true,
  description: 'Implantable Device Detail View'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Clinician workflows
let ClinicianWorkflows = [{
  primaryText: "Implantable Devices",
  to: '/implantable-devices',
  iconName: 'memory',
  requireAuth: true
}];

// Patient workflows
let PatientWorkflows = [{
  primaryText: "My Implants",
  to: '/implantable-devices',
  iconName: 'settings',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

let FooterButtons = [{
  pathname: '/implantable-devices',
  element: (
    <Button
      id="registerDeviceButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('Register device clicked');
      }}
    >
      Register Device
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'ImplantableDevices',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(g)(7) - Implantable Device List'
  ],
  deviceCategories: [
    'Cardiac Devices',
    'Neural Interfaces',
    'Sensory Augmentation',
    'Structural Implants',
    'Cybernetic Prosthetics',
    'Bio-Enhancement',
    'Monitoring Systems',
    'Drug Delivery'
  ],
  fhirResources: [
    'Device',
    'DeviceUseStatement',
    'DeviceRequest',
    'Procedure'
  ],
  settings: {
    enableUDI: true, // Unique Device Identification
    enableGUDID: true, // Global UDI Database
    enableRecalls: true,
    enablePatientAccess: true,
    trackPerformance: true,
    maxDevicesPerPatient: 50
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.implantableDevices.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
  PatientWorkflows = [];
}

// Check workflow visibility
if (!get(Meteor, 'settings.public.modules.implantableDevices.showInWorkflows', true)) {
  ClinicianWorkflows = [];
  PatientWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  // Routes
  DynamicRoutes,
  
  // Sidebar items
  ClinicianWorkflows,
  PatientWorkflows,
  
  // Footer
  FooterButtons,
  
  // Configuration
  ModuleConfig,
  
  // Main component for reuse
  ImplantableDevicesPage
};
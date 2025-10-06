// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/immunization-registry/index.jsx

import React from 'react';
import ImmunizationRegistryPage from './client/ImmunizationRegistryPage.jsx';

// Route registration for Honeycomb
let DynamicRoutes = [{
  name: 'ImmunizationRegistry',
  path: '/immunization-registry',
  element: <ImmunizationRegistryPage />,
  requireAuth: true
}];

// Sidebar menu integration
let SidebarWorkflows = [{
  primaryText: "Immunization Registry",
  to: '/immunization-registry',
  iconName: "vaccines"
}];

// Clinician workflow integration
let ClinicianWorkflows = [{
  primaryText: "Vaccine Surveillance",
  to: '/immunization-registry',
  iconName: "shield"
}];

export { 
  DynamicRoutes, 
  SidebarWorkflows, 
  ClinicianWorkflows
};
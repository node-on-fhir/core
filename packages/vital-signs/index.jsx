// packages/vital-signs/index.jsx
import React from 'react';
import { VitalSignsPageWrapper } from './client/VitalSignsPageWrapper';

// Debug: Log when package loads
if (Meteor.isClient) {
  console.log('Vital Signs package loaded on client');
}

// Export routes for automatic registration
export const DynamicRoutes = [{
  name: 'VitalSigns',
  path: '/vital-signs',
  element: <VitalSignsPageWrapper />,
  requireAuth: true
}, {
  name: 'PatientVitalSigns',
  path: '/vital-signs/:patientId',
  element: <VitalSignsPageWrapper />,
  requireAuth: true
}, {
  name: 'VitalSignDetail',
  path: '/vital-signs/:patientId/:observationId',
  element: <VitalSignsPageWrapper />,
  requireAuth: true
}];

// Export sidebar elements for navigation
export const SidebarElements = [{
  primaryText: "Vital Signs",
  to: '/vital-signs',
  iconName: "favorite",
  requireAuth: true,
  collectionName: 'Observations'
}];

// Export workflow elements for sidebar
export const SidebarWorkflows = [{
  primaryText: "Vital Signs Tracker",
  to: '/vital-signs',
  iconName: "favorite",
  requireAuth: false
}];

// Export everything from lib/index.js
export * from './lib/index.js';

// Debug exports
if (Meteor.isClient) {
  console.log('Vital Signs exports:', {
    DynamicRoutes,
    SidebarElements,
    SidebarWorkflows
  });
  
  // Check if package is available globally
  Meteor.startup(() => {
    console.log('Package["clinical:vital-signs"]:', Package['clinical:vital-signs']);
    if (Package['clinical:vital-signs']) {
      console.log('SidebarWorkflows from package:', Package['clinical:vital-signs'].SidebarWorkflows);
    }
  });
}
// packages/vital-signs/client/VitalSignsRoutes.js
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { VitalSignsPage } from './VitalSignsPage';

// Register routes for the vital signs package
const VitalSignsRoutes = [
  {
    path: '/vital-signs',
    element: <VitalSignsPage />,
    label: 'Vital Signs',
    icon: 'favorite'
  },
  {
    path: '/vital-signs/:patientId',
    element: <VitalSignsPage />,
    label: 'Patient Vital Signs',
    icon: 'favorite',
    hideFromMenu: true
  },
  {
    path: '/vital-signs/:patientId/:observationId',
    element: <VitalSignsPage />,
    label: 'Vital Sign Detail',
    icon: 'favorite',
    hideFromMenu: true
  }
];

export default VitalSignsRoutes;

// Export for menu integration
export const VitalSignsMenuItems = [
  {
    path: '/vital-signs',
    label: 'Vital Signs',
    icon: 'favorite',
    category: 'Clinical'
  }
];
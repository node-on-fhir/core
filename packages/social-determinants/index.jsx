// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/social-determinants/index.jsx

import React from 'react';
import SocialDeterminantsPage from './client/SocialDeterminantsPage';

// Route export for ONC 170.315(a)(15) compliance
let DynamicRoutes = [
  {
    name: 'SocialDeterminants',
    path: '/social-determinants',
    element: <SocialDeterminantsPage />,
    requireAuth: true,
    description: 'Social, psychological, and behavioral data - ONC §170.315(a)(15)'
  }
];

// Sidebar menu item
let SidebarElements = [
  {
    primaryText: "Social Determinants",
    to: '/social-determinants',
    iconName: "psychology",
    collectionName: 'Observations'
  }
];

// Sidebar workflow for clinical section
let SidebarWorkflows = [
  {
    primaryText: "SDOH Screening",
    to: '/social-determinants',
    iconName: "health_and_safety"
  }
];

export { DynamicRoutes, SidebarElements, SidebarWorkflows };
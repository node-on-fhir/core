// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/healthcare-surveys/index.jsx

import React from 'react';
import HealthcareSurveysPage from './client/HealthcareSurveysPage';

// Route export for ONC 170.315(f)(7) compliance
let DynamicRoutes = [
  {
    name: 'HealthcareSurveys',
    path: '/healthcare-surveys',
    element: <HealthcareSurveysPage />,
    requireAuth: true,
    description: 'Public health surveys transmission - ONC §170.315(f)(7)'
  }
];

// Sidebar menu item
let SidebarElements = [
  {
    primaryText: "Healthcare Surveys",
    to: '/healthcare-surveys',
    iconName: "analytics",
    collectionName: 'Compositions'
  }
];

// Sidebar workflow for clinical section
let SidebarWorkflows = [
  {
    primaryText: "Survey Reporting",
    to: '/healthcare-surveys',
    iconName: "publish"
  }
];

export { DynamicRoutes, SidebarElements, SidebarWorkflows };
// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/family-health-history/index.jsx

import React from 'react';
import FamilyHealthHistoryPage from './client/FamilyHealthHistoryPage';

// Route export for ONC 170.315(a)(12) compliance
let DynamicRoutes = [
  {
    name: 'FamilyHealthHistory',
    path: '/family-health-history',
    element: <FamilyHealthHistoryPage />,
    requireAuth: true,
    description: 'Family health history with genetic risk analysis - ONC §170.315(a)(12)'
  }
];

// Sidebar menu item
let SidebarElements = [
  {
    primaryText: "Family Health History",
    to: '/family-health-history',
    iconName: "family_restroom",
    collectionName: 'FamilyMemberHistories'
  }
];

// Sidebar workflow for clinical section
let SidebarWorkflows = [
  {
    primaryText: "Family Tree",
    to: '/family-health-history',
    iconName: "account_tree"
  }
];

export { DynamicRoutes, SidebarElements, SidebarWorkflows };
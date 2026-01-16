// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/syndromic-surveillance/index.jsx

import React from 'react';
import SyndromicSurveillancePage from './client/SyndromicSurveillancePage';

// Route export for ONC 170.315(f)(2) compliance
let DynamicRoutes = [
  {
    name: 'SyndromicSurveillance',
    path: '/syndromic-surveillance',
    element: <SyndromicSurveillancePage />,
    requireAuth: true,
    description: 'Transmission to public health agencies - Syndromic surveillance - ONC §170.315(f)(2)'
  }
];

// Sidebar menu item
let SidebarElements = [
  {
    primaryText: "Syndromic Surveillance",
    to: '/syndromic-surveillance',
    iconName: "timeline",
    collectionName: 'MeasureReports'
  }
];

export { DynamicRoutes, SidebarElements };
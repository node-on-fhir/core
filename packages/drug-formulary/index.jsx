// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/drug-formulary/index.jsx

import React from 'react';
import DrugFormularyPage from './client/DrugFormularyPage';

// Route export for ONC 170.315(a)(10) compliance
let DynamicRoutes = [
  {
    name: 'DrugFormulary',
    path: '/drug-formulary',
    element: <DrugFormularyPage />,
    requireAuth: true,
    description: 'Drug formulary and preferred drug list checks - ONC §170.315(a)(10)'
  }
];

// Sidebar menu item
let SidebarElements = [
  {
    primaryText: "Drug Formulary",
    to: '/drug-formulary',
    iconName: "pharmacy",
    collectionName: 'FormularyDrugs'
  }
];

export { DynamicRoutes, SidebarElements };
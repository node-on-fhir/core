// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/clinical-lists/index.jsx

import React from 'react';

// Client components
import ProblemListPage from './client/ProblemListPage';
import MedicationAllergyListPage from './client/MedicationAllergyListPage';
import MedicationListPage from './client/MedicationListPage';

// Route exports for ONC 170.315(a)(6-8) compliance
let DynamicRoutes = [
  {
    name: 'ProblemList',
    path: '/problem-list',
    element: <ProblemListPage />,
    requireAuth: true,
    description: 'Problem List management - ONC §170.315(a)(6)'
  },
  {
    name: 'MedicationAllergyList',
    path: '/medication-allergy-list',
    element: <MedicationAllergyListPage />,
    requireAuth: true,
    description: 'Medication Allergy List management - ONC §170.315(a)(7)'
  },
  {
    name: 'MedicationList',
    path: '/medication-list',
    element: <MedicationListPage />,
    requireAuth: true,
    description: 'Medication List management - ONC §170.315(a)(8)'
  }
];

// Sidebar menu items for clinical lists
let SidebarElements = [
  {
    primaryText: "Problem List",
    to: '/problem-list',
    iconName: "problem",
    collectionName: 'Conditions'
  },
  {
    primaryText: "Medication Allergies",
    to: '/medication-allergy-list',
    iconName: "allergy",
    collectionName: 'AllergyIntolerances'
  },
  {
    primaryText: "Medications",
    to: '/medication-list',
    iconName: "medication",
    collectionName: 'MedicationStatements'
  }
];

export { DynamicRoutes, SidebarElements };
// /packages/patient-matching/index.jsx
import React from 'react';

// Import and export main namespace
import { PatientMatching } from './lib/PatientMatching.js';
export { PatientMatching };

// Import pages - use direct imports to avoid caching issues
import PatientMatchingPageComponent from './client/pages/PatientMatchingPage.jsx';
import IdentityAssurancePageComponent from './client/pages/IdentityAssurancePage.jsx';

// Export routes for dynamic injection
export const DynamicRoutes = [{
  name: 'PatientMatching',
  path: '/patient-matching',
  element: <PatientMatchingPageComponent />,
  requireAuth: true
}, {
  name: 'IdentityAssurance',
  path: '/identity-assurance',
  element: <IdentityAssurancePageComponent />,
  requireAuth: true
}];

// Export sidebar elements
export const SidebarWorkflows = [{
  primaryText: 'Patient Matching',
  to: '/patient-matching',
  iconName: 'people'
}, {
  primaryText: 'Identity Assurance',
  to: '/identity-assurance',
  iconName: 'security'
}];

// Export components for direct use
export { 
  PatientMatchingPageComponent as PatientMatchingPage,
  IdentityAssurancePageComponent as IdentityAssurancePage
};
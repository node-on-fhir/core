// packages/multi-factor-auth/index.jsx

import React from 'react';

// Import pages
import { MFASetupPage } from './client/pages/MFASetupPage';
import { MFAManagementPage } from './client/pages/MFAManagementPage';

// Import icons
import { 
  Security as SecurityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

//====================================================================================
// Dynamic Routes for React Router

let DynamicRoutes = [
  {
    name: 'MFASetup',
    path: '/mfa-setup',
    element: <MFASetupPage />,
    requireAuth: true
  },
  {
    name: 'MFAManagement',
    path: '/mfa-management',
    element: <MFAManagementPage />,
    requireAuth: true
  },
  {
    name: 'AccountSecurity',
    path: '/account-security',
    element: <MFAManagementPage />,
    requireAuth: true
  }
];

//====================================================================================
// Sidebar Navigation Items

let SidebarWorkflows = [
  {
    primaryText: 'Multi-Factor Auth',
    to: '/mfa-management',
    iconName: 'security',
    requireAuth: true
  }
];

//====================================================================================
// Footer Buttons for contextual actions

let FooterButtons = [
  {
    pathname: '/mfa-setup',
    component: function MFASetupFooter(props) {
      return null; // No special footer for this page
    }
  },
  {
    pathname: '/mfa-management',
    component: function MFAManagementFooter(props) {
      return null; // No special footer for this page
    }
  }
];

//====================================================================================
// Export all package APIs

export { 
  DynamicRoutes, 
  SidebarWorkflows,
  FooterButtons,
  MFASetupPage,
  MFAManagementPage
};

// Also attach to Package for Meteor's package system
if (typeof Package !== 'undefined') {
  Package['clinical:multi-factor-auth'] = {
    DynamicRoutes,
    SidebarWorkflows,
    FooterButtons
  };
}
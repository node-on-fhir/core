// /packages/accounts/index.jsx

import React from 'react';
import AccountsManagementPage from './client/AccountsManagementPage';

// Export the main component
export { AccountsManagementPage };

// Define routes for automatic registration
let DynamicRoutes = [{
  name: 'AccountsManagement',
  path: '/accounts-management',
  element: <AccountsManagementPage />,
  requireAuth: true
}];

export { DynamicRoutes };
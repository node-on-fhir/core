// client/AppRouter.jsx

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import { CircularProgress, Box } from '@mui/material';

// Core layout
import { AppLayout } from '../imports/ui/layouts/AppLayout';

// Loading component
const Loading = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
    sx={{ 
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50]
        : theme.palette.background.default
    }}
  >
    <CircularProgress />
  </Box>
);

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function AppRouter() {
  // Track if accounts module is enabled
  const { accountsEnabled, firstRun, accountRoutes } = useTracker(() => {
    const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
    const firstRun = get(Meteor, 'settings.public.firstRun', false);
    
    let routes = [];
    
    // Dynamically import account routes if enabled
    if (accountsEnabled) {
      // This would be imported at the top in a real implementation
      const { accountRoutes } = require('../imports/accounts/client/routes');
      routes = accountRoutes;
    }
    
    return {
      accountsEnabled,
      firstRun,
      accountRoutes: routes
    };
  });

  // If first run and accounts enabled, redirect to setup
  if (firstRun && accountsEnabled) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/first-run" element={
            <Suspense fallback={<Loading />}>
              {accountRoutes.find(r => r.path === '/first-run')?.element}
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/first-run" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Core routes */}
            <Route path="/" element={<HomePage />} />
            
            {/* Account routes (conditional) */}
            {accountsEnabled && accountRoutes.map((route, index) => (
              <Route 
                key={index}
                path={route.path} 
                element={route.element}
              />
            ))}
            
            {/* Plugin routes would be added here dynamically */}
            
            {/* 404 - must be last */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  );
}

// Example HomePage component
function HomePage() {
  const currentUser = useTracker(() => Meteor.user());
  
  return (
    <div>
      <h1>Welcome to Honeycomb</h1>
      {currentUser ? (
        <p>Hello, {currentUser.username || currentUser.emails[0].address}!</p>
      ) : (
        <p>Please log in to continue.</p>
      )}
    </div>
  );
}

// Example NotFoundPage component
function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}
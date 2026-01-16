// imports/accounts/client/routes.js

import React from 'react';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { FirstRunSetup } from './components/FirstRunSetup';
import { Container, Box } from '@mui/material';

// Account routes that will be conditionally loaded
export const accountRoutes = [
  {
    path: '/login',
    element: <LoginPage />,
    public: true
  },
  {
    path: '/signin', // Alias for login
    element: <LoginPage />,
    public: true
  },
  {
    path: '/register',
    element: <RegisterPage />,
    public: true
  },
  {
    path: '/signup', // Alias for register
    element: <RegisterPage />,
    public: true
  },
  {
    path: '/forgot-password',
    element: (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <ForgotPasswordForm 
            onBackToLogin={() => window.location.href = '/login'}
          />
        </Box>
      </Container>
    ),
    public: true
  },
  {
    path: '/reset-password/:token',
    element: (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <div>Reset Password Page (TODO)</div>
        </Box>
      </Container>
    ),
    public: true
  },
  {
    path: '/enroll-account/:token',
    element: (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <div>Enroll Account Page (TODO)</div>
        </Box>
      </Container>
    ),
    public: true
  },
  {
    path: '/first-run',
    element: (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <FirstRunSetup />
        </Box>
      </Container>
    ),
    public: true
  }
];
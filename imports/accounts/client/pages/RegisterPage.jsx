// imports/accounts/client/pages/RegisterPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { SignupForm } from '../components/SignupForm';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { sanitizeReturnPath, appendReturnTo } = WorkflowNavigation;

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route preservation: ?returnTo=<encoded internal path> threaded from
  // AuthGuard/NoAuthorizationPage (or forwarded from LoginPage). Sanitized
  // decoded value; invalid/absent falls back to the home route.
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const handleSuccess = function() {
    // Redirect to the originally requested page after successful
    // registration, or home when none was preserved
    navigate(returnTo || '/');
  };

  const handleLoginClick = function() {
    // Forward returnTo so the route survives a signup <-> signin bounce
    navigate(appendReturnTo('/login', returnTo));
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <SignupForm
            onSuccess={handleSuccess}
            onLoginClick={handleLoginClick}
            isDark={isDark}
          />
        </Box>
      </Container>
    </Box>
  );
}

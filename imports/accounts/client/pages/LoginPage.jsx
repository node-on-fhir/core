// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { sanitizeReturnPath, appendReturnTo } = WorkflowNavigation;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route preservation: AuthGuard/NoAuthorizationPage thread the blocked
  // route here as ?returnTo=<encoded internal path>. searchParams.get()
  // already decoded once — sanitize the decoded value (internal paths only;
  // invalid/absent falls back to the home route).
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const handleSuccess = function() {
    // Redirect to the originally requested page after successful login,
    // or home when none was preserved
    navigate(returnTo || '/');
  };

  const handleSignupClick = function() {
    // Forward returnTo so the route survives a signin <-> signup bounce
    navigate(appendReturnTo('/register', returnTo));
  };

  const handleForgotPasswordClick = function() {
    // returnTo intentionally NOT forwarded: the reset flow round-trips
    // through email -> /reset-password/:token, so the param is lost anyway
    navigate('/forgot-password');
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <LoginForm
            onSuccess={handleSuccess}
            onSignupClick={handleSignupClick}
            onForgotPasswordClick={handleForgotPasswordClick}
            isDark={isDark}
          />
        </Box>
      </Container>
    </Box>
  );
}

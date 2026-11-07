// imports/accounts/client/pages/RegisterPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { AuthCard } from '../components/AuthCard';
import { AuthThemeScope } from '/imports/ui/theme/AuthThemeScope.jsx';
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
    // registration, then the saved workspace preference, then home
    const preferredHome = get(Meteor.user(), 'profile.preferences.homePage', '');
    navigate(returnTo || preferredHome || '/');
  };

  const handleForgotPassword = function() {
    // Reset flow round-trips through email; returnTo is lost anyway
    navigate('/forgot-password');
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <AuthThemeScope>
            <AuthCard
              initialMode="signup"
              onSuccess={handleSuccess}
              onForgotPassword={handleForgotPassword}
            />
          </AuthThemeScope>
        </Box>
      </Container>
    </Box>
  );
}

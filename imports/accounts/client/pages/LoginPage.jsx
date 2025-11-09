// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const handleSuccess = () => {
    // Redirect to home or intended page after successful login
    navigate('/');
  };

  const handleSignupClick = () => {
    navigate('/register');
  };

  const handleForgotPasswordClick = () => {
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
// imports/accounts/client/pages/RegisterPage.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { SignupForm } from '../components/SignupForm';

export function RegisterPage() {
  const navigate = useNavigate();

  // Get Honeycomb theme for dark mode support
  const useAppTheme = Meteor.useTheme;
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const handleSuccess = () => {
    // Redirect to home after successful registration
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
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
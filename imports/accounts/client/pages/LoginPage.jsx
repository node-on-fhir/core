// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

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
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50]
        : theme.palette.background.default
    }}>
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4 }}>
          <LoginForm 
            onSuccess={handleSuccess}
            onSignupClick={handleSignupClick}
            onForgotPasswordClick={handleForgotPasswordClick}
          />
        </Box>
      </Container>
    </Box>
  );
}
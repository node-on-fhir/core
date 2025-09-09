// imports/accounts/client/pages/RegisterPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { SignupForm } from '../components/SignupForm';

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Redirect to home after successful registration
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
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
          <SignupForm 
            onSuccess={handleSuccess}
            onLoginClick={handleLoginClick}
          />
        </Box>
      </Container>
    </Box>
  );
}
// imports/accounts/client/pages/ForgotPasswordPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box sx={{ pt: 8, pb: 4 }}>
        <ForgotPasswordForm onBackToLogin={() => navigate('/login')} />
      </Box>
    </Container>
  );
}

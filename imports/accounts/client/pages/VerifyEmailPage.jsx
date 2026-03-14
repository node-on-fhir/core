// imports/accounts/client/pages/VerifyEmailPage.jsx

import React, { useState, useEffect } from 'react';
import { Accounts } from 'meteor/accounts-base';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Paper
} from '@mui/material';

export function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided. Please check your email link.');
      return;
    }

    Accounts.verifyEmail(token, function(error) {
      if (error) {
        console.error('[VerifyEmailPage] Verification failed:', error);
        setStatus('error');

        if (error.error === 'verify-email-link-expired') {
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else if (error.error === 'verify-email-link-already-used') {
          setErrorMessage('This email has already been verified.');
        } else {
          setErrorMessage(error.reason || 'Invalid or expired verification token.');
        }
      } else {
        console.log('[VerifyEmailPage] Email verified successfully');
        setStatus('success');
      }
    });
  }, [token]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ pt: 8, pb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 5,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 500, mb: 3 }}
          >
            Email Verification
          </Typography>

          {status === 'verifying' && (
            <Box sx={{ py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Verifying your email address...
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ py: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Your email address has been verified successfully.
              </Alert>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ py: 2 }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

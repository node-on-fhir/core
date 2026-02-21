// imports/accounts/client/pages/ResetPasswordPage.jsx

import React, { useState } from 'react';
import { Accounts } from 'meteor/accounts-base';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Alert,
  Button,
  TextField,
  CircularProgress,
  Paper
} from '@mui/material';

export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('form'); // form | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');

  if (!token) {
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
            <Alert severity="error" sx={{ mb: 3 }}>
              No reset token provided. Please check your email link.
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');

    Accounts.resetPassword(token, newPassword, function(error) {
      if (error) {
        console.error('[ResetPasswordPage] Reset failed:', error);
        setStatus('error');

        if (error.error === 'token-expired') {
          setErrorMessage('This reset link has expired. Please request a new one.');
        } else {
          setErrorMessage(error.reason || 'Failed to reset password. The link may be invalid or expired.');
        }
      } else {
        console.log('[ResetPasswordPage] Password reset successfully');
        setStatus('success');

        // Auto-redirect to home after 2 seconds (user is now logged in)
        setTimeout(function() {
          navigate('/');
        }, 2000);
      }
    });
  }

  // Password strength border color
  function getPasswordBorderColor() {
    if (newPassword.length === 0) return 'divider';
    if (newPassword.length >= 16) return 'success.main';
    if (newPassword.length >= 12) return 'warning.main';
    return 'divider';
  }

  function getPasswordBorderWidth() {
    if (newPassword.length >= 12) return 2;
    return 1;
  }

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
            borderRadius: 2
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 500, mb: 2, textAlign: 'center' }}
          >
            Reset Password
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4, textAlign: 'center' }}
          >
            Enter your new password below.
          </Typography>

          {status === 'success' && (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Your password has been reset successfully. Redirecting...
              </Alert>
              <CircularProgress size={24} />
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ py: 2, textAlign: 'center' }}>
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/forgot-password')}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                Request New Reset Link
              </Button>
            </Box>
          )}

          {(status === 'form' || status === 'loading') && (
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  component="label"
                  sx={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  New Password *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Create a strong password (min 12 chars)"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  autoFocus
                  disabled={status === 'loading'}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: getPasswordBorderColor(),
                        borderWidth: getPasswordBorderWidth()
                      }
                    }
                  }}
                  FormHelperTextProps={{
                    sx: {
                      position: 'absolute',
                      bottom: -22,
                      mx: 0,
                      color: newPassword.length >= 16 ? 'success.main' :
                        newPassword.length >= 12 ? 'warning.main' : 'text.secondary'
                    }
                  }}
                  helperText={
                    newPassword.length > 0 ?
                      (newPassword.length < 12 ? `${newPassword.length}/12 characters minimum` :
                        newPassword.length < 16 ? `${newPassword.length} characters (16+ recommended)` :
                          `${newPassword.length} characters (strong password)`) : ''
                  }
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: newPassword.length > 0 ? 3.5 : 1,
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  NIST 800-63B recommends a passphrase of 12 chars or more
                </Typography>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography
                  component="label"
                  sx={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    mb: 0.5
                  }}
                >
                  Confirm Password *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Confirm your new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={status === 'loading' || newPassword.length < 12}
                  error={confirmPassword.length > 0 && newPassword !== confirmPassword}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: confirmPassword.length > 0 && newPassword !== confirmPassword
                          ? 'error.main' : 'divider'
                      }
                    }
                  }}
                  FormHelperTextProps={{
                    sx: {
                      position: 'absolute',
                      bottom: -22,
                      mx: 0
                    }
                  }}
                  helperText={
                    confirmPassword.length > 0 && newPassword !== confirmPassword
                      ? 'Passwords do not match' : ''
                  }
                />
              </Box>

              {errorMessage && status === 'form' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errorMessage}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={
                  status === 'loading' ||
                  newPassword.length < 12 ||
                  newPassword !== confirmPassword
                }
                sx={{
                  mb: 3,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                {status === 'loading' ? (
                  <CircularProgress size={24} sx={{ color: 'inherit' }} />
                ) : (
                  'Reset Password'
                )}
              </Button>

              <Box sx={{
                textAlign: 'center',
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'secondary.main',
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Back to Sign In
                </Button>
              </Box>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

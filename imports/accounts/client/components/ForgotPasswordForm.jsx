// imports/accounts/client/components/ForgotPasswordForm.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link
} from '@mui/material';

export function ForgotPasswordForm({ onSuccess, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Use Meteor's built-in password reset
      await new Promise((resolve, reject) => {
        Accounts.forgotPassword({ email }, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      
      setSuccess(true);
      if (onSuccess) {
        onSuccess(email);
      }
    } catch (err) {
      // Handle specific error cases
      if (err.error === 403) {
        setError('Email address not found');
      } else {
        setError(err.reason || err.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 5, 
        maxWidth: 440, 
        mx: 'auto',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 500,
          mb: 2,
          textAlign: 'center'
        }}
      >
        Reset Password
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 4, textAlign: 'center' }}
      >
        Enter your email address and we'll send you a link to reset your password.
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Enter your email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={success}
            variant="outlined"
            InputLabelProps={{ 
              shrink: true,
              sx: { 
                position: 'static',
                transform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.secondary',
                mb: 0.5
              }
            }}
            label="Email *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider'
                }
              }
            }}
          />
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            Password reset instructions have been sent to {email}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={loading || success}
          sx={{ 
            mb: 3,
            py: 1.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </Button>
        
        <Box sx={{ 
          textAlign: 'center',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Link
            component="button"
            variant="body2"
            onClick={(e) => {
              e.preventDefault();
              onBackToLogin?.();
            }}
            sx={{ 
              color: 'secondary.main',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            Back to Sign In
          </Link>
        </Box>
      </form>
    </Paper>
  );
}
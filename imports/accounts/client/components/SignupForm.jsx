// imports/accounts/client/components/SignupForm.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Link
} from '@mui/material';
import { logger } from '../../lib/AccountsLogger';

export function SignupForm({ onSuccess, onLoginClick }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState({
    checking: false,
    usernameAvailable: null,
    emailAvailable: null,
    suggestions: []
  });
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: ''
  });
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user types
    if (field === 'username' || field === 'email') {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Check availability when username or email changes
  useEffect(() => {
    if (!formData.username || !formData.email) return;
    
    const timeoutId = setTimeout(() => {
      setAvailability(prev => ({ ...prev, checking: true }));
      
      Meteor.call('accounts.checkAvailability', formData.username, formData.email, (error, result) => {
        if (error) {
          logger.error('Availability check error:', error);
        } else {
          setAvailability({
            checking: false,
            usernameAvailable: result.usernameAvailable,
            emailAvailable: result.emailAvailable,
            suggestions: result.suggestions
          });
          
          // Set field-specific errors
          if (!result.usernameAvailable) {
            setFieldErrors(prev => ({ 
              ...prev, 
              username: 'Username is already taken' 
            }));
          }
          if (!result.emailAvailable) {
            setFieldErrors(prev => ({ 
              ...prev, 
              email: 'Email is already registered' 
            }));
          }
        }
      });
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [formData.username, formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    logger.group('SignupForm.handleSubmit');
    logger.log('Form submission started');
    logger.debug('Form data:', formData);

    // Check if username/email are available
    if (fieldErrors.username || fieldErrors.email) {
      logger.warn('Form has field errors', fieldErrors);
      setError('Please fix the errors above before submitting');
      logger.groupEnd();
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      logger.warn('Password validation failed: passwords do not match');
      setError('Passwords do not match');
      logger.groupEnd();
      return;
    } else {
      logger.log('Password validation passed');
    }

    setLoading(true);
    logger.time('createUser');

    try {
      logger.info('Calling Accounts.createUser with:', {
        username: formData.username,
        email: formData.email,
        password: '[REDACTED]',
        passwordLength: formData.password.length
      });

      // Create user account using Meteor's built-in method
      await new Promise((resolve, reject) => {
        Accounts.createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }, (error) => {
          if (error) {
            logger.error('Accounts.createUser callback error:', error);
            reject(error);
          } else {
            logger.info('Accounts.createUser succeeded');
            resolve();
          }
        });
      });
      
      logger.timeEnd('createUser');
      logger.log('User created successfully');
      
      if (onSuccess) {
        logger.log('Calling onSuccess callback');
        onSuccess();
      } else {
        logger.log('Navigating to home page');
        navigate('/');
      }
    } catch (err) {
      logger.timeEnd('createUser');
      logger.group('Registration Error Details', true);
      logger.error('Registration failed:', err);
      logger.error('Error type:', err.constructor.name);
      logger.error('Error code:', err.error);
      logger.error('Error reason:', err.reason);
      logger.error('Error message:', err.message);
      logger.error('Error details:', err.details);
      logger.error('Full error object:', err);
      logger.groupEnd();
      
      // Handle specific error cases
      if (err.error === 403) {
        logger.warn('403 Forbidden error received');
        if (err.reason && err.reason.includes('Username')) {
          logger.info('Error type: Username already exists');
          setError('Username already exists');
        } else if (err.reason && err.reason.includes('Email')) {
          logger.info('Error type: Email already registered');
          setError('Email address already registered');
        } else {
          logger.warn('Generic 403 error:', err.reason);
          setError(err.reason || 'Registration failed');
        }
      } else {
        logger.warn('Non-403 error:', err.error);
        setError(err.reason || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
      logger.log('Form submission completed');
      logger.groupEnd();
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
          mb: 4,
          textAlign: 'center'
        }}
      >
        Create Account
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Choose a username"
            name="username"
            value={formData.username}
            onChange={handleChange('username')}
            required
            autoComplete="username"
            inputProps={{ minLength: 3 }}
            error={!!fieldErrors.username}
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
            label="Username *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: fieldErrors.username ? 'error.main' : 'divider'
                }
              }
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0,
                fontSize: '0.75rem'
              }
            }}
            helperText={
              fieldErrors.username || 
              (availability.checking && formData.username ? 'Checking...' : 
               formData.username.length > 0 && formData.username.length < 3 ? 'Must be at least 3 characters' : '')
            }
          />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Your email address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
            autoComplete="email"
            error={!!fieldErrors.email}
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
                  borderColor: fieldErrors.email ? 'error.main' : 'divider'
                }
              }
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0,
                fontSize: '0.75rem'
              }
            }}
            helperText={fieldErrors.email}
          />
        </Box>
        
        {(fieldErrors.username || fieldErrors.email) && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  onLoginClick ? onLoginClick() : navigate('/login');
                }}
                sx={{ 
                  color: 'primary.main',
                  fontWeight: 500,
                  verticalAlign: 'baseline'
                }}
              >
                Sign in instead
              </Link>
            </Typography>
            {fieldErrors.username && availability.suggestions.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Available: {availability.suggestions.slice(0, 3).join(', ')}
              </Typography>
            )}
          </Alert>
        )}
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Create a strong password (min 12 chars)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
            inputProps={{ minLength: 12 }}
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
            label="Password *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: formData.password.length >= 16 ? 'success.main' : 
                               formData.password.length >= 12 ? 'warning.main' : 
                               'divider',
                  borderWidth: formData.password.length >= 12 ? 2 : 1
                }
              }
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0,
                fontSize: '0.75rem',
                color: formData.password.length >= 16 ? 'success.main' : 
                       formData.password.length >= 12 ? 'warning.main' : 
                       'text.secondary'
              }
            }}
            helperText={
              formData.password.length > 0 ? 
                (formData.password.length < 12 ? `${formData.password.length}/12 characters minimum` :
                 formData.password.length < 16 ? `${formData.password.length} characters (16+ recommended)` :
                 `${formData.password.length} characters (strong password)`) : ''
            }
          />
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: formData.password.length > 0 ? 3.5 : 1,
              color: 'text.secondary',
              fontStyle: 'italic'
            }}
          >
            NIST 800-63B recommends a passphrase of 12 chars or more
          </Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Confirm your password"
            name="confirm"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            autoComplete="new-password"
            disabled={formData.password.length < 12}
            error={Boolean(formData.confirmPassword && formData.password !== formData.confirmPassword)}
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
            label="Confirm Password *"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error.main' : 'divider'
                }
              }
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0,
                fontSize: '0.75rem'
              }
            }}
            helperText={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'Passwords do not match' : ''}
            data-testid={formData.confirmPassword && formData.password !== formData.confirmPassword ? 'password-mismatch' : undefined}
          />
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={
            loading || 
            !formData.username || 
            !formData.email || 
            !formData.password || 
            !formData.confirmPassword ||
            !!fieldErrors.username ||
            !!fieldErrors.email ||
            availability.checking ||
            formData.password !== formData.confirmPassword
          }
          sx={{ 
            mb: 4,
            py: 1.5,
            textTransform: 'uppercase',
            fontWeight: 600,
            fontSize: '0.875rem',
            letterSpacing: '0.5px',
          }}
        >
          {loading ? 'Creating account...' : 
           availability.checking ? 'Checking availability...' : 
           'Create Account'}
        </Button>
        
        <Box sx={{ 
          textAlign: 'center',
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              onClick={(e) => {
                e.preventDefault();
                onLoginClick ? onLoginClick() : navigate('/login');
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
              Sign In
            </Link>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
}
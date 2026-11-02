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
  Link,
  Stack,
  IconButton,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { logger } from '../../lib/AccountsLogger';

// Passphrase length buckets for the 4-segment strength meter (no zxcvbn —
// NIST 800-63B favors length; segments light at 12/16/20/24 chars).
const METER_BUCKETS = [12, 16, 20, 24];

function meterLabel(length) {
  if (length === 0) return 'Minimum 12 characters.';
  if (length < 12) return length + '/12 characters minimum';
  if (length < 16) return 'Good · ' + length + ' characters. No confirm step — you can see it.';
  return 'Strong · ' + length + ' characters. No confirm step — you can see it.';
}

export function SignupForm({ onSuccess, onLoginClick, isDark = false }) {
  // Theme-aware colors
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const inputBorderColor = isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    acceptTerms: false
  });
  // Visible-by-default passphrase (design handoff: show it, no confirm step)
  const [passphraseVisible, setPassphraseVisible] = useState(true);
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

    // Single visible passphrase — no confirm step (NIST 800-63B). Length is
    // the gate; server-side policy re-validates on createUser.
    if (formData.password.length < 12) {
      logger.warn('Password validation failed: under 12 characters');
      setError('Passphrase must be at least 12 characters');
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
      data-testid="auth-card"
      sx={{
        p: 5,
        maxWidth: 440,
        mx: 'auto',
        backgroundColor: cardBgColor,
        border: '1px solid',
        borderColor: inputBorderColor,
        borderRadius: 2,
        '& .MuiTypography-root': { color: cardTextColor },
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiInputLabel-root': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: inputBorderColor
        },
        '& .MuiFormHelperText-root': {
          color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
        }
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 500,
          mb: 4,
          textAlign: 'center',
          color: cardTextColor
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
            inputProps={{ minLength: 3, enterKeyHint: 'next', autoCapitalize: 'none', spellCheck: false }}
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
            inputProps={{ inputMode: 'email', enterKeyHint: 'next' }}
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
            placeholder="correct horse battery staple"
            name="password"
            type={passphraseVisible ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
            inputProps={{
              minLength: 12,
              enterKeyHint: 'go',
              'aria-describedby': 'passphrase-meter-text'
            }}
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
            label="Create a passphrase *"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    data-testid="auth-pass-toggle"
                    aria-label={passphraseVisible ? 'Hide passphrase' : 'Show passphrase'}
                    aria-pressed={!passphraseVisible}
                    onClick={function() { setPassphraseVisible(!passphraseVisible); }}
                    edge="end"
                    sx={{ width: 44, height: 44, m: '6px' }}
                  >
                    {passphraseVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            data-testid="auth-pass-meter"
            sx={{ mt: 1.5 }}
          >
            {METER_BUCKETS.map(function(bucket) {
              return (
                <LinearProgress
                  key={bucket}
                  variant="determinate"
                  value={formData.password.length >= bucket ? 100 : 0}
                  color={formData.password.length >= 12 ? 'success' : 'primary'}
                  sx={{ flex: 1 }}
                />
              );
            })}
          </Stack>
          <Typography
            id="passphrase-meter-text"
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.75,
              color: formData.password.length >= 12 ? 'success.main' : 'text.secondary'
            }}
          >
            {meterLabel(formData.password.length)}
          </Typography>
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
          data-testid="auth-submit"
          disabled={
            loading ||
            !formData.username ||
            !formData.email ||
            formData.password.length < 12 ||
            !!fieldErrors.username ||
            !!fieldErrors.email ||
            availability.checking
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
          <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            Already have an account?
            <Button
              type="button"
              variant="text"
              onClick={function(e) {
                e.preventDefault();
                onLoginClick ? onLoginClick() : navigate('/login');
              }}
              sx={{ minHeight: 48 }}
            >
              Sign In
            </Button>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
}
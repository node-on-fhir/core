// imports/accounts/client/components/LoginForm.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  Paper,
  Link,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { logger } from '../../lib/AccountsLogger';
import { useDevAutoLogin } from '../hooks/useDevAutoLogin';

export function LoginForm({ onSuccess, onSignupClick, onForgotPasswordClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [checkingNewUsername, setCheckingNewUsername] = useState(false);
  const [newUsernameAvailable, setNewUsernameAvailable] = useState(null);
  const navigate = useNavigate();

  // Development auto-login
  const { autoLoginStatus, error: autoLoginError } = useDevAutoLogin();

  // Handle successful auto-login
  useEffect(() => {
    if (autoLoginStatus === 'success' && Meteor.userId()) {
      logger.info('Auto-login successful, redirecting...');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    }
  }, [autoLoginStatus, onSuccess, navigate]);

  // Check if email is configured on component mount
  useEffect(() => {
    Meteor.call('accounts.isEmailConfigured', (error, result) => {
      if (!error && result) {
        setEmailConfigured(result.configured);
      }
    });
  }, []);

  // Check if user exists when username changes
  useEffect(() => {
    // Reset registration mode if username changes
    if (registrationMode) {
      setRegistrationMode(false);
      setConfirmPassword('');
      setNewUsername('');
      setNewUsernameAvailable(null);
    }
    
    if (!username || username.length < 3) {
      setUserExists(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setCheckingUser(true);
      
      Meteor.call('accounts.checkUserExists', username, (error, result) => {
        setCheckingUser(false);
        if (error) {
          logger.error('Error checking user:', error);
        } else {
          setUserExists(result.exists);
          if (!result.exists) {
            setError('');  // Clear any previous errors
          }
        }
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [username]);

  // Check new username availability in registration mode
  useEffect(() => {
    if (!registrationMode || !newUsername || newUsername.length < 3) {
      setNewUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setCheckingNewUsername(true);
      
      Meteor.call('accounts.checkUsernameAvailability', newUsername, (error, result) => {
        setCheckingNewUsername(false);
        if (error) {
          logger.error('Error checking username availability:', error);
        } else {
          setNewUsernameAvailable(result);
        }
      });
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [newUsername, registrationMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (registrationMode) {
      // Handle registration
      logger.group('LoginForm.handleRegistration');
      logger.log('Registration attempt started');
      
      try {
        // Validate passwords match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Create the user account
        await new Promise((resolve, reject) => {
          Accounts.createUser({
            username: newUsername,
            email: username, // Email was entered in the username field
            password: password
          }, (error) => {
            if (error) {
              logger.error('Registration error:', error);
              reject(error);
            } else {
              logger.info('Registration successful');
              resolve();
            }
          });
        });
        
        logger.log('User registered successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      } catch (err) {
        logger.error('Registration failed:', err);
        setError(err.reason || err.message || 'Registration failed');
      } finally {
        setLoading(false);
        logger.groupEnd();
      }
    } else {
      // Handle login
      logger.group('LoginForm.handleSubmit');
      logger.log('Login attempt started');
      logger.debug('Username/email:', username);

      try {
        logger.info('Calling Meteor.loginWithPassword');
        logger.debug('User exists check before login:', userExists);
        
        // Login with username or email using Meteor's built-in method
        await new Promise((resolve, reject) => {
          Meteor.loginWithPassword(username, password, (error) => {
            if (error) {
              logger.error('Login error:', error);
              logger.error('Error details:', {
                error: error.error,
                reason: error.reason,
                message: error.message,
                details: error.details,
                errorType: error.errorType || error.constructor.name
              });
              
              // Additional logging for generic 403 errors
              if (error.error === 403 && error.reason === 'Something went wrong. Please check your credentials.') {
                logger.warn('Generic 403 error detected - this usually means:');
                logger.warn('1. User does not exist');
                logger.warn('2. Password is incorrect');
                logger.warn('3. Account is locked or restricted');
                logger.debug('Checking if user exists...');
                
                // Double-check user existence
                Meteor.call('accounts.checkUserExists', username, (checkError, checkResult) => {
                  if (!checkError && checkResult) {
                    logger.info('User existence check result:', checkResult);
                    setUserExists(checkResult.exists);
                  }
                });
              }
              
              reject(error);
            } else {
              logger.info('Login successful');
              resolve();
            }
          });
        });
        
        logger.log('Redirecting after successful login');
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      } catch (err) {
        logger.group('Login Error Analysis', true);
        
        // Provide more specific error messages
        let errorMessage = 'Invalid username or password';
        
        if (err.error === 403) {
          if (err.reason === 'User not found') {
            errorMessage = 'No account found with that username or email';
            setUserExists(false);
          } else if (err.reason === 'Incorrect password') {
            errorMessage = 'Incorrect password';
          } else if (err.reason && err.reason.includes('too many requests')) {
            errorMessage = 'Too many login attempts. Please try again later.';
          } else if (err.reason === 'Something went wrong. Please check your credentials.') {
            // This is Meteor's generic error - check if user exists
            if (userExists === false) {
              errorMessage = 'No account found with that username or email';
            } else {
              errorMessage = 'Invalid password';
            }
          }
        } else if (err.error === 400) {
          errorMessage = 'Please enter both username and password';
        } else {
          errorMessage = err.reason || err.message || 'Login failed';
        }
        
        logger.error('Setting error message:', errorMessage);
        logger.groupEnd();
        
        setError(errorMessage);
      } finally {
        setLoading(false);
        logger.log('Login attempt completed');
        logger.groupEnd();
      }
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
        {registrationMode ? 'Create Account' : 'Sign In'}
      </Typography>
      
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
            Username or Email *
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter username or email"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
            error={userExists === false}
            variant="outlined"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: userExists === false ? 'error.main' : 'divider'
                }
              },
              endAdornment: checkingUser ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0
              }
            }}
            helperText={userExists === false ? 'No account found with this username/email' : ''}
          />
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
            Password *
          </Typography>
          <TextField
            fullWidth
            placeholder={registrationMode ? "Create a strong password (min 12 chars)" : "Enter password"}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={registrationMode ? "new-password" : "current-password"}
            disabled={!registrationMode && userExists === false}
            variant="outlined"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: registrationMode ? 
                    (password.length >= 16 ? '#5cb85c' : 
                     password.length >= 12 ? '#f0ad4e' : 
                     'divider') : 'divider',
                  borderWidth: registrationMode && password.length >= 12 ? 2 : 1
                }
              }
            }}
            FormHelperTextProps={{
              sx: { 
                position: 'absolute',
                bottom: -22,
                mx: 0,
                color: registrationMode ? 
                  (password.length >= 16 ? '#5cb85c' : 
                   password.length >= 12 ? '#f0ad4e' : 
                   'text.secondary') : 'text.secondary'
              }
            }}
            helperText={
              registrationMode && password.length > 0 ? 
                (password.length < 12 ? `${password.length}/12 characters minimum` :
                 password.length < 16 ? `${password.length} characters (16+ recommended)` :
                 `${password.length} characters (strong password)`) : ''
            }
          />
          {registrationMode && (
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                mt: password.length > 0 ? 3.5 : 1,
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              NIST 800-63B recommends a passphrase of 12 chars or more
            </Typography>
          )}
        </Box>
        
        {/* Progressive registration flow */}
        {registrationMode ? (
          // Registration mode - show confirm password and username fields
          <>
            <Box sx={{ mb: 4, mt: 4 }}>
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
                placeholder="Confirm your password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={password.length < 12}
                error={confirmPassword && password !== confirmPassword}
                variant="outlined"
                InputProps={{
                  sx: { 
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: confirmPassword && password !== confirmPassword ? 'error.main' : 'divider'
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
                helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
              />
            </Box>
            
            {/* Show username field when passwords match */}
            {password && confirmPassword && password === confirmPassword && (
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
                  Choose a Username *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Pick a unique username"
                  name="newUsername"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  autoComplete="username"
                  error={newUsernameAvailable === false}
                  variant="outlined"
                  InputProps={{
                    sx: { 
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: newUsernameAvailable === false ? 'error.main' : 'divider'
                      }
                    },
                    endAdornment: checkingNewUsername ? (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ) : null
                  }}
                  FormHelperTextProps={{
                    sx: { 
                      position: 'absolute',
                      bottom: -22,
                      mx: 0
                    }
                  }}
                  helperText={
                    newUsername.length > 0 && newUsername.length < 3 ? 'Must be at least 3 characters' :
                    newUsernameAvailable === false ? 'Username is already taken' : ''
                  }
                />
              </Box>
            )}
            
            {/* Show register button when all conditions are met */}
            {password && confirmPassword && password === confirmPassword && 
             newUsername && newUsername.length >= 3 && newUsernameAvailable && (
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || checkingNewUsername}
                sx={{ 
                  mb: 3,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px',
                  backgroundColor: '#5cb85c',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#4cae4c'
                  },
                  '&:disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#999'
                  }
                }}
              >
                {loading ? 'CREATING ACCOUNT...' : 'REGISTER USER'}
              </Button>
            )}
            
            {/* Cancel registration button */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  setRegistrationMode(false);
                  setConfirmPassword('');
                  setNewUsername('');
                  setNewUsernameAvailable(null);
                  setError('');
                }}
                sx={{ 
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Cancel registration
              </Link>
            </Box>
          </>
        ) : userExists === false ? (
          // No account found state
          <Box sx={{ mb: 4, mt: 4 }}>
            <Alert 
              severity="info" 
              icon={false}
              sx={{ 
                bgcolor: '#f5f5f5',
                border: '1px solid #e0e0e0',
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center',
                  py: 1
                }
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No account found with this username/email. Would you like to create one?
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={(e) => {
                e.preventDefault();
                setRegistrationMode(true);
              }}
              sx={{ 
                mt: 2,
                py: 1.5,
                borderColor: '#f0ad4e',
                color: '#f0ad4e',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                '&:hover': {
                  borderColor: '#ec971f',
                  backgroundColor: 'rgba(240, 173, 78, 0.04)'
                }
              }}
            >
              CREATE NEW ACCOUNT
            </Button>
          </Box>
        ) : userExists !== null && !password ? (
          // Account exists but no password entered
          <Alert 
            severity="info" 
            icon={false}
            sx={{ 
              mb: 4,
              mt: 4,
              bgcolor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'center',
                py: 1
              }
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Please enter your password
            </Typography>
          </Alert>
        ) : (
          // Account exists and password entered - show login button
          <>
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || checkingUser || !username || !password}
              sx={{ 
                mb: 3,
                py: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
                backgroundColor: '#f0ad4e',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#ec971f'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#999'
                }
              }}
            >
              {loading ? 'SIGNING IN...' : 
               checkingUser ? 'CHECKING...' : 
               'SIGN IN'}
            </Button>
          </>
        )}
        
        {emailConfigured && userExists !== false && !registrationMode && (
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
                onForgotPasswordClick?.();
              }}
              sx={{ 
                color: '#f0ad4e',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Forgot password?
            </Link>
          </Box>
        )}
      </form>
    </Paper>
  );
}
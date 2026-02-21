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
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { logger } from '../../lib/AccountsLogger';
import { useDevAutoLogin } from '../hooks/useDevAutoLogin';

export function LoginForm({ onSuccess, onSignupClick, onForgotPasswordClick, isDark = false }) {
  // Theme-aware colors
  const cardBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const inputBorderColor = isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)';

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
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
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

  // Handle 2FA code submission
  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const code = twoFactorCode.trim();
    if (!code) {
      setError('Please enter a code.');
      setLoading(false);
      return;
    }

    try {
      if (useBackupCode) {
        // Use backup code for login
        await new Promise((resolve, reject) => {
          Meteor.call('accounts.useBackupCodeForLogin', username, password, code, function(error, result) {
            if (error) {
              reject(error);
            } else {
              // Re-login with password after backup code is consumed
              Meteor.loginWithPassword(username, password, function(loginError) {
                if (loginError) {
                  reject(loginError);
                } else {
                  resolve();
                }
              });
            }
          });
        });
      } else {
        // Use TOTP code
        await new Promise((resolve, reject) => {
          Meteor.loginWithPasswordAnd2faCode(username, password, code, function(error) {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      logger.info('2FA login successful');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      logger.error('2FA verification failed:', err);
      if (err.error === 'invalid-2fa-code') {
        setError('Invalid code. Please try again.');
      } else {
        setError(err.reason || err.message || 'Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

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

        // Check if 2FA is required
        if (err.error === 'no-2fa-code') {
          logger.info('2FA required for this account');
          setTwoFactorRequired(true);
          setLoading(false);
          logger.groupEnd();
          return;
        }

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
      <Box sx={{ mb: 4 }}>
        <ToggleButtonGroup
          fullWidth
          value={registrationMode ? 'signup' : 'signin'}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              if (newValue === 'signup') {
                setRegistrationMode(true);
                setError('');
              } else {
                setRegistrationMode(false);
                setConfirmPassword('');
                setNewUsername('');
                setNewUsernameAvailable(null);
                setError('');
              }
            }
          }}
          sx={{
            '& .MuiToggleButtonGroup-grouped': {
              border: '1px solid',
              borderColor: 'divider',
              px: 4,
              py: 1,
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '0.5px',
              textTransform: 'none',
              color: cardTextColor,
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
                color: cardTextColor,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              },
              '&:first-of-type': {
                borderRadius: '8px 0 0 8px',
              },
              '&:last-of-type': {
                borderRadius: '0 8px 8px 0',
              },
            }
          }}
        >
          <ToggleButton value="signin">Sign In</ToggleButton>
          <ToggleButton value="signup">Sign Up</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
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
            {registrationMode ? 'Email *' : 'Username or Email *'}
          </Typography>
          <TextField
            fullWidth
            placeholder={registrationMode ? 'Enter your email' : 'Enter username or email'}
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
            error={!registrationMode && userExists === false}
            variant="outlined"
            InputProps={{
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: !registrationMode && userExists === false ? 'error.main' : 'divider'
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
            helperText={!registrationMode && userExists === false ? 'No account found with this username/email' : ''}
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
                    (password.length >= 16 ? 'success.main' : 
                     password.length >= 12 ? 'warning.main' : 
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
                  (password.length >= 16 ? 'success.main' : 
                   password.length >= 12 ? 'warning.main' : 
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
                color="primary"
                size="large"
                disabled={loading || checkingNewUsername}
                sx={{ 
                  mb: 3,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
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
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
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
              color="secondary"
              size="large"
              onClick={(e) => {
                e.preventDefault();
                setRegistrationMode(true);
              }}
              sx={{ 
                mt: 2,
                py: 1.5,
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.5px'
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
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
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
              color="primary"
              size="large"
              disabled={loading || checkingUser || !username || !password}
              sx={{ 
                mb: 3,
                py: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.5px'
              }}
            >
              {loading ? 'SIGNING IN...' : 
               checkingUser ? 'CHECKING...' : 
               'SIGN IN'}
            </Button>
          </>
        )}
        
        {/* Two-Factor Authentication step */}
        {twoFactorRequired && !registrationMode && (
          <Box sx={{ mb: 3, mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              {useBackupCode
                ? 'Enter one of your backup codes to sign in.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </Alert>
            <form onSubmit={handleTwoFactorSubmit}>
              <Box sx={{ mb: 3 }}>
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
                  {useBackupCode ? 'Backup Code *' : 'Authentication Code *'}
                </Typography>
                <TextField
                  fullWidth
                  placeholder={useBackupCode ? 'Enter backup code' : 'Enter 6-digit code'}
                  value={twoFactorCode}
                  onChange={(e) => {
                    if (useBackupCode) {
                      setTwoFactorCode(e.target.value.slice(0, 8));
                    } else {
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }
                  }}
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  inputProps={{
                    inputMode: useBackupCode ? 'text' : 'numeric',
                    pattern: useBackupCode ? undefined : '[0-9]*',
                    maxLength: useBackupCode ? 8 : 6,
                    style: {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '0.3em',
                      fontFamily: 'monospace'
                    }
                  }}
                  variant="outlined"
                />
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || (!useBackupCode && twoFactorCode.length !== 6) || (useBackupCode && twoFactorCode.length === 0)}
                sx={{
                  mb: 2,
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                {loading ? 'VERIFYING...' : 'VERIFY'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={(e) => {
                    e.preventDefault();
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  sx={{
                    color: 'secondary.main',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
                </Link>
              </Box>
            </form>
          </Box>
        )}

        {emailConfigured && userExists !== false && !registrationMode && !twoFactorRequired && (
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
                color: 'secondary.main',
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
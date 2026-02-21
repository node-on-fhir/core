// imports/accounts/client/pages/TwoFactorSetupPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';
import {
  Box,
  Container,
  Typography,
  Alert,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

export function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [step, setStep] = useState('check'); // check | setup | verify | backup | enabled
  const [qrSvg, setQrSvg] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  const appName = get(Meteor, 'settings.public.appName', 'Honeycomb EHR');

  // Check current 2FA status on mount
  useEffect(() => {
    if (typeof Accounts.has2faEnabled === 'function') {
      Accounts.has2faEnabled(function(error, isEnabled) {
        setLoading(false);
        if (error) {
          console.error('[TwoFactorSetupPage] Error checking 2FA status:', error);
          setError('Failed to check two-factor authentication status.');
          setStep('check');
          return;
        }
        setTwoFactorEnabled(isEnabled);
        setStep(isEnabled ? 'enabled' : 'setup');
      });
    } else {
      // accounts-2fa package may not be installed
      setLoading(false);
      setError('Two-factor authentication is not available. The accounts-2fa package may not be installed.');
      setStep('check');
    }
  }, []);

  function handleGenerateQR() {
    setError('');
    setLoading(true);

    Accounts.generate2faActivationQrCode(appName, function(error, result) {
      setLoading(false);
      if (error) {
        console.error('[TwoFactorSetupPage] Error generating QR code:', error);
        setError('Failed to generate QR code. Please try again.');
        return;
      }

      setQrSvg(get(result, 'svg', ''));
      setSecret(get(result, 'secret', ''));
      setStep('verify');
    });
  }

  function handleVerifyCode(e) {
    e.preventDefault();
    setError('');

    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a 6-digit code from your authenticator app.');
      return;
    }

    setLoading(true);

    Accounts.enableUser2fa(verifyCode, function(error) {
      if (error) {
        setLoading(false);
        console.error('[TwoFactorSetupPage] Error enabling 2FA:', error);
        if (error.error === 'invalid-2fa-code') {
          setError('Invalid code. Please check your authenticator app and try again.');
        } else {
          setError(error.reason || 'Failed to enable two-factor authentication.');
        }
        return;
      }

      console.log('[TwoFactorSetupPage] 2FA enabled successfully');
      setTwoFactorEnabled(true);

      // Generate backup codes
      Meteor.call('accounts.generateBackupCodes', function(backupError, codes) {
        setLoading(false);
        if (backupError) {
          console.error('[TwoFactorSetupPage] Error generating backup codes:', backupError);
          // 2FA is still enabled, just no backup codes
          setStep('enabled');
          return;
        }

        setBackupCodes(codes);
        setStep('backup');
      });
    });
  }

  function handleDisable2fa() {
    setDisableDialogOpen(false);
    setError('');
    setLoading(true);

    Accounts.disableUser2fa(function(error) {
      setLoading(false);
      if (error) {
        console.error('[TwoFactorSetupPage] Error disabling 2FA:', error);
        setError(error.reason || 'Failed to disable two-factor authentication.');
        return;
      }

      console.log('[TwoFactorSetupPage] 2FA disabled successfully');
      setTwoFactorEnabled(false);
      setStep('setup');
      setQrSvg('');
      setSecret('');
      setVerifyCode('');
      setBackupCodes([]);
    });
  }

  if (loading && step === 'check') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ pt: 8, pb: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Checking two-factor authentication status...
          </Typography>
        </Box>
      </Container>
    );
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
            Two-Factor Authentication
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step: Setup (2FA not enabled) */}
          {step === 'setup' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4 }}
              >
                Add an extra layer of security to your account by enabling
                two-factor authentication with an authenticator app.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateQR}
                disabled={loading}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'inherit' }} /> : 'Enable 2FA'}
              </Button>
            </Box>
          )}

          {/* Step: Verify (QR code displayed, waiting for code) */}
          {step === 'verify' && (
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: 'center' }}
              >
                Scan the QR code below with your authenticator app
                (Google Authenticator, Authy, etc.), then enter the 6-digit
                code to verify.
              </Typography>

              {/* QR Code */}
              {qrSvg && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 3,
                    '& svg': {
                      width: 200,
                      height: 200
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              )}

              {/* Manual entry secret */}
              {secret && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}
                  >
                    Or enter this code manually:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      fontWeight: 600,
                      backgroundColor: 'action.hover',
                      p: 1.5,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                      userSelect: 'all'
                    }}
                  >
                    {secret}
                  </Typography>
                </Box>
              )}

              {/* Verification code input */}
              <form onSubmit={handleVerifyCode}>
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
                    Verification Code *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter 6-digit code"
                    value={verifyCode}
                    onChange={(e) => {
                      // Only allow digits, max 6
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerifyCode(val);
                    }}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      maxLength: 6,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        letterSpacing: '0.5em',
                        fontFamily: 'monospace'
                      }
                    }}
                    variant="outlined"
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || verifyCode.length !== 6}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    letterSpacing: '0.5px'
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'inherit' }} /> : 'Verify & Enable'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  onClick={() => {
                    setStep('setup');
                    setQrSvg('');
                    setSecret('');
                    setVerifyCode('');
                    setError('');
                  }}
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </form>
            </Box>
          )}

          {/* Step: Backup codes */}
          {step === 'backup' && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Two-factor authentication has been enabled.
              </Alert>

              <Alert severity="warning" sx={{ mb: 3 }}>
                Save these backup codes in a safe place. Each code can only
                be used once. If you lose access to your authenticator app,
                you can use a backup code to sign in.
              </Alert>

              <Box
                sx={{
                  backgroundColor: 'action.hover',
                  p: 3,
                  borderRadius: 1,
                  mb: 3,
                  fontFamily: 'monospace'
                }}
              >
                {backupCodes.map(function(code, index) {
                  return (
                    <Typography
                      key={index}
                      variant="body1"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        py: 0.5,
                        textAlign: 'center',
                        userSelect: 'all'
                      }}
                    >
                      {code}
                    </Typography>
                  );
                })}
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={() => setStep('enabled')}
                sx={{
                  py: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                I've Saved My Backup Codes
              </Button>
            </Box>
          )}

          {/* Step: Enabled (2FA already active) */}
          {step === 'enabled' && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Two-factor authentication is enabled on your account.
              </Alert>

              <Button
                variant="outlined"
                color="error"
                size="large"
                onClick={() => setDisableDialogOpen(true)}
                sx={{
                  py: 1.5,
                  px: 4,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  letterSpacing: '0.5px'
                }}
              >
                Disable 2FA
              </Button>
            </Box>
          )}

          {/* Back to settings link */}
          <Box sx={{
            textAlign: 'center',
            pt: 3,
            mt: 3,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              variant="text"
              onClick={() => navigate('/')}
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Disable 2FA confirmation dialog */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)}>
        <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            This will remove the extra layer of security from your account.
            You will only need your password to sign in.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDisable2fa} color="error" variant="contained">
            Disable 2FA
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

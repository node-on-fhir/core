// packages/multi-factor-auth/client/pages/MFASetupPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton
} from '@mui/material';

import {
  Security as SecurityIcon,
  PhoneAndroid as PhoneIcon,
  Key as KeyIcon,
  QrCode as QRIcon,
  Backup as BackupIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Warning as WarningIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';
import moment from 'moment';

import { MFACore, DefaultMFAPolicies } from '../../lib/MFACore';

// Shared components
let DynamicSpacer;

Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
});

export function MFASetupPage(props) {
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('totp');
  const [secretData, setSecretData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [mfaPolicy, setMfaPolicy] = useState(DefaultMFAPolicies.roleBasedStandard);

  // Current user data
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Current MFA status
  const mfaStatus = useTracker(function() {
    if (currentUser) {
      return {
        totpEnabled: get(currentUser, 'mfa.totp.enabled', false),
        backupEnabled: get(currentUser, 'mfa.backup.enabled', false),
        lastSetup: get(currentUser, 'mfa.lastSetup'),
        isRequired: MFACore.requiresMFA(currentUser, mfaPolicy)
      };
    }
    return null;
  }, [currentUser, mfaPolicy]);

  useEffect(function() {
    if (currentUser && !secretData && selectedMethod === 'totp') {
      generateNewSecret();
    }
  }, [currentUser, selectedMethod]);

  function generateNewSecret() {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userInfo = {
        name: get(currentUser, 'profile.name.text') || currentUser.username,
        email: get(currentUser, 'emails[0].address')
      };
      
      const secret = MFACore.generateSecret(userInfo);
      setSecretData(secret);
      
      // Generate backup codes
      const codes = MFACore.generateBackupCodes(8);
      setBackupCodes(codes);
    } catch (err) {
      console.error('Error generating MFA secret:', err);
      setError('Failed to generate authentication secret');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyAndSave() {
    if (!verificationCode || !secretData) {
      setError('Please enter the verification code');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Verify the code
      const isValid = MFACore.verifyToken(secretData.secret, verificationCode);
      
      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setIsSaving(false);
        return;
      }

      // Save MFA configuration
      const result = await Meteor.callAsync('mfa.setupTOTP', {
        secret: secretData.secret,
        verificationCode: verificationCode,
        backupCodes: backupCodes
      });

      if (result.success) {
        setSuccess('Multi-factor authentication has been successfully configured!');
        setActiveStep(2); // Move to success step
        
        // Show backup codes dialog
        setTimeout(() => {
          setShowBackupDialog(true);
        }, 1000);
      } else {
        setError(result.error || 'Failed to configure MFA');
      }
    } catch (err) {
      console.error('Error setting up MFA:', err);
      setError('Failed to configure MFA: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopySecret() {
    if (secretData && navigator.clipboard) {
      navigator.clipboard.writeText(secretData.manualEntryKey);
      setSuccess('Secret key copied to clipboard');
    }
  }

  function handleDownloadBackupCodes() {
    const formattedCodes = MFACore.formatBackupCodes(backupCodes);
    const content = `Honeycomb Healthcare - Backup Recovery Codes
Generated: ${moment().format('MMMM D, YYYY [at] h:mm A')}
User: ${get(currentUser, 'profile.name.text') || currentUser.username}

IMPORTANT: Store these codes safely. Each code can only be used once.

${formattedCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

These codes can be used to access your account if you lose access to your authenticator app.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `honeycomb-backup-codes-${moment().format('YYYY-MM-DD')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const steps = ['Choose Method', 'Configure & Verify', 'Backup Codes'];

  const mfaMethods = [
    {
      value: 'totp',
      label: 'Authenticator App (Recommended)',
      description: 'Use apps like Google Authenticator, Authy, or Microsoft Authenticator',
      icon: <PhoneIcon />,
      supported: true
    },
    {
      value: 'sms',
      label: 'SMS Text Message',
      description: 'Receive codes via text message (requires phone number)',
      icon: <SecurityIcon />,
      supported: false // Not implemented yet
    }
  ];

  return (
    <Container id="mfaSetupPage" maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon />
              <Typography variant="h5">
                Multi-Factor Authentication Setup
              </Typography>
            </Box>
          }
          subheader="ONC 170.315(d)(13) - Enhance your account security"
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* MFA Policy Information */}
          {mfaStatus?.isRequired && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Multi-Factor Authentication Required</Typography>
              Your account role requires MFA to be enabled for security compliance.
            </Alert>
          )}

          {/* Current Status */}
          {mfaStatus && (mfaStatus.totpEnabled || mfaStatus.backupEnabled) && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckIcon />
                <Box>
                  <Typography variant="subtitle1">MFA Already Configured</Typography>
                  <Typography variant="body2">
                    Last setup: {moment(mfaStatus.lastSetup).format('MMMM D, YYYY')}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Choose Method */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose Authentication Method
              </Typography>
              
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                >
                  <Grid container spacing={2}>
                    {mfaMethods.map((method) => (
                      <Grid item xs={12} key={method.value}>
                        <Paper
                          sx={{
                            p: 2,
                            border: selectedMethod === method.value ? 2 : 1,
                            borderColor: selectedMethod === method.value ? 'primary.main' : 'divider',
                            cursor: method.supported ? 'pointer' : 'not-allowed',
                            opacity: method.supported ? 1 : 0.5
                          }}
                          onClick={() => method.supported && setSelectedMethod(method.value)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                              value={method.value}
                              control={<Radio />}
                              disabled={!method.supported}
                              label={
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {method.icon}
                                    <Typography variant="subtitle1">{method.label}</Typography>
                                    {!method.supported && (
                                      <Chip label="Coming Soon" size="small" />
                                    )}
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {method.description}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  disabled={!selectedMethod || !mfaMethods.find(m => m.value === selectedMethod)?.supported}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Configure & Verify */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Configure Authenticator App
              </Typography>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Generating security codes...</Typography>
                </Box>
              ) : secretData ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Scan QR Code
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                        <QRIcon sx={{ fontSize: 120, color: 'grey.600' }} />
                        <Typography variant="caption" display="block" color="text.secondary">
                          QR Code would display here
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                          {secretData.qrCodeUrl.substring(0, 50)}...
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Scan this QR code with your authenticator app
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Manual Entry
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        If you can't scan the QR code, enter this key manually:
                      </Typography>
                      <TextField
                        fullWidth
                        value={secretData.manualEntryKey}
                        InputProps={{
                          readOnly: true,
                          type: showSecret ? 'text' : 'password',
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowSecret(!showSecret)}>
                                {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                              <IconButton onClick={handleCopySecret}>
                                <CopyIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
                        }}
                        sx={{ mb: 2 }}
                      />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Enter Verification Code
                      </Typography>
                      <TextField
                        fullWidth
                        label="6-digit code from your app"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        placeholder="123456"
                        inputProps={{ 
                          maxLength: 6,
                          style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }
                        }}
                        helperText="Enter the 6-digit code shown in your authenticator app"
                      />
                    </Paper>
                  </Grid>
                </Grid>
              ) : null}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(0)}
                  disabled={isSaving}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerifyAndSave}
                  disabled={isSaving || !verificationCode || verificationCode.length !== 6}
                  startIcon={isSaving ? <CircularProgress size={20} /> : <CheckIcon />}
                >
                  {isSaving ? 'Verifying...' : 'Verify & Enable MFA'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Success & Backup Codes */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Multi-Factor Authentication Enabled!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your account is now protected with multi-factor authentication.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Important: Save Your Backup Codes
                </Typography>
                <Typography variant="body2">
                  Make sure to download and securely store your backup recovery codes. 
                  You'll need them if you lose access to your authenticator app.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackupIcon />}
                  onClick={() => setShowBackupDialog(true)}
                >
                  View Backup Codes
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/account-security')}
                >
                  Continue to Account Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Dialog */}
      <Dialog
        open={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon />
            Backup Recovery Codes
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Save These Codes Safely</Typography>
            <Typography variant="body2">
              Each code can only be used once. Store them in a secure location.
            </Typography>
          </Alert>
          
          <Grid container spacing={1}>
            {MFACore.formatBackupCodes(backupCodes).map((code, index) => (
              <Grid item xs={6} key={index}>
                <Paper 
                  sx={{ 
                    p: 1, 
                    textAlign: 'center', 
                    fontFamily: 'monospace',
                    bgcolor: 'grey.50'
                  }}
                >
                  {code}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadBackupCodes}
          >
            Download Codes
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowBackupDialog(false)}
          >
            I've Saved Them
          </Button>
        </DialogActions>
      </Dialog>

      <DynamicSpacer />
    </Container>
  );
}
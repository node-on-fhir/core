// packages/multi-factor-auth/client/pages/MFAManagementPage.jsx

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
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';

import {
  Security as SecurityIcon,
  PhoneAndroid as PhoneIcon,
  Backup as BackupIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
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

export function MFAManagementPage(props) {
  const navigate = useNavigate();
  
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Current user data
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // MFA status and configuration
  const mfaConfig = useTracker(function() {
    if (currentUser) {
      return {
        totpEnabled: get(currentUser, 'mfa.totp.enabled', false),
        totpSetupDate: get(currentUser, 'mfa.totp.setupDate'),
        backupEnabled: get(currentUser, 'mfa.backup.enabled', false),
        backupCodesRemaining: get(currentUser, 'mfa.backup.codesRemaining', 0),
        lastUsed: get(currentUser, 'mfa.lastUsed'),
        isRequired: MFACore.requiresMFA(currentUser, DefaultMFAPolicies.roleBasedStandard),
        deviceCount: get(currentUser, 'mfa.devices', []).length
      };
    }
    return null;
  }, [currentUser]);

  useEffect(function() {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      const logs = await Meteor.callAsync('mfa.getAuditLogs', { limit: 10 });
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  }

  async function handleDisableMFA() {
    if (!confirmationCode) {
      setError('Please enter the confirmation code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Meteor.callAsync('mfa.disable', {
        confirmationCode: confirmationCode
      });

      if (result.success) {
        setSuccess('Multi-factor authentication has been disabled');
        setShowDisableDialog(false);
        setConfirmationCode('');
      } else {
        setError(result.error || 'Failed to disable MFA');
      }
    } catch (err) {
      console.error('Error disabling MFA:', err);
      setError('Failed to disable MFA: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateNewBackupCodes() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await Meteor.callAsync('mfa.generateNewBackupCodes');
      
      if (result.success) {
        setNewBackupCodes(result.codes);
        setSuccess('New backup codes generated successfully');
      } else {
        setError(result.error || 'Failed to generate new backup codes');
      }
    } catch (err) {
      console.error('Error generating backup codes:', err);
      setError('Failed to generate backup codes: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadBackupCodes() {
    const formattedCodes = MFACore.formatBackupCodes(newBackupCodes);
    const content = `Honeycomb Healthcare - Backup Recovery Codes
Generated: ${moment().format('MMMM D, YYYY [at] h:mm A')}
User: ${get(currentUser, 'profile.name.text') || currentUser.username}

IMPORTANT: Store these codes safely. Each code can only be used once.
These codes replace any previously generated backup codes.

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

  return (
    <Container id="mfaManagementPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SecurityIcon />
              <Typography variant="h5">
                Multi-Factor Authentication Management
              </Typography>
            </Box>
          }
          subheader="ONC 170.315(d)(13) - Manage your account security settings"
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* MFA Status Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Security Status</Typography>
                </Box>
                
                {mfaConfig?.totpEnabled ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckIcon color="success" />
                      <Typography variant="subtitle1">MFA Enabled</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Configured: {moment(mfaConfig.totpSetupDate).format('MMMM D, YYYY')}
                    </Typography>
                    {mfaConfig.lastUsed && (
                      <Typography variant="body2" color="text.secondary">
                        Last used: {moment(mfaConfig.lastUsed).fromNow()}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WarningIcon color="warning" />
                      <Typography variant="subtitle1">MFA Not Configured</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Your account is not protected with multi-factor authentication
                    </Typography>
                  </Box>
                )}

                {mfaConfig?.isRequired && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    MFA is required for your account role
                  </Alert>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BackupIcon color="primary" />
                  <Typography variant="h6">Backup Codes</Typography>
                </Box>
                
                {mfaConfig?.backupEnabled ? (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {mfaConfig.backupCodesRemaining} codes remaining
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Backup codes allow account recovery if you lose your authenticator
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No backup codes configured
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* MFA Configuration Options */}
          <Typography variant="h6" gutterBottom>
            Configuration Options
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <PhoneIcon />
              </ListItemIcon>
              <ListItemText
                primary="Authenticator App"
                secondary={mfaConfig?.totpEnabled ? 
                  `Configured on ${moment(mfaConfig.totpSetupDate).format('MMMM D, YYYY')}` :
                  'Time-based one-time passwords using an authenticator app'
                }
              />
              <ListItemSecondaryAction>
                {mfaConfig?.totpEnabled ? (
                  <Chip
                    label="Enabled"
                    color="success"
                    icon={<CheckIcon />}
                  />
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/mfa-setup')}
                  >
                    Setup
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemIcon>
                <BackupIcon />
              </ListItemIcon>
              <ListItemText
                primary="Backup Recovery Codes"
                secondary={`${mfaConfig?.backupCodesRemaining || 0} codes remaining - Use if you lose your authenticator`}
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowBackupCodesDialog(true)}
                    disabled={!mfaConfig?.totpEnabled}
                  >
                    Generate New
                  </Button>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          {/* Security Actions */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Security Actions
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<HistoryIcon />}
                  onClick={() => setShowAuditDialog(true)}
                >
                  View Activity Log
                </Button>
              </Grid>
              
              {mfaConfig?.totpEnabled && !mfaConfig?.isRequired && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<CancelIcon />}
                    onClick={() => setShowDisableDialog(true)}
                  >
                    Disable MFA
                  </Button>
                </Grid>
              )}
              
              {!mfaConfig?.totpEnabled && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/mfa-setup')}
                  >
                    Enable MFA
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>

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

      {/* Disable MFA Dialog */}
      <Dialog
        open={showDisableDialog}
        onClose={() => setShowDisableDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Disable Multi-Factor Authentication
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Security Warning</Typography>
            <Typography variant="body2">
              Disabling MFA will make your account less secure. You'll only need your password to log in.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Enter confirmation code from authenticator"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
            placeholder="123456"
            helperText="Enter the 6-digit code from your authenticator app to confirm"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisableDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDisableMFA}
            disabled={isLoading || confirmationCode.length !== 6}
          >
            {isLoading ? 'Disabling...' : 'Disable MFA'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog
        open={showBackupCodesDialog}
        onClose={() => setShowBackupCodesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BackupIcon />
            Generate New Backup Codes
          </Box>
        </DialogTitle>
        <DialogContent>
          {newBackupCodes.length === 0 ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Generate New Backup Codes</Typography>
                <Typography variant="body2">
                  This will create 8 new backup codes and invalidate any previously generated codes.
                </Typography>
              </Alert>
              
              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateNewBackupCodes}
                disabled={isLoading}
                startIcon={isLoading ? undefined : <RefreshIcon />}
              >
                {isLoading ? 'Generating...' : 'Generate New Codes'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">Save These Codes Safely</Typography>
                <Typography variant="body2">
                  Each code can only be used once. Store them in a secure location.
                </Typography>
              </Alert>
              
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {MFACore.formatBackupCodes(newBackupCodes).map((code, index) => (
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
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={handleDownloadBackupCodes}
              >
                Download Codes
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowBackupCodesDialog(false);
            setNewBackupCodes([]);
          }}>
            {newBackupCodes.length > 0 ? "I've Saved Them" : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog
        open={showAuditDialog}
        onClose={() => setShowAuditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            MFA Activity Log
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {moment(log.timestamp).format('MM/DD/YYYY HH:mm')}
                    </TableCell>
                    <TableCell>{log.event}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={log.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {auditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No activity logs available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAuditDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <DynamicSpacer />
    </Container>
  );
}
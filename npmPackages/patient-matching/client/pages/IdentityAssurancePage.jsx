// packages/patient-matching/client/pages/IdentityAssurancePage.jsx
import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Collapse
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const log = (Meteor.Logger ? Meteor.Logger.for('IdentityAssurancePage') : console);

export default function IdentityAssurancePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [patientId, setPatientId] = useState('');
  const [verificationLevel, setVerificationLevel] = useState('basic');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [providerStatus, setProviderStatus] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  const steps = ['Select Patient', 'Choose Verification Level', 'Verify Identity', 'View Results'];

  // Load available patients and check provider status when component mounts
  useEffect(() => {
    loadAvailablePatients();
    checkProviderStatus();
  }, []);

  const checkProviderStatus = async () => {
    try {
      const status = await Meteor.rpc('patientMatching.getProviderStatus');
      setProviderStatus(status);
      console.log('Identity Provider Status:', status);
    } catch (err) {
      console.error('Error checking provider status:', err);
      setProviderStatus({
        error: err.message,
        isDevelopment: true,
        activeProvider: 'unknown'
      });
    }
  };

  const loadAvailablePatients = async () => {
    setLoadingPatients(true);
    try {
      const patients = await Meteor.rpc('patientMatching.listPatientIds');
      setAvailablePatients(patients || []);
      log.phi('Available patients', patients, { action: 'search' });
    } catch (err) {
      console.error('Error loading patients:', err); // phi-audit: ok
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    
    try {
      const result = await Meteor.rpc('patientMatching.verifyIdentity', {
        options: {
          patientId: patientId,
          level: verificationLevel
        }
      });
      
      setVerificationResult(result);
      handleNext();
    } catch (err) {
      console.error('Error verifying identity:', err);
      setError(err.message || 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const getIALColor = (level) => {
    switch (level) {
      case 'IAL3':
        return 'success';
      case 'IAL2':
        return 'warning';
      case 'IAL1':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select or Enter Patient ID
              </Typography>
              
              <TextField
                fullWidth
                label="Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Enter patient ID to verify"
                sx={{ mb: 2 }}
              />
              
              {loadingPatients && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Loading available patients...
                </Typography>
              )}
              
              {availablePatients.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Or select from available patients:
                  </Typography>
                  <List dense sx={{ 
                    maxHeight: 300, 
                    overflow: 'auto', 
                    border: 1, 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    bgcolor: theme => theme.palette.background.paper 
                  }}>
                    {availablePatients.map((patient) => (
                      <ListItem 
                        key={patient._id} 
                        button 
                        onClick={() => setPatientId(patient.id || patient._id)}
                        selected={patientId === (patient.id || patient._id)}
                      >
                        <ListItemText 
                          primary={patient.name}
                          secondary={`ID: ${patient.id || patient._id} | Birth: ${patient.birthDate || 'Unknown'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                  disabled={!patientId}
                >
                  Next
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
        
      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Verification Level
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card 
                    variant={verificationLevel === 'basic' ? 'elevation' : 'outlined'}
                    sx={{ cursor: 'pointer', bgcolor: verificationLevel === 'basic' ? 'action.selected' : '' }}
                    onClick={() => setVerificationLevel('basic')}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary">Basic</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Demographics verification only
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    variant={verificationLevel === 'standard' ? 'elevation' : 'outlined'}
                    sx={{ cursor: 'pointer', bgcolor: verificationLevel === 'standard' ? 'action.selected' : '' }}
                    onClick={() => setVerificationLevel('standard')}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary">Standard</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Demographics + Government ID
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card 
                    variant={verificationLevel === 'enhanced' ? 'elevation' : 'outlined'}
                    sx={{ cursor: 'pointer', bgcolor: verificationLevel === 'enhanced' ? 'action.selected' : '' }}
                    onClick={() => setVerificationLevel('enhanced')}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary">Enhanced</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Standard + Biometric verification
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
        
      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verify Identity
              </Typography>
              
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  Patient ID: <strong>{patientId}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Verification Level: <strong>{verificationLevel.toUpperCase()}</strong>
                </Typography>
              </Box>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Verification Error
                  </Typography>
                  <Typography variant="body2">
                    {error}
                  </Typography>
                  {isDevelopment && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block">
                        Debug Info:
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Check that the patient exists in the database
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Ensure mock provider is enabled in settings
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Verify the patient has required demographic data
                      </Typography>
                    </Box>
                  )}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack} disabled={isVerifying}>
                  Back
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleVerify}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Identity'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
        
      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verification Results
              </Typography>
              
              {verificationResult && (
                <Box>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    {verificationResult.verified ? (
                      <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 64, color: 'error.main' }} />
                    )}
                    
                    <Typography variant="h5" sx={{ mt: 2 }}>
                      {verificationResult.verified ? 'Identity Verified' : 'Verification Failed'}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={verificationResult.assuranceLevel}
                        color={getIALColor(verificationResult.assuranceLevel)}
                      />
                      {verificationResult.isDevelopment && (
                        <Chip 
                          label="MOCK"
                          color="warning"
                          size="small"
                          sx={{ ml: 1 }}
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Verification Checks:
                  </Typography>
                  
                  <List>
                    {verificationResult.checks?.map((check, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {check.type === 'demographics' && <BadgeIcon />}
                          {check.type === 'ssn' && <BadgeIcon />}
                          {check.type === 'drivers_license' && <BadgeIcon />}
                          {check.type === 'biometric' && <FingerprintIcon />}
                          {check.type === 'two_factor' && <PhoneIphoneIcon />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={check.type.replace(/_/g, ' ').toUpperCase()}
                          secondary={check.passed ? 'Passed' : 'Failed'}
                        />
                        {check.passed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Confidence Score: {(verificationResult.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button 
                  variant="contained" 
                  onClick={() => {
                    setActiveStep(0);
                    setVerificationResult(null);
                    setPatientId('');
                    setVerificationLevel('basic');
                  }}
                >
                  Verify Another Patient
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  const isDevelopment = get(Meteor, 'settings.development.mockIdentityProvider', false) || 
                        get(providerStatus, 'isDevelopment', false);

  return (
    <Box sx={{
      minHeight: '100vh',
      py: 4
    }}>
      <Container maxWidth="md">
      {/* Development Mode Alert */}
      {isDevelopment && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 3 }}
          action={
            <Button 
              size="small" 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              endIcon={showDebugInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {showDebugInfo ? 'Hide' : 'Show'} Debug Info
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight="bold">
            Development Mode Active
          </Typography>
          <Typography variant="body2">
            Using mock identity provider for testing. Real identity providers are not configured.
          </Typography>
        </Alert>
      )}

      {/* Provider Status Information */}
      <Collapse in={showDebugInfo && isDevelopment}>
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: theme => theme.palette.mode === 'light' 
            ? theme.palette.grey[100]
            : theme.palette.background.paper
        }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Identity Provider Status
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Active Provider:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {get(providerStatus, 'activeProvider', 'Not configured')}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Available Providers:</Typography>
              <Typography variant="body2">
                {get(providerStatus, 'availableProviders', []).join(', ') || 'None'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Configuration:</Typography>
              <Typography variant="body2">
                {get(providerStatus, 'configStatus', 'Unknown')}
              </Typography>
            </Grid>
          </Grid>

          {providerStatus?.warnings && providerStatus.warnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="warning.main" fontWeight="bold">
                Warnings:
              </Typography>
              {providerStatus.warnings.map((warning, index) => (
                <Typography key={index} variant="body2" color="warning.main">
                  • {warning}
                </Typography>
              ))}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
        </Paper>
      </Collapse>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            <SecurityIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
            Identity Assurance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verify patient identity with multiple assurance levels
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </Paper>
      </Container>
    </Box>
  );
}
// imports/accounts/client/components/FirstRunSetup.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { get } from 'lodash';

const steps = ['Admin Account', 'Organization', 'Security', 'Review'];

export function FirstRunSetup({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [setupData, setSetupData] = useState({
    // Step 1: Admin Account
    adminEmail: '',
    adminPassword: '',
    adminFullName: '',
    
    // Step 2: Organization
    organizationName: '',
    organizationType: 'hospital',
    organizationAddress: '',
    
    // Step 3: Security
    enableTwoFactor: false,
    enableAuditLogging: true,
    passwordPolicy: 'standard',
    sessionTimeout: 30,
    
    // Step 4: Review
    acceptTerms: false
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setError('');
    setLoading(true);

    try {
      // TODO: Implement first run setup logic
      console.log('First run setup:', setupData);
      
      // Call server method to complete setup
      await Meteor.callAsync('accounts.completeFirstRunSetup', setupData);
      
      if (onComplete) {
        onComplete(setupData);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Create Admin Account
            </Typography>
            <TextField
              fullWidth
              label="Full Name"
              value={setupData.adminFullName}
              onChange={handleChange('adminFullName')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={setupData.adminEmail}
              onChange={handleChange('adminEmail')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={setupData.adminPassword}
              onChange={handleChange('adminPassword')}
              margin="normal"
              required
              helperText="Minimum 8 characters"
            />
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Organization Details
            </Typography>
            <TextField
              fullWidth
              label="Organization Name"
              value={setupData.organizationName}
              onChange={handleChange('organizationName')}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Organization Type</InputLabel>
              <Select
                value={setupData.organizationType}
                onChange={handleChange('organizationType')}
                label="Organization Type"
              >
                <MenuItem value="hospital">Hospital</MenuItem>
                <MenuItem value="clinic">Clinic</MenuItem>
                <MenuItem value="practice">Private Practice</MenuItem>
                <MenuItem value="research">Research Institution</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Address"
              value={setupData.organizationAddress}
              onChange={handleChange('organizationAddress')}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={setupData.enableTwoFactor}
                  onChange={handleChange('enableTwoFactor')}
                />
              }
              label="Enable two-factor authentication"
              sx={{ display: 'block', mt: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={setupData.enableAuditLogging}
                  onChange={handleChange('enableAuditLogging')}
                />
              }
              label="Enable HIPAA audit logging"
              sx={{ display: 'block', mt: 1 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Password Policy</InputLabel>
              <Select
                value={setupData.passwordPolicy}
                onChange={handleChange('passwordPolicy')}
                label="Password Policy"
              >
                <MenuItem value="basic">Basic (8+ characters)</MenuItem>
                <MenuItem value="standard">Standard (Complex passwords)</MenuItem>
                <MenuItem value="strict">Strict (NIST compliant)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Session Timeout (minutes)"
              type="number"
              value={setupData.sessionTimeout}
              onChange={handleChange('sessionTimeout')}
              margin="normal"
              inputProps={{ min: 5, max: 480 }}
            />
          </Box>
        );
        
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Complete Setup
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Admin Account
              </Typography>
              <Typography variant="body2">
                {setupData.adminFullName} ({setupData.adminEmail})
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Organization
              </Typography>
              <Typography variant="body2">
                {setupData.organizationName} - {setupData.organizationType}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Security
              </Typography>
              <Typography variant="body2">
                Two-Factor: {setupData.enableTwoFactor ? 'Enabled' : 'Disabled'}<br />
                Audit Logging: {setupData.enableAuditLogging ? 'Enabled' : 'Disabled'}<br />
                Password Policy: {setupData.passwordPolicy}<br />
                Session Timeout: {setupData.sessionTimeout} minutes
              </Typography>
            </Paper>
            <FormControlLabel
              control={
                <Checkbox
                  checked={setupData.acceptTerms}
                  onChange={handleChange('acceptTerms')}
                />
              }
              label="I accept the terms and conditions"
              sx={{ mt: 3 }}
            />
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        Welcome to Honeycomb
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph align="center">
        Let's set up your system
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {renderStepContent(activeStep)}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleComplete}
            disabled={!setupData.acceptTerms || loading}
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
          >
            Next
          </Button>
        )}
      </Box>
    </Paper>
  );
}
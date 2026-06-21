// packages/healthcare-surveys/client/components/surveys/SurveySubmissionForm.jsx

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export default function SurveySubmissionForm(props) {
  const { 
    onSubmit, 
    patientId,
    encounterId,
    encounterTypes = ['emergency', 'inpatient', 'ambulatory'],
    onCancel
  } = props;
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    encounterType: '',
    reportingPeriod: {
      start: moment().subtract(1, 'month').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD')
    },
    endpoint: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  const steps = ['Select Encounter Type', 'Configure Reporting', 'Review & Submit'];
  
  const handleChange = function(field) {
    return function(event) {
      const value = event.target.value;
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Clear field error
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };
  };
  
  const handlePeriodChange = function(field) {
    return function(event) {
      const value = event.target.value;
      setFormData(prev => ({
        ...prev,
        reportingPeriod: {
          ...prev.reportingPeriod,
          [field]: value
        }
      }));
    };
  };
  
  const validateStep = function(step) {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.encounterType) {
          newErrors.encounterType = 'Encounter type is required';
        }
        break;
      case 1:
        if (!formData.endpoint) {
          newErrors.endpoint = 'Endpoint URL is required';
        }
        if (!formData.reportingPeriod.start) {
          newErrors.periodStart = 'Start date is required';
        }
        if (!formData.reportingPeriod.end) {
          newErrors.periodEnd = 'End date is required';
        }
        if (moment(formData.reportingPeriod.start).isAfter(formData.reportingPeriod.end)) {
          newErrors.periodEnd = 'End date must be after start date';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = function() {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };
  
  const handleBack = function() {
    setActiveStep(prev => prev - 1);
  };
  
  const handleSubmit = async function() {
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const submission = {
        patientId,
        encounterId,
        encounterType: formData.encounterType,
        reportingPeriod: formData.reportingPeriod,
        endpoint: formData.endpoint,
        notes: formData.notes,
        submittedAt: new Date()
      };
      
      if (onSubmit) {
        await onSubmit(submission);
      }
      
      setSubmitResult({
        success: true,
        message: 'Survey report submitted successfully'
      });
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error.message || 'Failed to submit survey report'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderStepContent = function(step) {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" paragraph>
              Select the type of encounter for this healthcare survey report.
            </Typography>
            <FormControl fullWidth error={!!errors.encounterType}>
              <InputLabel>Encounter Type</InputLabel>
              <Select
                value={formData.encounterType}
                onChange={handleChange('encounterType')}
                label="Encounter Type"
              >
                {encounterTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              {errors.encounterType && (
                <Typography variant="caption" color="error">
                  {errors.encounterType}
                </Typography>
              )}
            </FormControl>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Typography variant="body2" paragraph>
              Configure the reporting parameters for submission.
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Endpoint URL"
                value={formData.endpoint}
                onChange={handleChange('endpoint')}
                error={!!errors.endpoint}
                helperText={errors.endpoint}
                placeholder="https://example.com/fhir/Bundle"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                type="date"
                label="Period Start"
                value={formData.reportingPeriod.start}
                onChange={handlePeriodChange('start')}
                error={!!errors.periodStart}
                helperText={errors.periodStart}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="date"
                label="Period End"
                value={formData.reportingPeriod.end}
                onChange={handlePeriodChange('end')}
                error={!!errors.periodEnd}
                helperText={errors.periodEnd}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={handleChange('notes')}
              placeholder="Any additional notes about this submission..."
            />
          </Box>
        );
        
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Submission
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Encounter Type</Typography>
              <Typography variant="body1">{formData.encounterType}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Reporting Period</Typography>
              <Typography variant="body1">
                {moment(formData.reportingPeriod.start).format('MMM D, YYYY')} - {moment(formData.reportingPeriod.end).format('MMM D, YYYY')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Endpoint</Typography>
              <Typography variant="body1">{formData.endpoint}</Typography>
            </Box>
            {formData.notes && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Notes</Typography>
                <Typography variant="body1">{formData.notes}</Typography>
              </Box>
            )}
            
            {submitResult && (
              <Alert severity={submitResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                {submitResult.message}
              </Alert>
            )}
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader title="Submit Healthcare Survey Report" />
      <CardContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {renderStepContent(activeStep)}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep > 0 && (
              <Button
                onClick={handleBack}
                disabled={submitting}
              >
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={submitting}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || (submitResult && submitResult.success)}
                startIcon={submitting && <CircularProgress size={20} />}
              >
                Submit
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
// packages/reference-app/client/ReferenceAppWorkflow.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Card,
  CardContent,
  CardHeader,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Select,
  MenuItem
} from '@mui/material';

import { get } from 'lodash';

// =============================================================================
// WORKFLOW STEPS
// =============================================================================

const workflowSteps = [
  {
    label: 'Patient Selection',
    description: 'Select or create a patient record'
  },
  {
    label: 'Data Collection',
    description: 'Collect required clinical data'
  },
  {
    label: 'Review & Validation',
    description: 'Review and validate entered data'
  },
  {
    label: 'Submit',
    description: 'Submit data to FHIR server'
  }
];

// =============================================================================
// MAIN WORKFLOW COMPONENT
// =============================================================================

export function ReferenceAppWorkflow(props) {
  console.log('ReferenceAppWorkflow.render()', props);
  
  const navigate = useNavigate();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [workflowData, setWorkflowData] = useState({
    patientId: '',
    resourceType: 'Observation',
    status: 'preliminary',
    category: '',
    code: '',
    value: '',
    notes: ''
  });
  
  // Track reactive data
  const { selectedPatientId, currentUser } = useTracker(() => {
    return {
      selectedPatientId: Session.get('selectedPatientId'),
      currentUser: Meteor.user()
    };
  });
  
  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  function handleNext() {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
      
      // Save progress
      Session.set('referenceWorkflowStep', activeStep + 1);
      Session.set('referenceWorkflowData', workflowData);
    }
  }
  
  function handleBack() {
    setActiveStep((prevStep) => prevStep - 1);
    Session.set('referenceWorkflowStep', activeStep - 1);
  }
  
  function handleReset() {
    setActiveStep(0);
    setWorkflowData({
      patientId: '',
      resourceType: 'Observation',
      status: 'preliminary',
      category: '',
      code: '',
      value: '',
      notes: ''
    });
    Session.set('referenceWorkflowStep', 0);
    Session.set('referenceWorkflowData', null);
  }
  
  function handleFieldChange(fieldName, value) {
    setWorkflowData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }
  
  function validateStep(step) {
    switch(step) {
      case 0: // Patient Selection
        return workflowData.patientId !== '';
      case 1: // Data Collection
        return workflowData.code !== '' && workflowData.value !== '';
      case 2: // Review
        return true;
      case 3: // Submit
        return true;
      default:
        return false;
    }
  }
  
  function handleSubmit() {
    console.log('Submitting workflow data:', workflowData);
    
    Meteor.call('referenceApp.submitWorkflow', workflowData, (error, result) => {
      if (error) {
        console.error('Error submitting workflow:', error);
      } else {
        console.log('Workflow submitted successfully:', result);
        handleReset();
        navigate('/reference-app/success');
      }
    });
  }
  
  // =============================================================================
  // STEP CONTENT RENDERERS
  // =============================================================================
  
  function renderStepContent(step) {
    switch(step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Patient ID"
              value={workflowData.patientId || selectedPatientId || ''}
              onChange={(e) => handleFieldChange('patientId', e.target.value)}
              placeholder="Enter or select patient ID"
              margin="normal"
            />
            <Button 
              variant="outlined" 
              sx={{ mt: 1 }}
              onClick={() => navigate('/patients')}
            >
              Select from Patient Directory
            </Button>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel>Resource Type</FormLabel>
              <RadioGroup
                value={workflowData.resourceType}
                onChange={(e) => handleFieldChange('resourceType', e.target.value)}
              >
                <FormControlLabel value="Observation" control={<Radio />} label="Observation" />
                <FormControlLabel value="Procedure" control={<Radio />} label="Procedure" />
                <FormControlLabel value="Condition" control={<Radio />} label="Condition" />
              </RadioGroup>
            </FormControl>
            
            <TextField
              fullWidth
              label="Code"
              value={workflowData.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Value"
              value={workflowData.value}
              onChange={(e) => handleFieldChange('value', e.target.value)}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <FormLabel>Status</FormLabel>
              <Select
                value={workflowData.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
              >
                <MenuItem value="preliminary">Preliminary</MenuItem>
                <MenuItem value="final">Final</MenuItem>
                <MenuItem value="amended">Amended</MenuItem>
                <MenuItem value="corrected">Corrected</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={workflowData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              margin="normal"
            />
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Data
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography><strong>Patient ID:</strong> {workflowData.patientId}</Typography>
              <Typography><strong>Resource Type:</strong> {workflowData.resourceType}</Typography>
              <Typography><strong>Status:</strong> {workflowData.status}</Typography>
              <Typography><strong>Code:</strong> {workflowData.code}</Typography>
              <Typography><strong>Value:</strong> {workflowData.value}</Typography>
              {workflowData.notes && (
                <Typography><strong>Notes:</strong> {workflowData.notes}</Typography>
              )}
            </Box>
            
            <FormControlLabel
              control={<Checkbox />}
              label="I confirm this data is correct"
              sx={{ mt: 2 }}
            />
          </Box>
        );
        
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ready to Submit
            </Typography>
            <Typography paragraph>
              Your data has been validated and is ready for submission to the FHIR server.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Submit to FHIR Server
            </Button>
          </Box>
        );
        
      default:
        return null;
    }
  }
  
  // =============================================================================
  // RENDERING
  // =============================================================================
  
  return (
    <Card>
      <CardHeader 
        title="Reference Workflow"
        subheader="Step-by-step clinical data collection"
      />
      <CardContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {workflowSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
                
                {renderStepContent(index)}
                
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={!validateStep(index)}
                  >
                    {index === workflowSteps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === workflowSteps.length && (
          <Box sx={{ p: 3 }}>
            <Typography>
              All steps completed - workflow finished successfully!
            </Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Start New Workflow
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
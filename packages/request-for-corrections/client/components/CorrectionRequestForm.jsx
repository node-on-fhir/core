// packages/request-for-corrections/client/components/CorrectionRequestForm.jsx

import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  FormHelperText
} from '@mui/material';

export default function CorrectionRequestForm({ 
  onSubmit, 
  submitting = false,
  initialValues = {}
}) {
  const [formData, setFormData] = useState({
    requestType: initialValues.requestType || 'correction',
    issueDescription: initialValues.issueDescription || '',
    correctionDetails: initialValues.correctionDetails || '',
    urgency: initialValues.urgency || 'routine',
    contactPreference: initialValues.contactPreference || 'secure-message'
  });
  
  const [errors, setErrors] = useState({});
  
  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: undefined
      });
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = 'Please describe the issue';
    }
    
    if (!formData.correctionDetails.trim()) {
      newErrors.correctionDetails = 'Please provide the correct information';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && onSubmit) {
      onSubmit(formData);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Request Type */}
      <FormControl component="fieldset">
        <FormLabel component="legend">Request Type</FormLabel>
        <RadioGroup
          value={formData.requestType}
          onChange={handleChange('requestType')}
        >
          <FormControlLabel 
            value="correction" 
            control={<Radio />} 
            label="Correction - Fix inaccurate information"
          />
          <FormControlLabel 
            value="amendment" 
            control={<Radio />} 
            label="Amendment - Add missing information"
          />
        </RadioGroup>
      </FormControl>
      
      {/* Issue Description */}
      <TextField
        label="Describe the Issue"
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={formData.issueDescription}
        onChange={handleChange('issueDescription')}
        error={!!errors.issueDescription}
        helperText={errors.issueDescription || "What information in your record is incorrect or missing?"}
        required
      />
      
      {/* Correction Details */}
      <TextField
        label="Provide Correct Information"
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={formData.correctionDetails}
        onChange={handleChange('correctionDetails')}
        error={!!errors.correctionDetails}
        helperText={errors.correctionDetails || "What should the information be changed to?"}
        required
      />
      
      {/* Urgency */}
      <FormControl component="fieldset">
        <FormLabel component="legend">Urgency</FormLabel>
        <RadioGroup
          value={formData.urgency}
          onChange={handleChange('urgency')}
        >
          <FormControlLabel 
            value="routine" 
            control={<Radio />} 
            label="Routine - Standard processing time"
          />
          <FormControlLabel 
            value="urgent" 
            control={<Radio />} 
            label="Urgent - Expedited review needed"
          />
        </RadioGroup>
      </FormControl>
      
      {/* Contact Preference */}
      <FormControl component="fieldset">
        <FormLabel component="legend">Preferred Contact Method</FormLabel>
        <RadioGroup
          value={formData.contactPreference}
          onChange={handleChange('contactPreference')}
        >
          <FormControlLabel 
            value="secure-message" 
            control={<Radio />} 
            label="Secure Message"
          />
          <FormControlLabel 
            value="phone" 
            control={<Radio />} 
            label="Phone Call"
          />
          <FormControlLabel 
            value="mail" 
            control={<Radio />} 
            label="Postal Mail"
          />
        </RadioGroup>
      </FormControl>
      
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={submitting}
        sx={{ alignSelf: 'flex-start' }}
      >
        {submitting ? 'Submitting...' : 'Submit Request'}
      </Button>
    </Box>
  );
}
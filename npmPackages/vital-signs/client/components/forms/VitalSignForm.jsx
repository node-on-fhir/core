// packages/vital-signs/client/components/forms/VitalSignForm.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
  Typography,
  Box,
  Divider,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  DateTimePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

// Common vital sign types with LOINC codes
const VITAL_SIGN_TYPES = [
  {
    code: '8867-4',
    display: 'Heart Rate',
    unit: 'bpm',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 30, max: 200 }
  },
  {
    code: '8480-6',
    display: 'Systolic Blood Pressure',
    unit: 'mmHg',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 70, max: 200 }
  },
  {
    code: '8462-4',
    display: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 40, max: 130 }
  },
  {
    code: '9279-1',
    display: 'Respiratory Rate',
    unit: 'breaths/min',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 8, max: 40 }
  },
  {
    code: '2708-6',
    display: 'Oxygen Saturation',
    unit: '%',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 70, max: 100 }
  },
  {
    code: '8310-5',
    display: 'Body Temperature',
    unit: '°F',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 95.0, max: 105.0 }
  },
  {
    code: '8302-2',
    display: 'Body Height',
    unit: 'cm',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 50, max: 250 }
  },
  {
    code: '29463-7',
    display: 'Body Weight',
    unit: 'kg',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 1, max: 300 }
  },
  {
    code: '39156-5',
    display: 'Body Mass Index',
    unit: 'kg/m2',
    system: 'http://loinc.org',
    category: 'vital-signs',
    validation: { min: 10, max: 60 }
  }
];

// Helper to get validation rules for a vital type
function getValidationRules(code) {
  const vitalType = VITAL_SIGN_TYPES.find(v => v.code === code);
  return vitalType ? vitalType.validation : null;
}

// Individual vital sign input component
function VitalSignInput(props) {
  const { vital, index, onChange, onDelete, errors } = props;
  
  const selectedType = VITAL_SIGN_TYPES.find(v => v.code === vital.code);
  const validation = getValidationRules(vital.code);
  
  function handleTypeChange(event) {
    const newCode = event.target.value;
    const newType = VITAL_SIGN_TYPES.find(v => v.code === newCode);
    onChange(index, {
      ...vital,
      code: newCode,
      display: newType.display,
      unit: newType.unit
    });
  }
  
  function handleValueChange(event) {
    onChange(index, {
      ...vital,
      value: event.target.value
    });
  }
  
  function handleNoteChange(event) {
    onChange(index, {
      ...vital,
      note: event.target.value
    });
  }
  
  const error = errors[`vital_${index}`];
  const hasError = error && error.value;
  
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Vital Sign Type</InputLabel>
              <Select
                value={vital.code}
                onChange={handleTypeChange}
                label="Vital Sign Type"
              >
                {VITAL_SIGN_TYPES.map(type => (
                  <MenuItem key={type.code} value={type.code}>
                    {type.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Value"
              type="number"
              value={vital.value}
              onChange={handleValueChange}
              error={hasError}
              helperText={hasError ? error.value : 
                validation ? `Range: ${validation.min}-${validation.max}` : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {vital.unit}
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Note (optional)"
              value={vital.note}
              onChange={handleNoteChange}
              multiline
              rows={1}
            />
          </Grid>
          
          <Grid item xs={12} md={1}>
            <Tooltip title="Remove vital sign">
              <IconButton
                color="error"
                onClick={() => onDelete(index)}
                sx={{ mt: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

VitalSignInput.propTypes = {
  vital: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  errors: PropTypes.object
};

// Main form component
function VitalSignForm(props) {
  const {
    observation,
    patient,
    performer,
    onSave,
    onCancel,
    title,
    allowMultiple,
    showDeviceInput,
    defaultStatus,
    ...otherProps
  } = props;
  
  // Initialize form state
  const [formData, setFormData] = useState({
    status: defaultStatus || 'final',
    effectiveDateTime: moment(),
    vitals: [{
      code: '',
      display: '',
      value: '',
      unit: '',
      note: ''
    }],
    device: '',
    overallNote: ''
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Load observation if editing
  useEffect(function() {
    if (observation && observation.id) {
      const vitals = [];
      
      // Handle single value
      if (observation.valueQuantity) {
        vitals.push({
          code: get(observation, 'code.coding[0].code', ''),
          display: get(observation, 'code.coding[0].display', ''),
          value: get(observation, 'valueQuantity.value', ''),
          unit: get(observation, 'valueQuantity.unit', ''),
          note: get(observation, 'note[0].text', '')
        });
      }
      
      // Handle components (for blood pressure, etc.)
      if (observation.component && Array.isArray(observation.component)) {
        observation.component.forEach(comp => {
          vitals.push({
            code: get(comp, 'code.coding[0].code', ''),
            display: get(comp, 'code.coding[0].display', ''),
            value: get(comp, 'valueQuantity.value', ''),
            unit: get(comp, 'valueQuantity.unit', ''),
            note: ''
          });
        });
      }
      
      setFormData({
        status: get(observation, 'status', 'final'),
        effectiveDateTime: moment(get(observation, 'effectiveDateTime', new Date())),
        vitals: vitals.length > 0 ? vitals : [{
          code: '',
          display: '',
          value: '',
          unit: '',
          note: ''
        }],
        device: get(observation, 'device.display', ''),
        overallNote: get(observation, 'note[0].text', '')
      });
    }
  }, [observation]);
  
  // Add new vital sign
  function handleAddVital() {
    setFormData(prev => ({
      ...prev,
      vitals: [...prev.vitals, {
        code: '',
        display: '',
        value: '',
        unit: '',
        note: ''
      }]
    }));
  }
  
  // Update vital sign
  function handleVitalChange(index, updatedVital) {
    const newVitals = [...formData.vitals];
    newVitals[index] = updatedVital;
    setFormData(prev => ({
      ...prev,
      vitals: newVitals
    }));
    
    // Clear error for this field
    if (errors[`vital_${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`vital_${index}`];
      setErrors(newErrors);
    }
  }
  
  // Delete vital sign
  function handleDeleteVital(index) {
    if (formData.vitals.length > 1) {
      const newVitals = formData.vitals.filter((v, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        vitals: newVitals
      }));
    }
  }
  
  // Validate form
  function validateForm() {
    const newErrors = {};
    
    formData.vitals.forEach((vital, index) => {
      const vitalErrors = {};
      
      if (!vital.code) {
        vitalErrors.code = 'Vital sign type is required';
      }
      
      if (!vital.value) {
        vitalErrors.value = 'Value is required';
      } else {
        const validation = getValidationRules(vital.code);
        if (validation) {
          const numValue = parseFloat(vital.value);
          if (numValue < validation.min || numValue > validation.max) {
            vitalErrors.value = `Value must be between ${validation.min} and ${validation.max}`;
          }
        }
      }
      
      if (Object.keys(vitalErrors).length > 0) {
        newErrors[`vital_${index}`] = vitalErrors;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  // Handle save
  async function handleSave() {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      // Build FHIR Observation(s)
      const observations = [];
      
      if (formData.vitals.length === 1) {
        // Single observation
        const vital = formData.vitals[0];
        const vitalType = VITAL_SIGN_TYPES.find(v => v.code === vital.code);
        
        const observation = {
          resourceType: 'Observation',
          status: formData.status,
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }],
            text: 'Vital Signs'
          }],
          code: {
            coding: [{
              system: vitalType.system,
              code: vital.code,
              display: vital.display
            }],
            text: vital.display
          },
          subject: {
            reference: patient.reference || `Patient/${patient.id}`,
            display: patient.display || patient.name
          },
          effectiveDateTime: formData.effectiveDateTime.toISOString(),
          issued: moment().toISOString(),
          performer: performer ? [{
            reference: performer.reference,
            display: performer.display
          }] : [],
          valueQuantity: {
            value: parseFloat(vital.value),
            unit: vital.unit,
            system: 'http://unitsofmeasure.org',
            code: vital.unit
          }
        };
        
        if (vital.note || formData.overallNote) {
          observation.note = [{
            text: vital.note || formData.overallNote
          }];
        }
        
        if (formData.device) {
          observation.device = {
            display: formData.device
          };
        }
        
        observations.push(observation);
        
      } else {
        // Multiple observations - check if blood pressure
        const hasSystolic = formData.vitals.some(v => v.code === '8480-6');
        const hasDiastolic = formData.vitals.some(v => v.code === '8462-4');
        
        if (hasSystolic && hasDiastolic && formData.vitals.length === 2) {
          // Combined blood pressure observation
          const systolic = formData.vitals.find(v => v.code === '8480-6');
          const diastolic = formData.vitals.find(v => v.code === '8462-4');
          
          const observation = {
            resourceType: 'Observation',
            status: formData.status,
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }],
              text: 'Vital Signs'
            }],
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '85354-9',
                display: 'Blood pressure panel with all children optional'
              }],
              text: 'Blood Pressure'
            },
            subject: {
              reference: patient.reference || `Patient/${patient.id}`,
              display: patient.display || patient.name
            },
            effectiveDateTime: formData.effectiveDateTime.toISOString(),
            issued: moment().toISOString(),
            performer: performer ? [{
              reference: performer.reference,
              display: performer.display
            }] : [],
            component: [
              {
                code: {
                  coding: [{
                    system: 'http://loinc.org',
                    code: '8480-6',
                    display: 'Systolic blood pressure'
                  }]
                },
                valueQuantity: {
                  value: parseFloat(systolic.value),
                  unit: 'mmHg',
                  system: 'http://unitsofmeasure.org',
                  code: 'mm[Hg]'
                }
              },
              {
                code: {
                  coding: [{
                    system: 'http://loinc.org',
                    code: '8462-4',
                    display: 'Diastolic blood pressure'
                  }]
                },
                valueQuantity: {
                  value: parseFloat(diastolic.value),
                  unit: 'mmHg',
                  system: 'http://unitsofmeasure.org',
                  code: 'mm[Hg]'
                }
              }
            ]
          };
          
          if (formData.overallNote) {
            observation.note = [{
              text: formData.overallNote
            }];
          }
          
          if (formData.device) {
            observation.device = {
              display: formData.device
            };
          }
          
          observations.push(observation);
          
        } else {
          // Separate observations
          formData.vitals.forEach(vital => {
            const vitalType = VITAL_SIGN_TYPES.find(v => v.code === vital.code);
            
            const observation = {
              resourceType: 'Observation',
              status: formData.status,
              category: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs'
                }],
                text: 'Vital Signs'
              }],
              code: {
                coding: [{
                  system: vitalType.system,
                  code: vital.code,
                  display: vital.display
                }],
                text: vital.display
              },
              subject: {
                reference: patient.reference || `Patient/${patient.id}`,
                display: patient.display || patient.name
              },
              effectiveDateTime: formData.effectiveDateTime.toISOString(),
              issued: moment().toISOString(),
              performer: performer ? [{
                reference: performer.reference,
                display: performer.display
              }] : [],
              valueQuantity: {
                value: parseFloat(vital.value),
                unit: vital.unit,
                system: 'http://unitsofmeasure.org',
                code: vital.unit
              }
            };
            
            if (vital.note) {
              observation.note = [{
                text: vital.note
              }];
            }
            
            if (formData.device) {
              observation.device = {
                display: formData.device
              };
            }
            
            observations.push(observation);
          });
        }
      }
      
      if (onSave) {
        await onSave(observations);
      }
    } catch (error) {
      console.error('Error saving vital signs:', error);
    } finally {
      setSaving(false);
    }
  }
  
  // Check if blood pressure components are selected
  const hasBloodPressure = formData.vitals.some(v => v.code === '8480-6') && 
                          formData.vitals.some(v => v.code === '8462-4');
  
  return (
    <Card {...otherProps}>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        <Stack spacing={3}>
          {/* Date/Time and Status */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  label="Date & Time"
                  value={formData.effectiveDateTime}
                  onChange={(newValue) => setFormData(prev => ({
                    ...prev,
                    effectiveDateTime: newValue
                  }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  label="Status"
                >
                  <MenuItem value="registered">Registered</MenuItem>
                  <MenuItem value="preliminary">Preliminary</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="amended">Amended</MenuItem>
                  <MenuItem value="corrected">Corrected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Blood pressure hint */}
          {hasBloodPressure && formData.vitals.length === 2 && (
            <Alert severity="info" icon={<InfoIcon />}>
              Systolic and Diastolic blood pressure values will be saved as a combined observation
            </Alert>
          )}
          
          {/* Vital signs inputs */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Vital Signs
            </Typography>
            {formData.vitals.map((vital, index) => (
              <VitalSignInput
                key={index}
                vital={vital}
                index={index}
                onChange={handleVitalChange}
                onDelete={handleDeleteVital}
                errors={errors}
              />
            ))}
            
            {allowMultiple && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddVital}
                size="small"
              >
                Add Another Vital Sign
              </Button>
            )}
          </Box>
          
          {/* Device input */}
          {showDeviceInput && (
            <TextField
              fullWidth
              label="Device (optional)"
              value={formData.device}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                device: e.target.value
              }))}
              helperText="Name of device used for measurement"
            />
          )}
          
          {/* Overall note */}
          <TextField
            fullWidth
            label="Note (optional)"
            value={formData.overallNote}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              overallNote: e.target.value
            }))}
            multiline
            rows={2}
          />
          
          {/* Error summary */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error">
              Please correct the errors above before saving
            </Alert>
          )}
        </Stack>
      </CardContent>
      <Divider />
      <CardActions>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </CardActions>
    </Card>
  );
}

VitalSignForm.propTypes = {
  observation: PropTypes.object,
  patient: PropTypes.shape({
    id: PropTypes.string,
    reference: PropTypes.string,
    display: PropTypes.string,
    name: PropTypes.string
  }).isRequired,
  performer: PropTypes.shape({
    reference: PropTypes.string,
    display: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  title: PropTypes.string,
  allowMultiple: PropTypes.bool,
  showDeviceInput: PropTypes.bool,
  defaultStatus: PropTypes.string
};

VitalSignForm.defaultProps = {
  title: 'Record Vital Signs',
  allowMultiple: true,
  showDeviceInput: true,
  defaultStatus: 'final'
};

export default VitalSignForm;
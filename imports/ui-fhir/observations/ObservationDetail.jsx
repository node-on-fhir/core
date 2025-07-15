// /imports/ui-fhir/observations/ObservationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';

import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ObservationDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [observation, setObservation] = useState({
    resourceType: 'Observation',
    status: 'preliminary',
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs"
      }],
      text: "Vital Signs"
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    effectiveDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    issued: moment().format('YYYY-MM-DDTHH:mm:ss'),
    performer: [{
      reference: "",
      display: ""
    }],
    valueQuantity: {
      value: null,
      unit: "",
      system: "http://unitsofmeasure.org",
      code: ""
    },
    valueString: "",
    device: {
      reference: "",
      display: ""
    },
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and performer on component mount for new observations
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new observations
      setIsEditing(true);
      
      // For new observations, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }
      
      // Set performer to current user
      let performerName = '';
      let performerReference = '';
      
      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setObservation(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        performer: [{
          reference: performerReference,
          display: performerName
        }]
      }));
    } else {
      // Viewing existing observation - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load observation if editing
  useEffect(function() {
    async function loadObservation() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('observations.get', id);
          if (result) {
            setObservation(result);
          }
        } catch (err) {
          console.error('Error loading observation:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadObservation();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedObservation = { ...observation };
    set(updatedObservation, path, value);
    setObservation(updatedObservation);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing observation
        await Meteor.callAsync('observations.update', id, observation);
        console.log('Observation updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new observation
        const newId = await Meteor.callAsync('observations.create', observation);
        console.log('Observation created with ID:', newId);
        // Navigate back to observations list for new observations
        navigate('/observations');
      }
    } catch (err) {
      console.error('Error saving observation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this observation?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('observations.remove', id);
        console.log('Observation deleted successfully');
        navigate('/observations');
      } catch (err) {
        console.error('Error deleting observation:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/observations');
  }

  const statusOptions = [
    { value: 'registered', label: 'Registered' },
    { value: 'preliminary', label: 'Preliminary' },
    { value: 'final', label: 'Final' },
    { value: 'amended', label: 'Amended' },
    { value: 'corrected', label: 'Corrected' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const categoryOptions = [
    { code: 'vital-signs', display: 'Vital Signs' },
    { code: 'laboratory', display: 'Laboratory' },
    { code: 'imaging', display: 'Imaging' },
    { code: 'procedure', display: 'Procedure' },
    { code: 'survey', display: 'Survey' },
    { code: 'exam', display: 'Exam' },
    { code: 'therapy', display: 'Therapy' },
    { code: 'activity', display: 'Activity' }
  ];

  // Determine current value type
  const getValueType = () => {
    if (get(observation, 'valueQuantity.value') !== null && get(observation, 'valueQuantity.value') !== undefined && get(observation, 'valueQuantity.value') !== '') return 'valueQuantity';
    if (get(observation, 'valueCodeableConcept.coding[0].code')) return 'valueCodeableConcept';
    if (get(observation, 'valueString')) return 'valueString';
    if (get(observation, 'valueBoolean') !== null && get(observation, 'valueBoolean') !== undefined) return 'valueBoolean';
    if (get(observation, 'valueInteger') !== null && get(observation, 'valueInteger') !== undefined) return 'valueInteger';
    if (get(observation, 'valueRange.low.value') || get(observation, 'valueRange.high.value')) return 'valueRange';
    if (get(observation, 'valueRatio.numerator.value') || get(observation, 'valueRatio.denominator.value')) return 'valueRatio';
    if (get(observation, 'valueSampledData')) return 'valueSampledData';
    if (get(observation, 'valueTime')) return 'valueTime';
    if (get(observation, 'valueDateTime')) return 'valueDateTime';
    if (get(observation, 'valuePeriod.start') || get(observation, 'valuePeriod.end')) return 'valuePeriod';
    if (get(observation, 'valueAttachment')) return 'valueAttachment';
    return 'valueQuantity'; // Default
  };

  const [valueType, setValueType] = useState(getValueType());

  // Clear all value fields
  const clearAllValues = () => {
    const updates = {
      'valueQuantity': null,
      'valueCodeableConcept': null,
      'valueString': null,
      'valueBoolean': null,
      'valueInteger': null,
      'valueRange': null,
      'valueRatio': null,
      'valueSampledData': null,
      'valueTime': null,
      'valueDateTime': null,
      'valuePeriod': null,
      'valueAttachment': null
    };
    Object.entries(updates).forEach(([key, value]) => {
      handleChange(key, value);
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Observation' : 'New Observation'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            {props.showPatientInputs !== false && (
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  value={get(observation, 'subject.display', '')}
                  helperText={get(observation, 'subject.reference', '') || 'Patient reference will be assigned'}
                  disabled // Always disabled to prevent editing
                />
                
                <TextField
                  fullWidth
                  label="Patient ID"
                  value={get(observation, 'subject.reference', '')}
                  disabled // Always disabled to prevent editing
                />
              </Stack>
            )}
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={get(observation, 'category[0].coding[0].code', 'vital-signs')}
                  onChange={(e) => {
                    const option = categoryOptions.find(o => o.code === e.target.value);
                    handleChange('category[0].coding[0].code', option.code);
                    handleChange('category[0].coding[0].display', option.display);
                    handleChange('category[0].text', option.display);
                  }}
                  label="Category"
                >
                  {categoryOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={get(observation, 'status', 'preliminary')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                type="datetime-local"
                label="Effective Date/Time"
                value={moment(get(observation, 'effectiveDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="LOINC Code"
                value={get(observation, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="LOINC observation code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search LOINC codes">
                        <IconButton
                          onClick={() => window.open('https://loinc.org/search/', '_blank')}
                          edge="end"
                          disabled={!isEditing}
                        >
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="LOINC Display"
                value={get(observation, 'code.coding[0].display', '') || get(observation, 'code.text', '')}
                onChange={(e) => {
                  handleChange('code.coding[0].display', e.target.value);
                  handleChange('code.text', e.target.value);
                }}
                helperText="Human-readable observation name"
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Value</Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }} disabled={!isEditing}>
              <InputLabel>Value Type</InputLabel>
              <Select
                value={valueType}
                onChange={(e) => {
                  clearAllValues();
                  setValueType(e.target.value);
                }}
                label="Value Type"
              >
                <MenuItem value="valueQuantity">Quantity</MenuItem>
                <MenuItem value="valueCodeableConcept">Codeable Concept</MenuItem>
                <MenuItem value="valueString">String</MenuItem>
                <MenuItem value="valueBoolean">Boolean</MenuItem>
                <MenuItem value="valueInteger">Integer</MenuItem>
                <MenuItem value="valueRange">Range</MenuItem>
                <MenuItem value="valueRatio">Ratio</MenuItem>
                <MenuItem value="valueSampledData">Sampled Data</MenuItem>
                <MenuItem value="valueTime">Time</MenuItem>
                <MenuItem value="valueDateTime">Date/Time</MenuItem>
                <MenuItem value="valuePeriod">Period</MenuItem>
                <MenuItem value="valueAttachment">Attachment</MenuItem>
              </Select>
            </FormControl>
            
            {valueType === 'valueQuantity' && (
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity Value"
                  value={get(observation, 'valueQuantity.value', '')}
                  onChange={(e) => handleChange('valueQuantity.value', parseFloat(e.target.value) || null)}
                  disabled={!isEditing}
                />
                
                <TextField
                  fullWidth
                  label="Unit"
                  value={get(observation, 'valueQuantity.unit', '')}
                  onChange={(e) => {
                    handleChange('valueQuantity.unit', e.target.value);
                    handleChange('valueQuantity.code', e.target.value);
                  }}
                  helperText="e.g., kg, mmHg, mg/dL"
                  disabled={!isEditing}
                />
              </Stack>
            )}
            
            {valueType === 'valueString' && (
              <TextField
                fullWidth
                label="String Value"
                value={get(observation, 'valueString', '')}
                onChange={(e) => handleChange('valueString', e.target.value)}
                helperText="e.g., Positive, Negative, A+, Normal"
                disabled={!isEditing}
              />
            )}
            
            {valueType === 'valueBoolean' && (
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Boolean Value</InputLabel>
                <Select
                  value={get(observation, 'valueBoolean', '') === '' ? '' : String(get(observation, 'valueBoolean', false))}
                  onChange={(e) => handleChange('valueBoolean', e.target.value === 'true')}
                  label="Boolean Value"
                >
                  <MenuItem value="">Select Value</MenuItem>
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {valueType === 'valueInteger' && (
              <TextField
                fullWidth
                type="number"
                label="Integer Value"
                value={get(observation, 'valueInteger', '')}
                onChange={(e) => handleChange('valueInteger', parseInt(e.target.value) || null)}
                helperText="Whole number only"
                disabled={!isEditing}
              />
            )}
            
            {valueType === 'valueCodeableConcept' && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Code"
                  value={get(observation, 'valueCodeableConcept.coding[0].code', '')}
                  onChange={(e) => handleChange('valueCodeableConcept.coding[0].code', e.target.value)}
                  helperText="e.g., 260373001"
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  label="Display"
                  value={get(observation, 'valueCodeableConcept.coding[0].display', '')}
                  onChange={(e) => handleChange('valueCodeableConcept.coding[0].display', e.target.value)}
                  helperText="e.g., Detected"
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  label="System"
                  value={get(observation, 'valueCodeableConcept.coding[0].system', 'http://snomed.info/sct')}
                  onChange={(e) => handleChange('valueCodeableConcept.coding[0].system', e.target.value)}
                  helperText="Code system URL"
                  disabled={!isEditing}
                />
              </Stack>
            )}
            
            {valueType === 'valueRange' && (
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Low Value"
                  value={get(observation, 'valueRange.low.value', '')}
                  onChange={(e) => handleChange('valueRange.low.value', parseFloat(e.target.value) || null)}
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="High Value"
                  value={get(observation, 'valueRange.high.value', '')}
                  onChange={(e) => handleChange('valueRange.high.value', parseFloat(e.target.value) || null)}
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  label="Unit"
                  value={get(observation, 'valueRange.low.unit', '')}
                  onChange={(e) => {
                    handleChange('valueRange.low.unit', e.target.value);
                    handleChange('valueRange.high.unit', e.target.value);
                  }}
                  helperText="e.g., mg/dL"
                  disabled={!isEditing}
                />
              </Stack>
            )}
            
            {valueType === 'valueRatio' && (
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Numerator"
                    value={get(observation, 'valueRatio.numerator.value', '')}
                    onChange={(e) => handleChange('valueRatio.numerator.value', parseFloat(e.target.value) || null)}
                    disabled={!isEditing}
                  />
                  <TextField
                    fullWidth
                    label="Numerator Unit"
                    value={get(observation, 'valueRatio.numerator.unit', '')}
                    onChange={(e) => handleChange('valueRatio.numerator.unit', e.target.value)}
                    disabled={!isEditing}
                  />
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Denominator"
                    value={get(observation, 'valueRatio.denominator.value', '')}
                    onChange={(e) => handleChange('valueRatio.denominator.value', parseFloat(e.target.value) || null)}
                    disabled={!isEditing}
                  />
                  <TextField
                    fullWidth
                    label="Denominator Unit"
                    value={get(observation, 'valueRatio.denominator.unit', '')}
                    onChange={(e) => handleChange('valueRatio.denominator.unit', e.target.value)}
                    disabled={!isEditing}
                  />
                </Stack>
              </Stack>
            )}
            
            {valueType === 'valueTime' && (
              <TextField
                fullWidth
                type="time"
                label="Time Value"
                value={get(observation, 'valueTime', '')}
                onChange={(e) => handleChange('valueTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            )}
            
            {valueType === 'valueDateTime' && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Date/Time Value"
                value={moment(get(observation, 'valueDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('valueDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            )}
            
            {valueType === 'valuePeriod' && (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Period Start"
                  value={moment(get(observation, 'valuePeriod.start', '')).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => handleChange('valuePeriod.start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={!isEditing}
                />
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Period End"
                  value={moment(get(observation, 'valuePeriod.end', '')).format('YYYY-MM-DDTHH:mm')}
                  onChange={(e) => handleChange('valuePeriod.end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={!isEditing}
                />
              </Stack>
            )}
            
            {valueType === 'valueSampledData' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Sampled Data"
                value={get(observation, 'valueSampledData.data', '')}
                onChange={(e) => handleChange('valueSampledData.data', e.target.value)}
                helperText="E format: values separated by spaces"
                disabled={!isEditing}
              />
            )}
            
            {valueType === 'valueAttachment' && (
              <TextField
                fullWidth
                label="Attachment URL"
                value={get(observation, 'valueAttachment.url', '')}
                onChange={(e) => handleChange('valueAttachment.url', e.target.value)}
                helperText="URL to the attached resource"
                disabled={!isEditing}
              />
            )}
            
            {props.showDeviceInputs !== false && (
              <>
                <Typography variant="h6" sx={{ mt: 2 }}>Device</Typography>
                
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Device Name"
                    value={get(observation, 'device.display', '')}
                    onChange={(e) => handleChange('device.display', e.target.value)}
                    helperText="e.g., Blood Pressure Monitor"
                    disabled={!isEditing}
                  />
                  
                  <TextField
                    fullWidth
                    label="Device Reference"
                    value={get(observation, 'device.reference', '')}
                    onChange={(e) => handleChange('device.reference', e.target.value)}
                    helperText="e.g., Device/12345"
                    disabled={!isEditing}
                  />
                </Stack>
              </>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(observation, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about this observation"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/observations')}
              >
                Back
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the observation to discard changes
                    async function reloadObservation() {
                      try {
                        const result = await Meteor.callAsync('observations.get', id);
                        if (result) {
                          setObservation(result);
                        }
                      } catch (err) {
                        console.error('Error reloading observation:', err);
                      }
                    }
                    reloadObservation();
                  } else {
                    // For new observations, go back
                    navigate('/observations');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

ObservationDetail.propTypes = {
  showPatientInputs: PropTypes.bool,
  showDeviceInputs: PropTypes.bool
};

export default ObservationDetail;
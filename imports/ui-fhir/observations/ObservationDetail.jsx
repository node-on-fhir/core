// /imports/ui-fhir/observations/ObservationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
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
  Grid,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Dialog
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';

import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

//===========================================================================
// STATUS OPTIONS

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

const statusColorMap = {
  'registered': 'info',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

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

//===========================================================================
// COMPONENT

function ObservationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

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
    effectiveDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    issued: moment().format('YYYY-MM-DDTHH:mm:ss'),
    performer: [{
      reference: "",
      display: ""
    }],
    valueQuantity: {
      value: "",
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

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setObservation(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || isNewRecord);

  // Subscribe to observations for direct URL navigation
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Observations', Session.get('selectedPatientId'), {}).ready();
    } else {
      return Meteor.subscribe('observations.all').ready();
    }
  }, []);

  // Set patient name and performer on component mount for new observations
  useEffect(function() {
    if (isNewRecord) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
      } else if (currentUser) {
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      let performerName = '';
      let performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setObservation(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          performer: [{
            reference: performerReference,
            display: performerName
          }]
        };
      });
    }
  }, [id, selectedPatient, currentUser]);

  // Load observation when subscription is ready
  useEffect(function() {
    if (isExistingRecord && isSubscriptionReady) {
      const existingObservation = Observations.findOne({ _id: id });
      if (existingObservation) {
        setObservation(existingObservation);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('observations.get', id);
            if (result) {
              setObservation(result);
              setIsEditing(false);
            }
          } catch (err) {
            console.error('Error loading observation:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes using cloneDeep for nested FHIR structures
  function handleChange(path, value) {
    const updatedObservation = cloneDeep(observation);
    set(updatedObservation, path, value);
    setObservation(updatedObservation);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedObservation);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        await Meteor.callAsync('observations.update', id, observation);
        console.log('Observation updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('observations.create', observation);
        console.log('Observation created with ID:', newId);
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
    if (isNewRecord) return;

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
    if (isExistingRecord) {
      // Reload original data
      const existingObservation = Observations.findOne({ _id: id });
      if (existingObservation) {
        setObservation(existingObservation);
      }
      setIsEditing(false);
    } else {
      navigate('/observations');
    }
  }

  // Determine current value type
  function getValueType() {
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
    return 'valueQuantity';
  }

  const [valueType, setValueType] = useState(getValueType());

  // Clear all value fields
  function clearAllValues() {
    const updates = {
      'valueQuantity.value': '',
      'valueQuantity.unit': '',
      'valueQuantity.code': '',
      'valueCodeableConcept': null,
      'valueString': '',
      'valueBoolean': null,
      'valueInteger': '',
      'valueRange': null,
      'valueRatio': null,
      'valueSampledData': '',
      'valueTime': '',
      'valueDateTime': '',
      'valuePeriod': null,
      'valueAttachment': null
    };
    Object.entries(updates).forEach(function([key, value]) {
      handleChange(key, value);
    });
  }

  // Build the header title
  let headerTitle = 'New Record';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle — only for existing records */}
        {isExistingRecord && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing records, gated on edit mode */}
        {isExistingRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Patient Fields */}
          {props.showPatientInputs !== false && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  id="patientDisplay"
                  fullWidth
                  label="Patient Name"
                  value={get(observation, 'subject.display', '')}
                  helperText={get(observation, 'subject.reference', '') || 'Patient reference will be assigned'}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  id="patientReference"
                  fullWidth
                  label="Patient ID"
                  value={get(observation, 'subject.reference', '')}
                  disabled
                />
              </Grid>
            </>
          )}

          {/* Performer */}
          <Grid item xs={12} md={6}>
            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer"
              value={get(observation, 'performer[0].display', '')}
              helperText={get(observation, 'performer[0].reference', '') || 'Performer reference will be assigned'}
              disabled
            />
          </Grid>

          {/* Category */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Category</InputLabel>
              <Select
                id="category"
                value={get(observation, 'category[0].coding[0].code', 'vital-signs')}
                onChange={function(e) {
                  const option = categoryOptions.find(function(o) { return o.code === e.target.value; });
                  handleChange('category[0].coding[0].code', option.code);
                  handleChange('category[0].coding[0].display', option.display);
                  handleChange('category[0].text', option.display);
                }}
                label="Category"
              >
                {categoryOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                id="status"
                labelId="status-label"
                value={get(observation, 'status', 'preliminary')}
                onChange={function(e) { handleChange('status', e.target.value); }}
                label="Status"
              >
                {statusOptions.map(function(option) {
                  return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Effective Date/Time */}
          <Grid item xs={12} md={6}>
            <TextField
              id="effectiveDate"
              fullWidth
              type="datetime-local"
              label="Effective Date/Time"
              value={get(observation, 'effectiveDateTime') ? moment(get(observation, 'effectiveDateTime')).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={function(e) { handleChange('effectiveDateTime', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Grid>

          {/* LOINC Code */}
          <Grid item xs={12} md={6}>
            <TextField
              id="loincCode"
              fullWidth
              label="LOINC Code"
              value={get(observation, 'code.coding[0].code', '')}
              onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
              helperText="LOINC observation code"
              disabled={!isEditing}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Search LOINC codes">
                      <IconButton
                        onClick={function() { window.open('https://loinc.org/search/', '_blank'); }}
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
          </Grid>

          {/* LOINC Display */}
          <Grid item xs={12} md={6}>
            <TextField
              id="loincDisplay"
              fullWidth
              label="LOINC Display"
              value={get(observation, 'code.coding[0].display', '') || get(observation, 'code.text', '')}
              onChange={function(e) {
                handleChange('code.coding[0].display', e.target.value);
                handleChange('code.text', e.target.value);
              }}
              helperText="Human-readable observation name"
              disabled={!isEditing}
            />
          </Grid>

          {/* Value Type selector */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 1 }}>Value</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Value Type</InputLabel>
              <Select
                value={valueType}
                onChange={function(e) {
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
          </Grid>

          {/* Value fields based on type */}
          {valueType === 'valueQuantity' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  id="valueQuantity"
                  fullWidth
                  type="number"
                  label="Quantity Value"
                  value={get(observation, 'valueQuantity.value', '')}
                  onChange={function(e) { handleChange('valueQuantity.value', parseFloat(e.target.value) || null); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  id="unit"
                  fullWidth
                  label="Unit"
                  value={get(observation, 'valueQuantity.unit', '')}
                  onChange={function(e) {
                    handleChange('valueQuantity.unit', e.target.value);
                    handleChange('valueQuantity.code', e.target.value);
                  }}
                  helperText="e.g., kg, mmHg, mg/dL"
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {valueType === 'valueString' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="String Value"
                value={get(observation, 'valueString', '')}
                onChange={function(e) { handleChange('valueString', e.target.value); }}
                helperText="e.g., Positive, Negative, A+, Normal"
                disabled={!isEditing}
              />
            </Grid>
          )}

          {valueType === 'valueBoolean' && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Boolean Value</InputLabel>
                <Select
                  value={get(observation, 'valueBoolean', '') === '' ? '' : String(get(observation, 'valueBoolean', false))}
                  onChange={function(e) { handleChange('valueBoolean', e.target.value === 'true'); }}
                  label="Boolean Value"
                >
                  <MenuItem value="">Select Value</MenuItem>
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {valueType === 'valueInteger' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Integer Value"
                value={get(observation, 'valueInteger', '')}
                onChange={function(e) { handleChange('valueInteger', parseInt(e.target.value) || null); }}
                helperText="Whole number only"
                disabled={!isEditing}
              />
            </Grid>
          )}

          {valueType === 'valueCodeableConcept' && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Code"
                  value={get(observation, 'valueCodeableConcept.coding[0].code', '')}
                  onChange={function(e) { handleChange('valueCodeableConcept.coding[0].code', e.target.value); }}
                  helperText="e.g., 260373001"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Display"
                  value={get(observation, 'valueCodeableConcept.coding[0].display', '')}
                  onChange={function(e) { handleChange('valueCodeableConcept.coding[0].display', e.target.value); }}
                  helperText="e.g., Detected"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="System"
                  value={get(observation, 'valueCodeableConcept.coding[0].system', 'http://snomed.info/sct')}
                  onChange={function(e) { handleChange('valueCodeableConcept.coding[0].system', e.target.value); }}
                  helperText="Code system URL"
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {valueType === 'valueRange' && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Low Value"
                  value={get(observation, 'valueRange.low.value', '')}
                  onChange={function(e) { handleChange('valueRange.low.value', parseFloat(e.target.value) || null); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="High Value"
                  value={get(observation, 'valueRange.high.value', '')}
                  onChange={function(e) { handleChange('valueRange.high.value', parseFloat(e.target.value) || null); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={get(observation, 'valueRange.low.unit', '')}
                  onChange={function(e) {
                    handleChange('valueRange.low.unit', e.target.value);
                    handleChange('valueRange.high.unit', e.target.value);
                  }}
                  helperText="e.g., mg/dL"
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {valueType === 'valueRatio' && (
            <>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Numerator"
                  value={get(observation, 'valueRatio.numerator.value', '')}
                  onChange={function(e) { handleChange('valueRatio.numerator.value', parseFloat(e.target.value) || null); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Numerator Unit"
                  value={get(observation, 'valueRatio.numerator.unit', '')}
                  onChange={function(e) { handleChange('valueRatio.numerator.unit', e.target.value); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Denominator"
                  value={get(observation, 'valueRatio.denominator.value', '')}
                  onChange={function(e) { handleChange('valueRatio.denominator.value', parseFloat(e.target.value) || null); }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Denominator Unit"
                  value={get(observation, 'valueRatio.denominator.unit', '')}
                  onChange={function(e) { handleChange('valueRatio.denominator.unit', e.target.value); }}
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {valueType === 'valueTime' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="time"
                label="Time Value"
                value={get(observation, 'valueTime', '')}
                onChange={function(e) { handleChange('valueTime', e.target.value); }}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
          )}

          {valueType === 'valueDateTime' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Date/Time Value"
                value={get(observation, 'valueDateTime') ? moment(get(observation, 'valueDateTime')).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={function(e) { handleChange('valueDateTime', e.target.value); }}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
          )}

          {valueType === 'valuePeriod' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Period Start"
                  value={get(observation, 'valuePeriod.start') ? moment(get(observation, 'valuePeriod.start')).format('YYYY-MM-DDTHH:mm') : ''}
                  onChange={function(e) { handleChange('valuePeriod.start', e.target.value); }}
                  InputLabelProps={{ shrink: true }}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Period End"
                  value={get(observation, 'valuePeriod.end') ? moment(get(observation, 'valuePeriod.end')).format('YYYY-MM-DDTHH:mm') : ''}
                  onChange={function(e) { handleChange('valuePeriod.end', e.target.value); }}
                  InputLabelProps={{ shrink: true }}
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {valueType === 'valueSampledData' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Sampled Data"
                value={get(observation, 'valueSampledData.data', '')}
                onChange={function(e) { handleChange('valueSampledData.data', e.target.value); }}
                helperText="E format: values separated by spaces"
                disabled={!isEditing}
              />
            </Grid>
          )}

          {valueType === 'valueAttachment' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Attachment URL"
                value={get(observation, 'valueAttachment.url', '')}
                onChange={function(e) { handleChange('valueAttachment.url', e.target.value); }}
                helperText="URL to the attached resource"
                disabled={!isEditing}
              />
            </Grid>
          )}

          {/* Device */}
          {props.showDeviceInputs !== false && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 1 }}>Device</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device Name"
                  value={get(observation, 'device.display', '')}
                  onChange={function(e) { handleChange('device.display', e.target.value); }}
                  helperText="e.g., Blood Pressure Monitor"
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Device Reference"
                  value={get(observation, 'device.reference', '')}
                  onChange={function(e) { handleChange('device.reference', e.target.value); }}
                  helperText="e.g., Device/12345"
                  disabled={!isEditing}
                />
              </Grid>
            </>
          )}

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(observation, 'note[0].text', '')}
              onChange={function(e) { handleChange('note[0].text', e.target.value); }}
              helperText="Additional notes about this observation"
              disabled={!isEditing}
            />
          </Grid>
        </Grid>

        {/* Inline Save/Cancel bar */}
        {isEditing && !isEmbedded && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveObservationButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Preview view with formatted read-only display
  function renderPreviewView() {
    const observationName = get(observation, 'code.coding[0].display', '') || get(observation, 'code.text', 'Unnamed Observation');
    const observationCode = get(observation, 'code.coding[0].code', '');
    const statusValue = get(observation, 'status', 'unknown');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');

    const patientDisplay = get(observation, 'subject.display', '');
    const patientReference = get(observation, 'subject.reference', '');
    const effectiveDate = get(observation, 'effectiveDateTime', '');
    const formattedDate = effectiveDate ? moment(effectiveDate).format('MMMM D, YYYY [at] h:mm A') : '';

    const categoryDisplay = get(observation, 'category[0].coding[0].display', '') || get(observation, 'category[0].text', '');
    const categoryCode = get(observation, 'category[0].coding[0].code', '');

    const performerDisplay = get(observation, 'performer[0].display', '');
    const performerReference = get(observation, 'performer[0].reference', '');

    const deviceDisplay = get(observation, 'device.display', '');
    const deviceReference = get(observation, 'device.reference', '');

    const noteText = get(observation, 'note[0].text', '');

    // Build value display string
    let valueDisplay = '';
    const quantityValue = get(observation, 'valueQuantity.value', '');
    const quantityUnit = get(observation, 'valueQuantity.unit', '');
    if (quantityValue !== '' && quantityValue !== null && quantityValue !== undefined) {
      valueDisplay = `${quantityValue} ${quantityUnit}`;
    } else if (get(observation, 'valueString')) {
      valueDisplay = get(observation, 'valueString');
    } else if (get(observation, 'valueCodeableConcept.coding[0].display')) {
      valueDisplay = get(observation, 'valueCodeableConcept.coding[0].display');
    } else if (get(observation, 'valueBoolean') !== null && get(observation, 'valueBoolean') !== undefined) {
      valueDisplay = String(get(observation, 'valueBoolean'));
    } else if (get(observation, 'valueInteger') !== null && get(observation, 'valueInteger') !== undefined) {
      valueDisplay = String(get(observation, 'valueInteger'));
    }

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Observation name + status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {observationName}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        {observationCode && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Code: {observationCode}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata: Patient left, Date right */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {(patientDisplay || patientReference) && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {patientDisplay || 'Unspecified'}
                </Typography>
                {patientReference && (
                  <Typography variant="caption" color="text.secondary">
                    {patientReference}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {formattedDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Effective Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedDate}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Category */}
        {(categoryDisplay || categoryCode) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Value */}
        {valueDisplay && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Value
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {valueDisplay}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Performer */}
        {(performerDisplay || performerReference) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Performer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {performerDisplay || 'Unspecified'}
              </Typography>
              {performerReference && (
                <Typography variant="caption" color="text.secondary">
                  {performerReference}
                </Typography>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Device */}
        {(deviceDisplay || deviceReference) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Device
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {deviceDisplay || 'Unspecified'}
              </Typography>
              {deviceReference && (
                <Typography variant="caption" color="text.secondary">
                  {deviceReference}
                </Typography>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Notes */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Notes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '100px'
            }}
          >
            {noteText || 'No notes provided.'}
          </Typography>
        </Box>

        <Divider />

        {/* Footer with record ID */}
        {isExistingRecord && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Observation ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="observationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

ObservationDetail.propTypes = {
  showPatientInputs: PropTypes.bool,
  showDeviceInputs: PropTypes.bool
};

export default ObservationDetail;

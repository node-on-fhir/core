// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/immunizations/ImmunizationDetail.jsx

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
  InputAdornment,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import DateRangeIcon from '@mui/icons-material/DateRange';

import { get, set } from 'lodash';
import moment from 'moment';

import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ImmunizationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const immunizationId = id;
  
  // Subscribe to immunizations data
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Immunizations', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('immunizations.all');
    }
    return handle.ready();
  }, []);
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [immunization, setImmunization] = useState({
    resourceType: "Immunization",
    status: "completed",
    vaccineCode: {
      coding: [{
        system: "http://hl7.org/fhir/sid/cvx",
        code: "",
        display: ""
      }],
      text: ""
    },
    patient: {
      reference: "",
      display: ""
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    primarySource: true,
    lotNumber: "",
    expirationDate: "",
    site: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-ActSite",
        code: "",
        display: ""
      }],
      text: ""
    },
    route: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration",
        code: "",
        display: ""
      }],
      text: ""
    },
    doseQuantity: {
      value: null,
      unit: "",
      system: "http://unitsofmeasure.org",
      code: ""
    },
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    manufacturer: {
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
      setImmunization(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchPatientOpen, setSearchPatientOpen] = useState(false);

  // Set patient name and performer on component mount for new immunizations
  useEffect(function() {
    if (!immunizationId || immunizationId === 'new') {
      // Enable editing for new immunizations
      setIsEditing(true);
      
      // For new immunizations, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
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
      
      setImmunization(prev => ({
        ...prev,
        patient: {
          reference: patientReference,
          display: patientName
        },
        performer: [{
          actor: {
            reference: performerReference,
            display: performerName
          }
        }]
      }));
    } else {
      // Viewing existing immunization - start in read-only mode
      setIsEditing(false);
    }
  }, [immunizationId, selectedPatient, currentUser]);

  // Load immunization if editing
  useEffect(function() {
    if (immunizationId && immunizationId !== 'new') {
      // Load immediately if data exists - don't wait for subscription
      const existingImmunization = Immunizations.findOne({_id: immunizationId});

      if (existingImmunization) {
        setImmunization(existingImmunization);
        setIsEditing(false);
      } else {
        // Fallback: try finding by id field
        const immunizationById = Immunizations.findOne({id: immunizationId});
        if (immunizationById) {
          setImmunization(immunizationById);
          setIsEditing(false);
        }
      }
    }
  }, [immunizationId]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedImmunization = { ...immunization };
    set(updatedImmunization, path, value);
    
    // Special handling for patient display to ensure reference is set
    if (path === 'patient.display' && selectedPatient) {
      const patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
      set(updatedImmunization, 'patient.reference', patientReference);
    }
    
    setImmunization(updatedImmunization);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedImmunization);
    }
  }

  // Handle search for patient
  function handleSearchUser() {
    console.log('Search for patient - to be implemented');
    // TODO: Implement patient search modal
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        resourceType: "Immunization",
        status: get(immunization, 'status', 'completed'),
        vaccineCode: get(immunization, 'vaccineCode'),
        patient: get(immunization, 'patient'),
        occurrenceDateTime: get(immunization, 'occurrenceDateTime'),
        primarySource: get(immunization, 'primarySource', true),
        lotNumber: get(immunization, 'lotNumber'),
        expirationDate: get(immunization, 'expirationDate'),
        site: get(immunization, 'site'),
        route: get(immunization, 'route'),
        doseQuantity: get(immunization, 'doseQuantity'),
        performer: get(immunization, 'performer'),
        manufacturer: get(immunization, 'manufacturer'),
        note: get(immunization, 'note')
      };

      console.log('ImmunizationDetail - Saving immunization...');
      console.log('Selected patient:', selectedPatient);
      console.log('Patient reference before check:', get(dataToSave, 'patient.reference'));

      // Ensure patient reference is set if we have a selected patient
      // Check for empty string as well as undefined/null
      if ((!dataToSave.patient?.reference || dataToSave.patient.reference === '') && selectedPatient) {
        const patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
        console.log('Setting patient reference to:', patientReference);
        dataToSave.patient = {
          reference: patientReference,
          display: get(dataToSave, 'patient.display', '') ||
                  get(selectedPatient, 'name[0].text', '') ||
                  `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim()
        };
      }

      console.log('Final data to save:', JSON.stringify(dataToSave, null, 2));
      
      // Ensure we have proper CodeableConcepts
      if (dataToSave.vaccineCode && !dataToSave.vaccineCode.coding) {
        dataToSave.vaccineCode = {
          coding: [{
            system: "http://hl7.org/fhir/sid/cvx",
            code: dataToSave.vaccineCode,
            display: dataToSave.vaccineCode
          }],
          text: dataToSave.vaccineCode
        };
      }
      
      if (immunizationId && immunizationId !== 'new') {
        // Update existing immunization
        await Meteor.callAsync('updateImmunization', immunizationId, dataToSave);
        console.log('Immunization updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new immunization
        const newId = await Meteor.callAsync('createImmunization', dataToSave);
        console.log('Immunization created with ID:', newId);
        // Navigate back to immunizations list for new immunizations
        navigate('/immunizations');
      }
    } catch (err) {
      console.error('Error saving immunization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!immunizationId || immunizationId === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this immunization record?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeImmunization', immunizationId);
        console.log('Immunization deleted successfully');
        navigate('/immunizations');
      } catch (err) {
        console.error('Error deleting immunization:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancelButton() {
    if (immunizationId && immunizationId !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      const existingImmunization = Immunizations.findOne({_id: immunizationId});
      if (existingImmunization) {
        setImmunization(existingImmunization);
      }
    } else {
      // For new immunizations, go back
      navigate('/immunizations');
    }
  }

  const statusOptions = [
    { value: 'completed', label: 'Completed' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'not-done', label: 'Not Done' }
  ];

  const siteOptions = [
    { value: 'LA', code: 'LA', label: 'Left arm' },
    { value: 'RA', code: 'RA', label: 'Right arm' },
    { value: 'LD', code: 'LD', label: 'Left deltoid' },
    { value: 'RD', code: 'RD', label: 'Right deltoid' },
    { value: 'LT', code: 'LT', label: 'Left thigh' },
    { value: 'RT', code: 'RT', label: 'Right thigh' },
    { value: 'LG', code: 'LG', label: 'Left gluteus medius' },
    { value: 'RG', code: 'RG', label: 'Right gluteus medius' }
  ];

  const routeOptions = [
    { value: 'IM', code: 'IM', label: 'Intramuscular' },
    { value: 'PO', code: 'PO', label: 'Oral' },
    { value: 'SC', code: 'SC', label: 'Subcutaneous' },
    { value: 'ID', code: 'ID', label: 'Intradermal' },
    { value: 'IN', code: 'IN', label: 'Intranasal' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={get(immunization, 'patient.display', '')}
          onChange={(e) => handleChange('patient.display', e.target.value)}
          helperText={get(immunization, 'patient.reference', '') || 'Patient reference will be assigned'}
          disabled={!isEditing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Search for patient">
                  <IconButton
                    onClick={handleSearchUser}
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

        <Stack direction="row" spacing={2}>
          <TextField
            id="vaccineDisplay"
            fullWidth
            label="Vaccine Name"
            value={get(immunization, 'vaccineCode.text', '') ||
                   get(immunization, 'vaccineCode.coding[0].display', '')}
            onChange={(e) => {
              handleChange('vaccineCode.text', e.target.value);
              handleChange('vaccineCode.coding[0].display', e.target.value);
            }}
            helperText="Name of the vaccine administered"
            disabled={!isEditing}
          />

          <TextField
            id="vaccineCode"
            fullWidth
            label="CVX Code"
            value={get(immunization, 'vaccineCode.coding[0].code', '')}
            onChange={(e) => handleChange('vaccineCode.coding[0].code', e.target.value)}
            helperText="CVX vaccine code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup CVX codes">
                    <IconButton
                      onClick={() => window.open('https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx', '_blank')}
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
        </Stack>

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="statusSelect-label">Status</InputLabel>
            <Select
              labelId="statusSelect-label"
              id="statusSelect"
              value={get(immunization, 'status', 'completed')}
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
            id="occurrenceDateTime"
            fullWidth
            type="datetime-local"
            label="Administration Date/Time"
            value={moment(get(immunization, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
            onChange={(e) => handleChange('occurrenceDateTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        <FormControlLabel
          control={
            <Checkbox
              id="primarySource"
              checked={get(immunization, 'primarySource', true)}
              onChange={(e) => handleChange('primarySource', e.target.checked)}
              disabled={!isEditing}
            />
          }
          label="Primary Source (indicates information obtained from the person who administered the vaccine)"
        />

        <Stack direction="row" spacing={2}>
          <TextField
            id="lotNumber"
            fullWidth
            label="Lot Number"
            value={get(immunization, 'lotNumber', '')}
            onChange={(e) => handleChange('lotNumber', e.target.value)}
            disabled={!isEditing}
          />

          <TextField
            id="expirationDate"
            fullWidth
            type="date"
            label="Expiration Date"
            value={moment(get(immunization, 'expirationDate', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('expirationDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        <TextField
          id="manufacturerDisplay"
          fullWidth
          label="Manufacturer"
          value={get(immunization, 'manufacturer.display', '')}
          onChange={(e) => handleChange('manufacturer.display', e.target.value)}
          helperText="e.g., Pfizer, Moderna, Johnson & Johnson"
          disabled={!isEditing}
        />

        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="siteSelect-label">Injection Site</InputLabel>
            <Select
              labelId="siteSelect-label"
              id="siteSelect"
              value={get(immunization, 'site.coding[0].code', '')}
              onChange={(e) => {
                const selectedSite = siteOptions.find(opt => opt.code === e.target.value);
                handleChange('site.coding[0].code', e.target.value);
                handleChange('site.coding[0].display', selectedSite?.label || '');
                handleChange('site.text', selectedSite?.label || '');
              }}
              label="Injection Site"
            >
              {siteOptions.map(option => (
                <MenuItem key={option.code} value={option.code}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="routeSelect-label">Route</InputLabel>
            <Select
              labelId="routeSelect-label"
              id="routeSelect"
              value={get(immunization, 'route.coding[0].code', '')}
              onChange={(e) => {
                const selectedRoute = routeOptions.find(opt => opt.code === e.target.value);
                handleChange('route.coding[0].code', e.target.value);
                handleChange('route.coding[0].display', selectedRoute?.label || '');
                handleChange('route.text', selectedRoute?.label || '');
              }}
              label="Route"
            >
              {routeOptions.map(option => (
                <MenuItem key={option.code} value={option.code}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            id="doseQuantityValue"
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(immunization, 'doseQuantity.value', '')}
            onChange={(e) => handleChange('doseQuantity.value', parseFloat(e.target.value) || null)}
            disabled={!isEditing}
          />

          <TextField
            id="doseQuantityUnit"
            fullWidth
            label="Dose Unit"
            value={get(immunization, 'doseQuantity.unit', '')}
            onChange={(e) => {
              handleChange('doseQuantity.unit', e.target.value);
              handleChange('doseQuantity.code', e.target.value);
            }}
            helperText="e.g., mL, mg"
            disabled={!isEditing}
          />
        </Stack>

        <TextField
          id="performerDisplay"
          fullWidth
          label="Administered By"
          value={get(immunization, 'performer[0].actor.display', '')}
          onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
          helperText={get(immunization, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />

        <TextField
          id="noteText"
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(immunization, 'note[0].text', '')}
          onChange={(e) => handleChange('note[0].text', e.target.value)}
          helperText="Additional notes about this immunization"
          disabled={!isEditing}
        />
      </Stack>
    );
  }

  return (
    <Container id="immunizationDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={immunizationId && immunizationId !== 'new' ? 'Edit Immunization' : 'New Immunization'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(immunizationId && immunizationId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{immunizationId}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <TextField
              id="subjectDisplay"
              fullWidth
              label="Patient"
              value={get(immunization, 'patient.display', '')}
              onChange={(e) => handleChange('patient.display', e.target.value)}
              helperText={get(immunization, 'patient.reference', '') || 'Patient reference will be assigned'}
              disabled={!isEditing}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Search for patient">
                      <IconButton
                        onClick={handleSearchUser}
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
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="vaccineDisplay"
                fullWidth
                label="Vaccine Name"
                value={get(immunization, 'vaccineCode.text', '') || 
                       get(immunization, 'vaccineCode.coding[0].display', '')}
                onChange={(e) => {
                  handleChange('vaccineCode.text', e.target.value);
                  handleChange('vaccineCode.coding[0].display', e.target.value);
                }}
                helperText="Name of the vaccine administered"
                disabled={!isEditing}
              />
              
              <TextField
                id="vaccineCode"
                fullWidth
                label="CVX Code"
                value={get(immunization, 'vaccineCode.coding[0].code', '')}
                onChange={(e) => handleChange('vaccineCode.coding[0].code', e.target.value)}
                helperText="CVX vaccine code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup CVX codes">
                        <IconButton
                          onClick={() => window.open('https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx', '_blank')}
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
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel id="statusSelect-label">Status</InputLabel>
                <Select
                  labelId="statusSelect-label"
                  id="statusSelect"
                  value={get(immunization, 'status', 'completed')}
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
                id="occurrenceDateTime"
                fullWidth
                type="datetime-local"
                label="Administration Date/Time"
                value={moment(get(immunization, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('occurrenceDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <FormControlLabel
              control={
                <Checkbox
                  id="primarySource"
                  checked={get(immunization, 'primarySource', true)}
                  onChange={(e) => handleChange('primarySource', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="Primary Source (indicates information obtained from the person who administered the vaccine)"
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="lotNumber"
                fullWidth
                label="Lot Number"
                value={get(immunization, 'lotNumber', '')}
                onChange={(e) => handleChange('lotNumber', e.target.value)}
                disabled={!isEditing}
              />
              
              <TextField
                id="expirationDate"
                fullWidth
                type="date"
                label="Expiration Date"
                value={moment(get(immunization, 'expirationDate', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('expirationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="manufacturerDisplay"
              fullWidth
              label="Manufacturer"
              value={get(immunization, 'manufacturer.display', '')}
              onChange={(e) => handleChange('manufacturer.display', e.target.value)}
              helperText="e.g., Pfizer, Moderna, Johnson & Johnson"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel id="siteSelect-label">Injection Site</InputLabel>
                <Select
                  labelId="siteSelect-label"
                  id="siteSelect"
                  value={get(immunization, 'site.coding[0].code', '')}
                  onChange={(e) => {
                    const selectedSite = siteOptions.find(opt => opt.code === e.target.value);
                    handleChange('site.coding[0].code', e.target.value);
                    handleChange('site.coding[0].display', selectedSite?.label || '');
                    handleChange('site.text', selectedSite?.label || '');
                  }}
                  label="Injection Site"
                >
                  {siteOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel id="routeSelect-label">Route</InputLabel>
                <Select
                  labelId="routeSelect-label"
                  id="routeSelect"
                  value={get(immunization, 'route.coding[0].code', '')}
                  onChange={(e) => {
                    const selectedRoute = routeOptions.find(opt => opt.code === e.target.value);
                    handleChange('route.coding[0].code', e.target.value);
                    handleChange('route.coding[0].display', selectedRoute?.label || '');
                    handleChange('route.text', selectedRoute?.label || '');
                  }}
                  label="Route"
                >
                  {routeOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="doseQuantityValue"
                fullWidth
                type="number"
                label="Dose Amount"
                value={get(immunization, 'doseQuantity.value', '')}
                onChange={(e) => handleChange('doseQuantity.value', parseFloat(e.target.value) || null)}
                disabled={!isEditing}
              />
              
              <TextField
                id="doseQuantityUnit"
                fullWidth
                label="Dose Unit"
                value={get(immunization, 'doseQuantity.unit', '')}
                onChange={(e) => {
                  handleChange('doseQuantity.unit', e.target.value);
                  handleChange('doseQuantity.code', e.target.value);
                }}
                helperText="e.g., mL, mg"
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              id="performerDisplay"
              fullWidth
              label="Administered By"
              value={get(immunization, 'performer[0].actor.display', '')}
              onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
              helperText={get(immunization, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              id="noteText"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(immunization, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about this immunization"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && immunizationId && immunizationId !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/immunizations')}
              >
                Back
              </Button>
              <Button 
                onClick={handleDeleteButton}
                color="error"
                disabled={loading}
              >
                Delete
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
                onClick={handleCancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                id="saveImmunizationButton"
                onClick={handleSaveButton}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (immunizationId && immunizationId !== 'new' ? 'Update' : 'Save')}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ImmunizationDetail;
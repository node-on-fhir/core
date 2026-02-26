// /imports/ui-fhir/conditions/ConditionDetail.jsx

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
  Tooltip,
  Paper,
  Alert,
  Grid,
  Dialog
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Get the Patients collection 
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

// Get the Conditions collection from Meteor.Collections
let Conditions;
Meteor.startup(function(){
  Conditions = Meteor.Collections.Conditions;
});

function ConditionDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  
  // Subscribe to conditions and patients data
  const subscriptionReady = useTracker(() => {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    const conditionsHandle = Meteor.subscribe('conditions.all');
    const patientsHandle = Meteor.subscribe('patients.search', {});
    return conditionsHandle.ready() && patientsHandle.ready();
  }, []);

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [condition, setCondition] = useState({
    resourceType: "Condition",
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    asserter: {
      reference: "",
      display: ""
    },
    recordedDate: moment().format('YYYY-MM-DD'),
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    clinicalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "active",
        display: "Active"
      }]
    },
    verificationStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "confirmed",
        display: "Confirmed"
      }]
    },
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/condition-category",
        code: "problem-list-item",
        display: "Problem List Item"
      }]
    }],
    severity: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    },
    onsetDateTime: moment().format('YYYY-MM-DD'),
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  // Use JSON comparison to avoid infinite re-render loop:
  // parent re-parses JSON each render → new object ref → without this guard,
  // setCondition fires → onResourceChange fires → parent re-renders → loop
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setCondition(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter
  
  // Debug effect to monitor condition changes (standalone only)
  useEffect(() => {
    if (isEmbedded) return;
    console.log('=== Condition state changed ===');
    console.log('Full condition:', JSON.stringify(condition, null, 2));
    console.log('Subject display:', get(condition, 'subject.display'));
    console.log('Subject reference:', get(condition, 'subject.reference'));
    console.log('================================');
  }, [condition]);


  // Set initial state and asserter on component mount (standalone only)
  useEffect(function() {
    if (isEmbedded) return; // Resource comes from props in embedded mode
    if (!id || id === 'new') {
      // Enable editing for new conditions
      setIsEditing(true);
      
      // For new conditions, set patient from session if available
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient || selectedPatientId) {
        // Handle both FHIR and flat patient structures
        if (selectedPatient) {
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
            patientName = FhirUtilities.pluckName(selectedPatient);
          }
        }
        
        // Use FHIR id for reference
        // Priority: selectedPatient.id > selectedPatientId > selectedPatient._id
        let fhirId = get(selectedPatient, 'id');
        if (!fhirId && selectedPatientId) {
          fhirId = selectedPatientId;
        }
        if (!fhirId && selectedPatient && selectedPatient._id) {
          // Fallback to MongoDB _id if no FHIR id
          fhirId = typeof selectedPatient._id === 'object' && selectedPatient._id._str 
            ? selectedPatient._id._str 
            : String(selectedPatient._id);
        }
        
        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
          console.log('Setting patient reference:', patientReference);
          console.log('Patient FHIR id:', fhirId);
          console.log('Patient name:', patientName);
        }
      }
      
      // Set asserter to current user
      let asserterName = '';
      let asserterReference = '';
      
      if (currentUser) {
        asserterName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        asserterReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setCondition(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        asserter: {
          reference: asserterReference,
          display: asserterName
        }
      }));
    } else {
      // Viewing existing condition - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load condition if editing (standalone only)
  useEffect(function() {
    if (isEmbedded) return; // Resource comes from props in embedded mode
    async function loadCondition() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          console.log('ConditionDetail: Loading condition with ID:', id);
          const result = await Meteor.callAsync('conditions.get', id);
          if (result) {
            console.log('ConditionDetail: Loaded condition:', result);
            setCondition(result);
            setError(null); // Clear any previous errors
          }
        } catch (err) {
          console.error('ConditionDetail: Error loading condition:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadCondition();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    pendingUpdate.current = true;
    setCondition(prevCondition => {
      const updatedCondition = JSON.parse(JSON.stringify(prevCondition)); // Deep clone
      set(updatedCondition, path, value);
      console.log('Updated condition:', updatedCondition);
      return updatedCondition;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(condition);
    }
  }, [condition]);


  // Handle search for users/patients
  function handleSearchUser() {
    console.log('Opening patient search dialog...');
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    console.log('=== handlePatientSelect called ===');
    console.log('Selected patient ID:', patientId);
    console.log('Selected patient object:', patient);
    console.log('Patient object type:', typeof patient);
    console.log('Patient object keys:', patient ? Object.keys(patient) : 'null');
    console.log('Current condition before update:', JSON.stringify(condition.subject));
    
    try {
      if (patient) {
        // Extract patient name - handle both FHIR structure and flat structure
        let patientName = '';
        
        // Check if it's a flat structure (from PatientsTable)
        if (typeof patient.name === 'string') {
          patientName = patient.name;
          console.log('Using flat structure name:', patientName);
        } else if (patient.name && Array.isArray(patient.name)) {
          // FHIR structure
          patientName = FhirUtilities.pluckName(patient);
          console.log('Using FHIR structure name:', patientName);
        } else {
          // Fallback - try to construct from other fields
          patientName = patient.id || patientId;
        }
        
        console.log('Final patient name:', patientName);
        
        // Update the condition with selected patient
        console.log('Updating condition subject...');
        // Update both fields at once to ensure consistency
        setCondition(prevCondition => {
          console.log('Previous condition in setState:', prevCondition);
          const updated = JSON.parse(JSON.stringify(prevCondition));
          
          // Use FHIR id for reference
          // Priority: patient.id > patientId > patient._id
          let fhirId = patient.id;
          if (!fhirId && patientId) {
            fhirId = patientId;
          }
          if (!fhirId && patient._id) {
            // Fallback to MongoDB _id if no FHIR id
            fhirId = typeof patient._id === 'object' && patient._id._str 
              ? patient._id._str 
              : String(patient._id);
          }
          console.log('Using FHIR ID for reference:', fhirId);
          
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          console.log('Updated condition in setState:', updated);
          console.log('Subject after update:', updated.subject);
          return updated;
        });
        
        // Force a re-render to ensure UI updates
        setForceUpdate(prev => prev + 1);
        
        // Close the dialog after a small delay to ensure state update completes
        setTimeout(() => {
          setPatientSearchOpen(false);
        }, 100);
        return; // Exit early to avoid closing dialog twice
      } else {
        // If patient object not provided, try to find it
        if (Patients) {
          const foundPatient = Patients.findOne({_id: patientId});
          if (foundPatient) {
            const patientName = FhirUtilities.pluckName(foundPatient);
            handleChange('subject.reference', `Patient/${patientId}`);
            handleChange('subject.display', patientName);
          } else {
            // Fallback to just ID
            handleChange('subject.reference', `Patient/${patientId}`);
            handleChange('subject.display', 'Patient ' + patientId);
          }
        } else {
          // No Patients collection available
          handleChange('subject.reference', `Patient/${patientId}`);
          handleChange('subject.display', 'Patient ' + patientId);
        }
      }
    } catch (error) {
      console.error('Error handling patient selection:', error);
      setError('Failed to select patient');
    }
    
    // Close the dialog
    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    // Debug log the condition being saved
    console.log('=== handleSave called ===');
    console.log('Condition to save:', JSON.stringify(condition, null, 2));
    console.log('Subject display:', get(condition, 'subject.display'));
    console.log('Subject reference:', get(condition, 'subject.reference'));
    console.log('SNOMED code:', get(condition, 'code.coding[0].code'));
    console.log('SNOMED display:', get(condition, 'code.coding[0].display'));
    console.log('Full code object:', JSON.stringify(condition.code, null, 2));
    
    try {
      if (id && id !== 'new') {
        // Update existing condition
        await Meteor.callAsync('conditions.update', id, condition);
        console.log('Condition updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new condition
        const newId = await Meteor.callAsync('conditions.create', condition);
        console.log('Condition created with ID:', newId);
        // Navigate back to conditions list for new conditions
        navigate('/conditions');
      }
    } catch (err) {
      console.error('Error saving condition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this condition?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('conditions.remove', id);
        console.log('Condition deleted successfully');
        navigate('/conditions');
      } catch (err) {
        console.error('Error deleting condition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/conditions');
  }

  const clinicalStatusOptions = [
    { code: 'active', display: 'Active' },
    { code: 'recurrence', display: 'Recurrence' },
    { code: 'relapse', display: 'Relapse' },
    { code: 'inactive', display: 'Inactive' },
    { code: 'remission', display: 'Remission' },
    { code: 'resolved', display: 'Resolved' }
  ];

  const verificationStatusOptions = [
    { code: 'unconfirmed', display: 'Unconfirmed' },
    { code: 'provisional', display: 'Provisional' },
    { code: 'differential', display: 'Differential' },
    { code: 'confirmed', display: 'Confirmed' },
    { code: 'refuted', display: 'Refuted' },
    { code: 'entered-in-error', display: 'Entered in Error' }
  ];

  const categoryOptions = [
    { code: 'problem-list-item', display: 'Problem List Item' },
    { code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }
  ];

  // Embedded mode: return only the form fields, no page chrome
  if (isEmbedded) {
    return (
      <Grid container spacing={3}>
        {/* Patient and Asserter */}
        <Grid item xs={12} sm={6}>
          <TextField
            id="patientDisplay"
            fullWidth
            label="Patient Name"
            value={get(condition, 'subject.display', '')}
            onChange={(e) => handleChange('subject.display', e.target.value)}
            helperText={get(condition, 'subject.reference', '') || 'Patient reference will be assigned'}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="asserterDisplay"
            fullWidth
            label="Asserter Name"
            value={get(condition, 'asserter.display', '')}
            onChange={(e) => handleChange('asserter.display', e.target.value)}
            helperText={get(condition, 'asserter.reference', '') || 'Practitioner reference will be assigned'}
          />
        </Grid>

        {/* Onset and Recorded Dates */}
        <Grid item xs={12} sm={6}>
          <TextField
            id="onsetDate"
            fullWidth
            type="date"
            label="Onset Date"
            value={moment(get(condition, 'onsetDateTime', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('onsetDateTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            id="recordedDate"
            fullWidth
            type="date"
            label="Recorded Date"
            value={moment(get(condition, 'recordedDate', '')).format('YYYY-MM-DD')}
            onChange={(e) => handleChange('recordedDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* SNOMED Code and Condition Name */}
        <Grid item xs={12} sm={4}>
          <TextField
            id="snomedCode"
            fullWidth
            label="SNOMED Code"
            value={get(condition, 'code.coding[0].code', '')}
            onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
            helperText="SNOMED CT code"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            id="snomedDisplay"
            fullWidth
            label="Condition Name"
            value={get(condition, 'code.coding[0].display', '')}
            onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
            helperText="Human-readable name of the condition"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Clinical Status, Verification Status, Category */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Clinical Status</InputLabel>
            <Select
              id="clinicalStatus"
              value={get(condition, 'clinicalStatus.coding[0].code', 'active')}
              onChange={(e) => {
                const option = clinicalStatusOptions.find(o => o.code === e.target.value);
                handleChange('clinicalStatus.coding[0].code', option.code);
                handleChange('clinicalStatus.coding[0].display', option.display);
              }}
              label="Clinical Status"
            >
              {clinicalStatusOptions.map(option => (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Verification Status</InputLabel>
            <Select
              id="verificationStatus"
              value={get(condition, 'verificationStatus.coding[0].code', 'confirmed')}
              onChange={(e) => {
                const option = verificationStatusOptions.find(o => o.code === e.target.value);
                handleChange('verificationStatus.coding[0].code', option.code);
                handleChange('verificationStatus.coding[0].display', option.display);
              }}
              label="Verification Status"
            >
              {verificationStatusOptions.map(option => (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              id="category"
              value={get(condition, 'category[0].coding[0].code', 'problem-list-item')}
              onChange={(e) => {
                const option = categoryOptions.find(o => o.code === e.target.value);
                handleChange('category[0].coding[0].code', option.code);
                handleChange('category[0].coding[0].display', option.display);
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
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(condition, 'note[0].text', '')}
            onChange={(e) => handleChange('note[0].text', e.target.value)}
            helperText="Additional notes about the condition"
          />
        </Grid>
      </Grid>
    );
  }

  // Standalone mode: full page with Container, Card, CardHeader, etc.
  return (
    <Container id="conditionDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" className={id && id !== 'new' ? "barcode helveticas" : ""}>
                {id && id !== 'new' ? id : 'New Record'}
              </Typography>
              {id && id !== 'new' && (
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Lock/Edit icon */}
                  <Tooltip title={isEditing ? 'Edit Mode' : 'View Mode'}>
                    <IconButton 
                      size="small" 
                      sx={{ color: 'inherit' }}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <LockOpenIcon /> : <LockIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Last Updated */}
                  {get(condition, 'meta.lastUpdated') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption">
                        {moment(get(condition, 'meta.lastUpdated')).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Version */}
                  {get(condition, 'meta.versionId') && (
                    <Chip 
                      label={`v${get(condition, 'meta.versionId')}`} 
                      size="small" 
                      sx={{ height: '20px', color: 'inherit', borderColor: 'inherit' }}
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}
            </Box>
          }
          subheader={
            <Typography variant="subtitle2" sx={{ color: 'inherit', opacity: 0.9 }}>
              Condition
            </Typography>
          }
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3} sx={{ pt: 5 }}>
            {/* Patient and Asserter - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="patientDisplay"
                fullWidth
                label="Patient Name"
                value={get(condition, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                helperText={get(condition, 'subject.reference', '') || 'Patient reference will be assigned'}
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="asserterDisplay"
                fullWidth
                label="Asserter Name"
                value={get(condition, 'asserter.display', '')}
                onChange={(e) => handleChange('asserter.display', e.target.value)}
                helperText={get(condition, 'asserter.reference', '') || 'Practitioner reference will be assigned'}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Onset and Recorded Dates - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="onsetDate"
                fullWidth
                type="date"
                label="Onset Date"
                value={moment(get(condition, 'onsetDateTime', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('onsetDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="recordedDate"
                fullWidth
                type="date"
                label="Recorded Date"
                value={moment(get(condition, 'recordedDate', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('recordedDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* SNOMED Code (4) and Condition Name (8) */}
            <Grid item xs={12} sm={4}>
              <TextField
                id="snomedCode"
                fullWidth
                label="SNOMED Code"
                value={get(condition, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="SNOMED CT code"
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup codes with the SNOMED CT Browser">
                        <IconButton
                          onClick={() => window.open('http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007', '_blank')}
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
            
            <Grid item xs={12} sm={8}>
              <TextField
                id="snomedDisplay"
                fullWidth
                label="Condition Name"
                value={get(condition, 'code.coding[0].display', '')}
                onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
                helperText="Human-readable name of the condition"
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            {/* Clinical Status, Verification Status, Category - One third width each */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Clinical Status</InputLabel>
                <Select
                  id="clinicalStatus"
                  value={get(condition, 'clinicalStatus.coding[0].code', 'active')}
                  onChange={(e) => {
                    const option = clinicalStatusOptions.find(o => o.code === e.target.value);
                    handleChange('clinicalStatus.coding[0].code', option.code);
                    handleChange('clinicalStatus.coding[0].display', option.display);
                  }}
                  label="Clinical Status"
                >
                  {clinicalStatusOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Verification Status</InputLabel>
                <Select
                  id="verificationStatus"
                  value={get(condition, 'verificationStatus.coding[0].code', 'confirmed')}
                  onChange={(e) => {
                    const option = verificationStatusOptions.find(o => o.code === e.target.value);
                    handleChange('verificationStatus.coding[0].code', option.code);
                    handleChange('verificationStatus.coding[0].display', option.display);
                  }}
                  label="Verification Status"
                >
                  {verificationStatusOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Category</InputLabel>
                <Select
                  id="category"
                  value={get(condition, 'category[0].coding[0].code', 'problem-list-item')}
                  onChange={(e) => {
                    const option = categoryOptions.find(o => o.code === e.target.value);
                    handleChange('category[0].coding[0].code', option.code);
                    handleChange('category[0].coding[0].display', option.display);
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
            </Grid>
            
            {/* Notes - Full width */}
            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={get(condition, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                helperText="Additional notes about the condition"
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/conditions')}
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
                    // Reload the condition to discard changes
                    async function reloadCondition() {
                      try {
                        const result = await Meteor.callAsync('conditions.get', id);
                        if (result) {
                          setCondition(result);
                        }
                      } catch (err) {
                        console.error('Error reloading condition:', err);
                      }
                    }
                    reloadCondition();
                  } else {
                    // For new conditions, go back
                    navigate('/conditions');
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
      
      {/* Patient Search Dialog */}
      <Dialog 
        open={patientSearchOpen} 
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog 
          onSelect={handlePatientSelect}
          defaultSearchTerm={get(condition, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default ConditionDetail;
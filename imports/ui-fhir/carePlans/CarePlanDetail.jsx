// /imports/ui-fhir/carePlans/CarePlanDetail.jsx

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

// Get the CarePlans collection from Meteor.Collections
let CarePlans;
Meteor.startup(function(){
  CarePlans = Meteor.Collections.CarePlans;
});

function CarePlanDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to care plans and patients data
  const subscriptionReady = useTracker(() => {
    const carePlansHandle = Meteor.subscribe('careplans.all');
    const patientsHandle = Meteor.subscribe('patients.all');
    return carePlansHandle.ready() && patientsHandle.ready();
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
  const [carePlan, setCarePlan] = useState({
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    subject: {
      reference: "",
      display: ""
    },
    author: {
      reference: "",
      display: ""
    },
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    title: "",
    description: "",
    category: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "734163000",
        display: "Care plan"
      }],
      text: "Care plan"
    }],
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  
  // Debug effect to monitor care plan changes
  useEffect(() => {
    console.log('CarePlan state changed:', carePlan);
    console.log('Subject display:', get(carePlan, 'subject.display'));
    console.log('Subject reference:', get(carePlan, 'subject.reference'));
  }, [carePlan]);

  // Set initial state and author on component mount
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new care plans
      setIsEditing(true);
      
      // For new care plans, set patient from session if available
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient && selectedPatientId) {
        // Handle both FHIR and flat patient structures
        if (typeof selectedPatient.name === 'string') {
          patientName = selectedPatient.name;
        } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
          patientName = FhirUtilities.pluckName(selectedPatient);
        }
        patientReference = `Patient/${selectedPatientId}`;
      }
      
      // Set author to current user
      let authorName = '';
      let authorReference = '';
      
      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setCarePlan(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        author: {
          reference: authorReference,
          display: authorName
        }
      }));
    } else {
      // Viewing existing care plan - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load care plan if editing
  useEffect(function() {
    async function loadCarePlan() {
      if (id && id !== 'new' && CarePlans) {
        setLoading(true);
        try {
          console.log('CarePlanDetail: Loading care plan with ID:', id);
          const result = CarePlans.findOne({_id: id});
          if (result) {
            console.log('CarePlanDetail: Loaded care plan:', result);
            setCarePlan(result);
            setError(null); // Clear any previous errors
          }
        } catch (err) {
          console.error('CarePlanDetail: Error loading care plan:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadCarePlan();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    setCarePlan(prevCarePlan => {
      const updatedCarePlan = JSON.parse(JSON.stringify(prevCarePlan)); // Deep clone
      set(updatedCarePlan, path, value);
      console.log('Updated care plan:', updatedCarePlan);
      return updatedCarePlan;
    });
  }

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
    console.log('Current care plan before update:', carePlan);
    
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
        
        // Update the care plan with selected patient
        console.log('Updating care plan subject...');
        // Update both fields at once to ensure consistency
        setCarePlan(prevCarePlan => {
          console.log('Previous care plan in setState:', prevCarePlan);
          const updated = JSON.parse(JSON.stringify(prevCarePlan));
          set(updated, 'subject.reference', `Patient/${patientId}`);
          set(updated, 'subject.display', patientName);
          console.log('Updated care plan in setState:', updated);
          console.log('Subject after update:', updated.subject);
          return updated;
        });
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
    
    try {
      if (id && id !== 'new') {
        // Update existing care plan
        await Meteor.callAsync('updateCarePlan', id, carePlan);
        console.log('Care plan updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new care plan
        const newId = await Meteor.callAsync('createCarePlan', carePlan);
        console.log('Care plan created with ID:', newId);
        // Navigate back to care plans list for new care plans
        navigate('/careplans');
      }
    } catch (err) {
      console.error('Error saving care plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this care plan?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeCarePlan', id);
        console.log('Care plan deleted successfully');
        navigate('/careplans');
      } catch (err) {
        console.error('Error deleting care plan:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/careplans');
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'revoked', label: 'Revoked' },
    { value: 'completed', label: 'Completed' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const intentOptions = [
    { value: 'proposal', label: 'Proposal' },
    { value: 'plan', label: 'Plan' },
    { value: 'order', label: 'Order' },
    { value: 'option', label: 'Option' }
  ];

  return (
    <Container id="carePlanDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" className={id && id !== 'new' ? "barcode helveticas" : ""}>
                {id && id !== 'new' ? id : 'New Care Plan'}
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
                  {get(carePlan, 'meta.lastUpdated') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption">
                        {moment(get(carePlan, 'meta.lastUpdated')).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Version */}
                  {get(carePlan, 'meta.versionId') && (
                    <Chip 
                      label={`v${get(carePlan, 'meta.versionId')}`} 
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
              Care Plan Details
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
            {/* Patient and Author - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(carePlan, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                helperText={get(carePlan, 'subject.reference', '') || 'Patient reference will be assigned'}
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
                id="authorDisplay"
                fullWidth
                label="Author"
                value={get(carePlan, 'author.display', '')}
                onChange={(e) => handleChange('author.display', e.target.value)}
                helperText={get(carePlan, 'author.reference', '') || 'Practitioner reference will be assigned'}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Title - Full width */}
            <Grid item xs={12}>
              <TextField
                id="title"
                fullWidth
                label="Title"
                value={get(carePlan, 'title', '')}
                onChange={(e) => handleChange('title', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Status and Intent - Half width each */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(carePlan, 'status', 'active')}
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
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Intent</InputLabel>
                <Select
                  id="intent"
                  value={get(carePlan, 'intent', 'plan')}
                  onChange={(e) => handleChange('intent', e.target.value)}
                  label="Intent"
                >
                  {intentOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Category Code and Display - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="categoryCode"
                fullWidth
                label="Category Code (SNOMED)"
                value={get(carePlan, 'category[0].coding[0].code', '')}
                onChange={(e) => handleChange('category[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="categoryDisplay"
                fullWidth
                label="Category Display"
                value={get(carePlan, 'category[0].coding[0].display', '')}
                onChange={(e) => handleChange('category[0].coding[0].display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Description - Full width */}
            <Grid item xs={12}>
              <TextField
                id="description"
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={get(carePlan, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Start and End Dates - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodStart"
                fullWidth
                type="date"
                label="Start Date"
                value={moment(get(carePlan, 'period.start', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('period.start', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodEnd"
                fullWidth
                type="date"
                label="End Date"
                value={moment(get(carePlan, 'period.end', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('period.end', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Notes - Full width */}
            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={get(carePlan, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                helperText="Additional notes about the care plan"
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
                onClick={() => navigate('/careplans')}
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
                    // Reload the care plan to discard changes
                    if (CarePlans) {
                      const original = CarePlans.findOne({_id: id});
                      if (original) {
                        setCarePlan(original);
                      }
                    }
                  } else {
                    // For new care plans, go back
                    navigate('/careplans');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  id="deleteButton"
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                id="saveCarePlanButton"
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
          defaultSearchTerm={get(carePlan, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default CarePlanDetail;
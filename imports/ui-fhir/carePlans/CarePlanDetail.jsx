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
  Dialog,
  Divider
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

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
    author: [],
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
    }],
    activity: []
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
    console.log('=== Initial setup effect running ===');
    console.log('ID:', id);
    console.log('Current user:', currentUser);
    console.log('Current user ID:', currentUser?._id);
    console.log('Current user username:', currentUser?.username);
    
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
        console.log('Setting author from current user');
        console.log('Current user profile:', get(currentUser, 'profile'));
        console.log('Current user profile.name:', get(currentUser, 'profile.name'));
        
        // First try profile.name fields, then fall back to username
        const profileNameText = get(currentUser, 'profile.name.text', '');
        const profileNameParts = `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim();
        const username = get(currentUser, 'username', '');
        
        console.log('Profile name text:', profileNameText);
        console.log('Profile name parts:', profileNameParts);
        console.log('Username:', username);
        
        authorName = profileNameText || profileNameParts || username;
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
        
        console.log('Computed author name:', authorName);
        console.log('Computed author reference:', authorReference);
      } else {
        console.log('No current user available for author - will retry when user is available');
        // Don't set empty author - wait for currentUser to be available
        return;
      }
      
      console.log('Setting initial care plan with author:', { authorName, authorReference });
      
      setCarePlan(prev => {
        // Only update if we don't already have an author set
        const hasExistingAuthor = prev.author && prev.author.length > 0 && prev.author[0].display;
        
        const updated = {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          author: hasExistingAuthor ? prev.author : [{
            reference: authorReference,
            display: authorName
          }]
        };
        console.log('New care plan state:', updated);
        console.log('Has existing author:', hasExistingAuthor);
        console.log('Author array:', updated.author);
        return updated;
      });
    } else {
      // Viewing existing care plan - start in read-only mode
      setIsEditing(false);
    }
    
    console.log('=== End initial setup effect ===');
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
            
            // Handle legacy care plans where author might be an object instead of an array
            if (result.author && !Array.isArray(result.author)) {
              console.log('CarePlanDetail: Converting legacy author object to array');
              result.author = [result.author];
            }
            
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
  function handleAddActivity() {
    const newActivity = {
      detail: {
        kind: "Task",
        code: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }],
          text: ""
        },
        status: "not-started",
        description: "",
        reasonReference: [{
          reference: "",
          display: ""
        }],
        location: {
          reference: "",
          display: ""
        }
      }
    };
    
    setCarePlan(prev => ({
      ...prev,
      activity: [...(prev.activity || []), newActivity]
    }));
  }

  function handleRemoveActivity(index) {
    setCarePlan(prev => ({
      ...prev,
      activity: prev.activity.filter((_, i) => i !== index)
    }));
  }

  function handleActivityChange(index, path, value) {
    setCarePlan(prev => {
      const updatedActivities = [...prev.activity];
      set(updatedActivities[index], path, value);
      return {
        ...prev,
        activity: updatedActivities
      };
    });
  }

  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    
    // Add specific logging for author field changes
    if (path.startsWith('author')) {
      console.log('=== Author field change detected ===');
      console.log('Path:', path);
      console.log('New value:', value);
      console.log('Current author before change:', get(carePlan, 'author'));
    }
    
    setCarePlan(prevCarePlan => {
      const updatedCarePlan = JSON.parse(JSON.stringify(prevCarePlan)); // Deep clone
      set(updatedCarePlan, path, value);
      console.log('Updated care plan:', updatedCarePlan);
      
      // Log author field after update
      if (path.startsWith('author')) {
        console.log('Author after update:', get(updatedCarePlan, 'author'));
        console.log('=== End author field change ===');
      }
      
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
    console.log('=== handleSave called ===');
    console.log('Full care plan object before save:', carePlan);
    console.log('Author field:', get(carePlan, 'author'));
    console.log('Author[0].display:', get(carePlan, 'author[0].display'));
    console.log('Author[0].reference:', get(carePlan, 'author[0].reference'));
    console.log('Subject field:', get(carePlan, 'subject'));
    console.log('Subject.display:', get(carePlan, 'subject.display'));
    console.log('Subject.reference:', get(carePlan, 'subject.reference'));
    
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing care plan
        console.log('Updating care plan with ID:', id);
        console.log('Sending care plan to updateCarePlan:', carePlan);
        await Meteor.callAsync('updateCarePlan', id, carePlan);
        console.log('Care plan updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new care plan
        console.log('Creating new care plan');
        console.log('Sending care plan to createCarePlan:', carePlan);
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
    
    console.log('=== End handleSave ===');
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
                value={get(carePlan, 'author[0].display', '')}
                onChange={(e) => {
                  console.log('Author field onChange triggered');
                  console.log('New value:', e.target.value);
                  handleChange('author[0].display', e.target.value);
                }}
                helperText={get(carePlan, 'author[0].reference', '') || 'Practitioner reference will be assigned'}
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

          {/* Activities Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Activities</Typography>
              {isEditing && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddActivity}
                  variant="outlined"
                  size="small"
                >
                  Add Activity
                </Button>
              )}
            </Box>
            
            {(!carePlan.activity || carePlan.activity.length === 0) ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No activities defined yet. {isEditing && 'Click "Add Activity" to create one.'}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {carePlan.activity.map((activity, index) => (
                  <Paper key={index} sx={{ p: 2 }} variant="outlined">
                    <Grid container spacing={2}>
                      {/* Activity Header with Remove Button */}
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" color="primary">
                            Activity {index + 1}
                          </Typography>
                          {isEditing && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveActivity(index)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Grid>
                      
                      {/* Description */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={get(activity, 'detail.description', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.description', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                      
                      {/* Code and Display */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="SNOMED Code"
                          value={get(activity, 'detail.code.coding[0].code', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.code.coding[0].code', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Code Display"
                          value={get(activity, 'detail.code.coding[0].display', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.code.coding[0].display', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                      
                      {/* Status */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={get(activity, 'detail.status', 'not-started')}
                            onChange={(e) => handleActivityChange(index, 'detail.status', e.target.value)}
                            label="Status"
                            disabled={!isEditing}
                          >
                            <MenuItem value="not-started">Not Started</MenuItem>
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="in-progress">In Progress</MenuItem>
                            <MenuItem value="on-hold">On Hold</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                            <MenuItem value="stopped">Stopped</MenuItem>
                            <MenuItem value="unknown">Unknown</MenuItem>
                            <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Kind */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Kind</InputLabel>
                          <Select
                            value={get(activity, 'detail.kind', 'Task')}
                            onChange={(e) => handleActivityChange(index, 'detail.kind', e.target.value)}
                            label="Kind"
                            disabled={!isEditing}
                          >
                            <MenuItem value="Appointment">Appointment</MenuItem>
                            <MenuItem value="CommunicationRequest">Communication Request</MenuItem>
                            <MenuItem value="DeviceRequest">Device Request</MenuItem>
                            <MenuItem value="MedicationRequest">Medication Request</MenuItem>
                            <MenuItem value="NutritionOrder">Nutrition Order</MenuItem>
                            <MenuItem value="Task">Task</MenuItem>
                            <MenuItem value="ServiceRequest">Service Request</MenuItem>
                            <MenuItem value="VisionPrescription">Vision Prescription</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {/* Reason Reference */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Reason Reference"
                          value={get(activity, 'detail.reasonReference[0].reference', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.reasonReference[0].reference', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                          helperText="e.g., Condition/123"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Reason Display"
                          value={get(activity, 'detail.reasonReference[0].display', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.reasonReference[0].display', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                      
                      {/* Location */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Location Reference"
                          value={get(activity, 'detail.location.reference', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.location.reference', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                          helperText="e.g., Location/456"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Location Display"
                          value={get(activity, 'detail.location.display', '')}
                          onChange={(e) => handleActivityChange(index, 'detail.location.display', e.target.value)}
                          disabled={!isEditing}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
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
// /imports/ui-fhir/encounters/EncounterDetail.jsx

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

// Get the Encounters collection from Meteor.Collections
let Encounters;
Meteor.startup(function(){
  Encounters = Meteor.Collections.Encounters;
});

function EncounterDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to encounters and patients data
  const subscriptionReady = useTracker(() => {
    const encountersHandle = Meteor.subscribe('encounters.all');
    const patientsHandle = Meteor.subscribe('patients.all');
    return encountersHandle.ready() && patientsHandle.ready();
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
  const [encounter, setEncounter] = useState({
    resourceType: "Encounter",
    status: "in-progress",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "ambulatory",
      display: "Ambulatory"
    },
    type: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    subject: {
      reference: "",
      display: ""
    },
    participant: [{
      type: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
          code: "PPRF",
          display: "Primary performer"
        }]
      }],
      individual: {
        reference: "",
        display: ""
      }
    }],
    period: {
      start: moment().format('YYYY-MM-DDTHH:mm:ss'),
      end: moment().add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
    },
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  
  // Debug effect to monitor encounter changes
  useEffect(() => {
    console.log('Encounter state changed:', encounter);
    console.log('Subject display:', get(encounter, 'subject.display'));
    console.log('Subject reference:', get(encounter, 'subject.reference'));
  }, [encounter]);


  // Set initial state and practitioner on component mount
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new encounters
      setIsEditing(true);
      
      // For new encounters, set patient from session if available
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
      
      // Set practitioner to current user
      let practitionerName = '';
      let practitionerReference = '';
      
      if (currentUser) {
        practitionerName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        practitionerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setEncounter(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        participant: [{
          ...prev.participant[0],
          individual: {
            reference: practitionerReference,
            display: practitionerName
          }
        }]
      }));
    } else {
      // Viewing existing encounter - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load encounter if editing
  useEffect(function() {
    async function loadEncounter() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          console.log('EncounterDetail: Loading encounter with ID:', id);
          const result = await Meteor.callAsync('encounters.get', id);
          if (result) {
            console.log('EncounterDetail: Loaded encounter:', result);
            setEncounter(result);
            setError(null); // Clear any previous errors
          }
        } catch (err) {
          console.error('EncounterDetail: Error loading encounter:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadEncounter();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    setEncounter(prevEncounter => {
      const updatedEncounter = JSON.parse(JSON.stringify(prevEncounter)); // Deep clone
      set(updatedEncounter, path, value);
      console.log('Updated encounter:', updatedEncounter);
      return updatedEncounter;
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
    console.log('Current encounter before update:', encounter);
    
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
        
        // Update the encounter with selected patient
        console.log('Updating encounter subject...');
        // Update both fields at once to ensure consistency
        setEncounter(prevEncounter => {
          console.log('Previous encounter in setState:', prevEncounter);
          const updated = JSON.parse(JSON.stringify(prevEncounter));
          set(updated, 'subject.reference', `Patient/${patientId}`);
          set(updated, 'subject.display', patientName);
          console.log('Updated encounter in setState:', updated);
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
        // Update existing encounter
        await Meteor.callAsync('encounters.update', id, encounter);
        console.log('Encounter updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new encounter
        const newId = await Meteor.callAsync('encounters.create', encounter);
        console.log('Encounter created with ID:', newId);
        // Navigate back to encounters list for new encounters
        navigate('/encounters');
      }
    } catch (err) {
      console.error('Error saving encounter:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this encounter?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('encounters.remove', id);
        console.log('Encounter deleted successfully');
        navigate('/encounters');
      } catch (err) {
        console.error('Error deleting encounter:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/encounters');
  }

  const statusOptions = [
    { code: 'planned', display: 'Planned' },
    { code: 'arrived', display: 'Arrived' },
    { code: 'triaged', display: 'Triaged' },
    { code: 'in-progress', display: 'In Progress' },
    { code: 'onleave', display: 'On Leave' },
    { code: 'finished', display: 'Finished' },
    { code: 'cancelled', display: 'Cancelled' }
  ];

  const classOptions = [
    { code: 'ambulatory', display: 'Ambulatory' },
    { code: 'emergency', display: 'Emergency' },
    { code: 'field', display: 'Field' },
    { code: 'home health', display: 'Home Health' },
    { code: 'inpatient encounter', display: 'Inpatient Encounter' },
    { code: 'inpatient acute', display: 'Inpatient Acute' },
    { code: 'inpatient non-acute', display: 'Inpatient Non-Acute' },
    { code: 'pre-admission', display: 'Pre-Admission' },
    { code: 'short stay', display: 'Short Stay' },
    { code: 'virtual', display: 'Virtual' },
    { code: 'other', display: 'Other' }
  ];

  return (
    <Container id="encounterDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
                  {get(encounter, 'meta.lastUpdated') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption">
                        {moment(get(encounter, 'meta.lastUpdated')).format('MMM DD, YYYY HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Version */}
                  {get(encounter, 'meta.versionId') && (
                    <Chip 
                      label={`v${get(encounter, 'meta.versionId')}`} 
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
              Encounter
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
            {/* Patient and Practitioner - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient Name"
                value={get(encounter, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                helperText={get(encounter, 'subject.reference', '') || 'Patient reference will be assigned'}
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
                id="practitionerDisplay"
                fullWidth
                label="Practitioner Name"
                value={get(encounter, 'participant[0].individual.display', '')}
                onChange={(e) => handleChange('participant[0].individual.display', e.target.value)}
                helperText={get(encounter, 'participant[0].individual.reference', '') || 'Practitioner reference will be assigned'}
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Type Code (4) and Type Display (8) */}
            <Grid item xs={12} sm={4}>
              <TextField
                id="encounterType"
                fullWidth
                label="Type Code (SNOMED)"
                value={get(encounter, 'type[0].coding[0].code', '')}
                onChange={(e) => handleChange('type[0].coding[0].code', e.target.value)}
                helperText="SNOMED CT code for encounter type"
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                id="encounterTypeDisplay"
                fullWidth
                label="Type Description"
                value={get(encounter, 'type[0].coding[0].display', '')}
                onChange={(e) => handleChange('type[0].coding[0].display', e.target.value)}
                helperText="Human-readable encounter type"
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Status and Class - Half width each */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(encounter, 'status', 'in-progress')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Class</InputLabel>
                <Select
                  id="classCode"
                  value={get(encounter, 'class.code', 'ambulatory')}
                  onChange={(e) => {
                    const option = classOptions.find(o => o.code === e.target.value);
                    handleChange('class.code', option.code);
                    handleChange('class.display', option.display);
                  }}
                  label="Class"
                >
                  {classOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Reason Code (4) and Reason Display (8) */}
            <Grid item xs={12} sm={4}>
              <TextField
                id="reasonCode"
                fullWidth
                label="Reason Code (SNOMED)"
                value={get(encounter, 'reasonCode[0].coding[0].code', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
                helperText="SNOMED CT code for visit reason"
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <TextField
                id="reasonDisplay"
                fullWidth
                label="Reason for Visit"
                value={get(encounter, 'reasonCode[0].coding[0].display', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].display', e.target.value)}
                helperText="Human-readable reason for visit"
                disabled={!isEditing}
              />
            </Grid>
            
            {/* Start and End DateTime - Half width each */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="startDateTime"
                fullWidth
                type="datetime-local"
                label="Start Date/Time"
                value={moment(get(encounter, 'period.start', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('period.start', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="endDateTime"
                fullWidth
                type="datetime-local"
                label="End Date/Time"
                value={moment(get(encounter, 'period.end', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('period.end', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
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
                value={get(encounter, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                helperText="Additional notes about the encounter"
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
                onClick={() => navigate('/encounters')}
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
                    // Reload the encounter to discard changes
                    async function reloadEncounter() {
                      try {
                        const result = await Meteor.callAsync('encounters.get', id);
                        if (result) {
                          setEncounter(result);
                        }
                      } catch (err) {
                        console.error('Error reloading encounter:', err);
                      }
                    }
                    reloadEncounter();
                  } else {
                    // For new encounters, go back
                    navigate('/encounters');
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
                id="saveEncounterButton"
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
          defaultSearchTerm={get(encounter, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default EncounterDetail;
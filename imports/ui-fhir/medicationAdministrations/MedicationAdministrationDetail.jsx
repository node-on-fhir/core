// /imports/ui-fhir/medicationAdministrations/MedicationAdministrationDetail.jsx

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

import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function MedicationAdministrationDetail(props) {
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
  const [medicationAdministration, setMedicationAdministration] = useState({
    resourceType: "MedicationAdministration",
    status: "completed",
    subject: {
      reference: "",
      display: ""
    },
    effectiveDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    medicationCodeableConcept: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    dosage: {
      text: "",
      route: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      dose: {
        value: null,
        unit: "",
        system: "http://unitsofmeasure.org",
        code: ""
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and performer on component mount for new administrations
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new administrations
      setIsEditing(true);
      
      // For new administrations, set the patient name
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
      
      setMedicationAdministration(prev => ({
        ...prev,
        subject: {
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
      // Viewing existing administration - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load medication administration if editing
  useEffect(function() {
    async function loadMedicationAdministration() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('medicationAdministrations.get', id);
          if (result) {
            setMedicationAdministration(result);
          }
        } catch (err) {
          console.error('Error loading medication administration:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadMedicationAdministration();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedicationAdministration = { ...medicationAdministration };
    set(updatedMedicationAdministration, path, value);
    setMedicationAdministration(updatedMedicationAdministration);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing medication administration
        await Meteor.callAsync('medicationAdministrations.update', id, medicationAdministration);
        console.log('Medication administration updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication administration
        const newId = await Meteor.callAsync('medicationAdministrations.create', medicationAdministration);
        console.log('Medication administration created with ID:', newId);
        // Navigate back to medication administrations list for new administrations
        navigate('/medication-administrations');
      }
    } catch (err) {
      console.error('Error saving medication administration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this medication administration?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medicationAdministrations.remove', id);
        console.log('Medication administration deleted successfully');
        navigate('/medication-administrations');
      } catch (err) {
        console.error('Error deleting medication administration:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/medication-administrations');
  }

  const statusOptions = [
    { value: 'in-progress', label: 'In Progress' },
    { value: 'not-done', label: 'Not Done' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'stopped', label: 'Stopped' },
    { value: 'unknown', label: 'Unknown' }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Medication Administration' : 'New Medication Administration'}
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
            <TextField
              fullWidth
              label="Patient"
              value={get(medicationAdministration, 'subject.display', '')}
              helperText={get(medicationAdministration, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Medication Name"
                value={get(medicationAdministration, 'medicationCodeableConcept.text', '') || 
                       get(medicationAdministration, 'medicationCodeableConcept.coding[0].display', '')}
                onChange={(e) => handleChange('medicationCodeableConcept.text', e.target.value)}
                helperText="Name of the medication administered"
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Medication Code"
                value={get(medicationAdministration, 'medicationCodeableConcept.coding[0].code', '')}
                onChange={(e) => handleChange('medicationCodeableConcept.coding[0].code', e.target.value)}
                helperText="RxNorm code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup RxNorm codes">
                        <IconButton
                          onClick={() => window.open('https://mor.nlm.nih.gov/RxNav/', '_blank')}
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={get(medicationAdministration, 'status', 'completed')}
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
                label="Administration Date/Time"
                value={moment(get(medicationAdministration, 'effectiveDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>
            
            <TextField
              fullWidth
              label="Administered By"
              value={get(medicationAdministration, 'performer[0].actor.display', '')}
              onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
              helperText={get(medicationAdministration, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Dosage Instructions"
              value={get(medicationAdministration, 'dosage.text', '')}
              onChange={(e) => handleChange('dosage.text', e.target.value)}
              helperText="e.g., Take 2 tablets by mouth every 6 hours"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="number"
                label="Dose Amount"
                value={get(medicationAdministration, 'dosage.dose.value', '')}
                onChange={(e) => handleChange('dosage.dose.value', parseFloat(e.target.value) || null)}
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Dose Unit"
                value={get(medicationAdministration, 'dosage.dose.unit', '')}
                onChange={(e) => {
                  handleChange('dosage.dose.unit', e.target.value);
                  handleChange('dosage.dose.code', e.target.value);
                }}
                helperText="e.g., mg, mL, tablets"
                disabled={!isEditing}
              />
              
              <TextField
                fullWidth
                label="Route"
                value={get(medicationAdministration, 'dosage.route.coding[0].display', '')}
                onChange={(e) => handleChange('dosage.route.coding[0].display', e.target.value)}
                helperText="e.g., oral, IV, IM"
                disabled={!isEditing}
              />
            </Stack>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/medication-administrations')}
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
                    // Reload the medication administration to discard changes
                    async function reloadMedicationAdministration() {
                      try {
                        const result = await Meteor.callAsync('medicationAdministrations.get', id);
                        if (result) {
                          setMedicationAdministration(result);
                        }
                      } catch (err) {
                        console.error('Error reloading medication administration:', err);
                      }
                    }
                    reloadMedicationAdministration();
                  } else {
                    // For new medication administrations, go back
                    navigate('/medication-administrations');
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

export default MedicationAdministrationDetail;
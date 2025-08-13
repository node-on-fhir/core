// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/medias/MediaDetail.jsx

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

// Get the Medias collection from Meteor.Collections
let Medias;
Meteor.startup(function(){
  Medias = Meteor.Collections.Medias;
});

function MediaDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to medias and patients data
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.Medias', {}, {});
    } else {
      handle = Meteor.subscribe('medias.all');
    }
    return handle.ready();
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
  const [media, setMedia] = useState({
    resourceType: "Media",
    status: "completed",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/media-type",
        code: "photo",
        display: "Photo"
      }],
      text: "Photo"
    },
    modality: {
      coding: [{
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: "",
        display: ""
      }],
      text: ""
    },
    view: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    operator: [{
      reference: "",
      display: ""
    }],
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    bodySite: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    deviceName: "",
    device: {
      reference: "",
      display: ""
    },
    height: null,
    width: null,
    frames: null,
    duration: null,
    content: {
      contentType: "image/jpeg",
      url: "",
      size: null,
      title: ""
    },
    created: moment().format('YYYY-MM-DD'),
    issued: moment().format('YYYY-MM-DD'),
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(id === 'new'); // Start in edit mode for new medias
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter

  // Load media if editing
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new medias
      setIsEditing(true);
      
      // For new medias, set patient from session if available
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
      
      // Set operator to current user
      let operatorName = '';
      let operatorReference = '';
      
      if (currentUser) {
        operatorName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        operatorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setMedia(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        operator: [{
          reference: operatorReference,
          display: operatorName
        }]
      }));
    } else if (id && isSubscriptionReady) {
      // Load existing media
      const existingMedia = Medias.findOne({_id: id});
      if (existingMedia) {
        setMedia(existingMedia);
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady, currentUser, selectedPatient, selectedPatientId]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    setMedia(prevMedia => {
      const updatedMedia = JSON.parse(JSON.stringify(prevMedia)); // Deep clone
      set(updatedMedia, path, value);
      console.log('Updated media:', updatedMedia);
      return updatedMedia;
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
        
        // Update the media with selected patient
        console.log('Updating media subject...');
        setMedia(prevMedia => {
          const updated = JSON.parse(JSON.stringify(prevMedia));
          
          // Use FHIR id for reference
          let fhirId = patient.id;
          if (!fhirId && patientId) {
            fhirId = patientId;
          }
          if (!fhirId && patient._id) {
            fhirId = typeof patient._id === 'object' && patient._id._str 
              ? patient._id._str 
              : String(patient._id);
          }
          console.log('Using FHIR ID for reference:', fhirId);
          
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          console.log('Updated media in setState:', updated);
          console.log('Subject after update:', updated.subject);
          return updated;
        });
        
        // Force a re-render to ensure UI updates
        setForceUpdate(prev => prev + 1);
        
        // Close the dialog after a small delay to ensure state update completes
        setTimeout(() => {
          setPatientSearchOpen(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error handling patient selection:', error);
      setError('Failed to select patient');
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    // Debug log the media being saved
    console.log('=== handleSave called ===');
    console.log('Media to save:', JSON.stringify(media, null, 2));
    console.log('Subject display:', get(media, 'subject.display'));
    console.log('Subject reference:', get(media, 'subject.reference'));
    
    try {
      if (id && id !== 'new') {
        // Update existing media
        await Meteor.callAsync('updateMedia', id, media);
        console.log('Media updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new media
        const newId = await Meteor.callAsync('createMedia', media);
        console.log('Media created with ID:', newId);
        // Navigate back to medias list for new medias
        navigate('/medias');
      }
    } catch (err) {
      console.error('Error saving media:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    // In test environments, window.confirm might not work with Nightwatch's acceptAlert
    // So we add a small delay to ensure the alert is properly created
    const confirmed = window.confirm('Are you sure you want to delete this media?');
    
    if (confirmed) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeMedia', id);
        navigate('/medias');
      } catch (err) {
        console.error('Error deleting media:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }

  // Handle navigation
  function handleCancel() {
    if (id && id !== 'new') {
      // If editing existing media, just exit edit mode
      setIsEditing(false);
      // Reload the original data
      if (isSubscriptionReady) {
        const originalMedia = Medias.findOne({_id: id});
        if (originalMedia) {
          setMedia(originalMedia);
        }
      }
    } else {
      // If creating new media, navigate back to list
      navigate('/medias');
    }
  }

  function handleBack() {
    navigate('/medias');
  }

  // Render
  return (
    <Container id='mediaDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Media' : 'New Media'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="statusLabel">Status</InputLabel>
                <Select
                  id="statusSelect"
                  labelId="statusLabel"
                  value={get(media, 'status', 'completed')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="preparation">Preparation</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="not-done">Not Done</MenuItem>
                  <MenuItem value="on-hold">On Hold</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="typeLabel">Type</InputLabel>
                <Select
                  id="typeSelect"
                  labelId="typeLabel"
                  value={get(media, 'type.coding[0].code', 'photo')}
                  onChange={(e) => {
                    const typeMap = {
                      'image': 'Image',
                      'video': 'Video',
                      'audio': 'Audio',
                      'photo': 'Photo'
                    };
                    handleChange('type.coding[0].code', e.target.value);
                    handleChange('type.coding[0].display', typeMap[e.target.value]);
                    handleChange('type.text', typeMap[e.target.value]);
                  }}
                  disabled={!isEditing}
                  label="Type"
                >
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="photo">Photo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="modalityInput"
                fullWidth
                label="Modality Code"
                value={get(media, 'modality.coding[0].code', '')}
                onChange={(e) => handleChange('modality.coding[0].code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="modalityDisplayInput"
                fullWidth
                label="Modality Display"
                value={get(media, 'modality.coding[0].display', '') || get(media, 'modality.text', '')}
                onChange={(e) => {
                  handleChange('modality.coding[0].display', e.target.value);
                  handleChange('modality.text', e.target.value);
                }}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="viewInput"
                fullWidth
                label="View Code"
                value={get(media, 'view.coding[0].code', '')}
                onChange={(e) => handleChange('view.coding[0].code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="viewDisplayInput"
                fullWidth
                label="View Display"
                value={get(media, 'view.coding[0].display', '') || get(media, 'view.text', '')}
                onChange={(e) => {
                  handleChange('view.coding[0].display', e.target.value);
                  handleChange('view.text', e.target.value);
                }}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(media, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
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

            <Grid item xs={12} md={6}>
              <TextField
                id="operatorInput"
                fullWidth
                label="Operator Name"
                value={get(media, 'operator[0].display', '')}
                onChange={(e) => handleChange('operator[0].display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="operatorReferenceInput"
                fullWidth
                label="Operator Reference"
                value={get(media, 'operator[0].reference', '')}
                onChange={(e) => handleChange('operator[0].reference', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="reasonCodeInput"
                fullWidth
                label="Reason Code"
                value={get(media, 'reasonCode[0].text', '')}
                onChange={(e) => handleChange('reasonCode[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="reasonCodeDisplayInput"
                fullWidth
                label="Reason Code Display"
                value={get(media, 'reasonCode[0].coding[0].display', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="bodySiteInput"
                fullWidth
                label="Body Site"
                value={get(media, 'bodySite.text', '')}
                onChange={(e) => handleChange('bodySite.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="bodySiteDisplayInput"
                fullWidth
                label="Body Site Display"
                value={get(media, 'bodySite.coding[0].display', '')}
                onChange={(e) => handleChange('bodySite.coding[0].display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="deviceNameInput"
                fullWidth
                label="Device Name"
                value={get(media, 'deviceName', '')}
                onChange={(e) => handleChange('deviceName', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="deviceReferenceInput"
                fullWidth
                label="Device Reference"
                value={get(media, 'device.reference', '')}
                onChange={(e) => handleChange('device.reference', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                id="heightInput"
                fullWidth
                label="Height"
                type="number"
                value={get(media, 'height', '')}
                onChange={(e) => handleChange('height', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                id="widthInput"
                fullWidth
                label="Width"
                type="number"
                value={get(media, 'width', '')}
                onChange={(e) => handleChange('width', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                id="framesInput"
                fullWidth
                label="Frames"
                type="number"
                value={get(media, 'frames', '')}
                onChange={(e) => handleChange('frames', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                id="durationInput"
                fullWidth
                label="Duration (s)"
                type="number"
                value={get(media, 'duration', '')}
                onChange={(e) => handleChange('duration', e.target.value ? parseFloat(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="createdInput"
                fullWidth
                label="Created Date"
                type="date"
                value={moment(get(media, 'created', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('created', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="issuedInput"
                fullWidth
                label="Issued Date"
                type="date"
                value={moment(get(media, 'issued', '')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('issued', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="contentTypeInput"
                fullWidth
                label="Content Type"
                value={get(media, 'content.contentType', '')}
                onChange={(e) => handleChange('content.contentType', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="contentSizeInput"
                fullWidth
                label="Content Size (bytes)"
                type="number"
                value={get(media, 'content.size', '')}
                onChange={(e) => handleChange('content.size', e.target.value ? parseInt(e.target.value) : null)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="contentUrlInput"
                fullWidth
                label="Content URL"
                value={get(media, 'content.url', '')}
                onChange={(e) => handleChange('content.url', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="contentTitleInput"
                fullWidth
                label="Content Title"
                value={get(media, 'content.title', '')}
                onChange={(e) => handleChange('content.title', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={get(media, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button onClick={handleBack}>Back</Button>
              {id && id !== 'new' && (
                <>
                  <Button color="error" onClick={handleDelete}>Delete</Button>
                  <Button 
                    startIcon={<LockOpenIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button 
                id="saveMediaButton"
                variant="contained" 
                onClick={handleSave}
                disabled={loading}
              >
                {id && id !== 'new' ? 'Update' : 'Save'} Media
              </Button>
            </>
          )}
        </CardActions>
      </Card>

      <PatientSearchDialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default MediaDetail;
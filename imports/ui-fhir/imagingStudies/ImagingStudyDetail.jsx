// /imports/ui-fhir/imagingStudies/ImagingStudyDetail.jsx

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
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ImagingStudyDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const imagingStudyId = id;
  
  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to imaging studies
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.ImagingStudies', {}, {});
    } else {
      handle = Meteor.subscribe('imagingStudies.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [imagingStudy, setImagingStudy] = useState({
    resourceType: "ImagingStudy",
    status: "available",
    subject: {
      reference: "",
      display: ""
    },
    started: moment().format('YYYY-MM-DDTHH:mm'),
    modality: [{
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "",
      display: ""
    }],
    description: "",
    numberOfSeries: 1,
    numberOfInstances: 1,
    procedureCode: [{
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    }],
    referrer: {
      reference: "",
      display: ""
    },
    location: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient on component mount for new imaging studies
  useEffect(function() {
    if (!imagingStudyId || imagingStudyId === 'new') {
      // Enable editing for new imaging studies
      setIsEditing(true);
      
      // For new imaging studies, set the patient
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id, not MongoDB _id
        patientReference = `Patient/${get(selectedPatient, 'id', '')}`;
      }
      
      setImagingStudy(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          }
        };
      });
    }
  }, [imagingStudyId, selectedPatient]);

  // Load imaging study if editing existing one
  useEffect(function() {
    if (imagingStudyId && imagingStudyId !== 'new') {
      // Load immediately if data exists - don't wait for subscription
      const existingStudy = ImagingStudies.findOne({_id: imagingStudyId});

      if (existingStudy) {
        setImagingStudy(existingStudy);
        setIsEditing(false);
      } else {
        // Fallback: try finding by id field
        const studyById = ImagingStudies.findOne({id: imagingStudyId});
        if (studyById) {
          setImagingStudy(studyById);
          setIsEditing(false);
        }
      }
    }
  }, [imagingStudyId]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedImagingStudy = { ...imagingStudy };
    set(updatedImagingStudy, path, value);
    setImagingStudy(updatedImagingStudy);
  }

  // Handle search for patient
  function handleSearchUser() {
    console.log('Search for patient clicked');
    // This would open a patient search dialog
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for save
      let dataToSave = {
        status: get(imagingStudy, 'status', 'available'),
        description: get(imagingStudy, 'description', ''),
        started: get(imagingStudy, 'started', ''),
        subject: get(imagingStudy, 'subject', {}),
        modality: get(imagingStudy, 'modality[0].code', ''),
        modalityDisplay: get(imagingStudy, 'modality[0].display', ''),
        numberOfSeries: parseInt(get(imagingStudy, 'numberOfSeries', 1)) || 1,
        numberOfInstances: parseInt(get(imagingStudy, 'numberOfInstances', 1)) || 1
      };

      // Add procedure code if present
      if(get(imagingStudy, 'procedureCode[0].coding[0].code')){
        dataToSave.procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code');
        dataToSave.procedureCodeDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display') || 
                                          get(imagingStudy, 'procedureCode[0].text', '');
      }

      // Add referrer if present
      if(get(imagingStudy, 'referrer.display')){
        dataToSave.referrer = imagingStudy.referrer;
      }

      // Add interpreter if present
      if(get(imagingStudy, 'interpreter[0].display')){
        dataToSave.interpreter = get(imagingStudy, 'interpreter[0].display');
        dataToSave.interpreterReference = get(imagingStudy, 'interpreter[0].reference', '');
      }

      // Add encounter if present
      if(get(imagingStudy, 'encounter.reference')){
        dataToSave.encounter = imagingStudy.encounter;
      }

      // Add location if present
      if(get(imagingStudy, 'location.display')){
        dataToSave.location = imagingStudy.location;
      }

      // Add reason code if present
      if(get(imagingStudy, 'reasonCode[0].coding[0].code')){
        dataToSave.reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code');
        dataToSave.reasonCodeDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display') || 
                                       get(imagingStudy, 'reasonCode[0].text', '');
      }

      // Add endpoint if present
      if(get(imagingStudy, 'endpoint[0].display')){
        dataToSave.endpoint = get(imagingStudy, 'endpoint[0].display');
      }

      // Add notes if present
      if(get(imagingStudy, 'note[0].text')){
        dataToSave.notes = get(imagingStudy, 'note[0].text');
      }

      console.log('Saving imaging study with data:', JSON.stringify(dataToSave, null, 2));
      console.log('imagingStudy state:', JSON.stringify(imagingStudy, null, 2));

      if (imagingStudyId && imagingStudyId !== 'new') {
        // Update existing
        await Meteor.callAsync('updateImagingStudy', imagingStudyId, dataToSave);
        console.log('Imaging study updated successfully');
        // Stay on page but exit edit mode
        setIsEditing(false);
      } else {
        // Create new - call the method directly with the data object
        const newId = await Meteor.callAsync('createImagingStudy', dataToSave);
        console.log('Imaging study created with ID:', newId);
        // Navigate back to list after creating
        navigate('/imaging-studies');
      }
    } catch (err) {
      console.error('Error saving imaging study:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!imagingStudyId || imagingStudyId === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this imaging study?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeImagingStudy', imagingStudyId);
        console.log('Imaging study deleted successfully');
        navigate('/imaging-studies');
      } catch (err) {
        console.error('Error deleting imaging study:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancelButton() {
    if (imagingStudyId && imagingStudyId !== 'new') {
      // If editing existing, just exit edit mode
      setIsEditing(false);
    } else {
      // If creating new, go back to list
      navigate('/imaging-studies');
    }
  }

  // Handle edit button
  function handleEditButton() {
    setIsEditing(true);
  }

  // Handle back button
  function handleBackButton() {
    navigate('/imaging-studies');
  }

  const statusOptions = [
    { value: 'registered', label: 'Registered' },
    { value: 'available', label: 'Available' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const modalityOptions = [
    { value: 'AR', label: 'Autorefraction' },
    { value: 'BMD', label: 'Bone Mineral Densitometry' },
    { value: 'CR', label: 'Computed Radiography' },
    { value: 'CT', label: 'Computed Tomography' },
    { value: 'DX', label: 'Digital Radiography' },
    { value: 'ECG', label: 'Electrocardiography' },
    { value: 'EPS', label: 'Cardiac Electrophysiology' },
    { value: 'ES', label: 'Endoscopy' },
    { value: 'MG', label: 'Mammography' },
    { value: 'MR', label: 'Magnetic Resonance' },
    { value: 'NM', label: 'Nuclear Medicine' },
    { value: 'OPT', label: 'Ophthalmic Tomography' },
    { value: 'PT', label: 'Positron Emission Tomography' },
    { value: 'PX', label: 'Panoramic X-Ray' },
    { value: 'RF', label: 'Radiofluoroscopy' },
    { value: 'US', label: 'Ultrasound' },
    { value: 'XA', label: 'X-Ray Angiography' }
  ];

  return (
    <Container id="imagingStudyDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={imagingStudyId && imagingStudyId !== 'new' ? (isEditing ? 'Edit Imaging Study' : 'View Imaging Study') : 'New Imaging Study'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(imagingStudyId && imagingStudyId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{imagingStudyId}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            {/* Patient Field */}
            <TextField
              id="subjectDisplay"
              fullWidth
              label="Patient"
              value={get(imagingStudy, 'subject.display', '')}
              onChange={function(e) { handleChange('subject.display', e.target.value); }}
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
            
            {/* Status and Modality */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="statusSelect"
                  value={get(imagingStudy, 'status', 'available')}
                  label="Status"
                  onChange={function(e) { handleChange('status', e.target.value); }}
                  disabled={!isEditing}
                >
                  {statusOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="modality-label">Modality</InputLabel>
                <Select
                  labelId="modality-label"
                  id="modalitySelect"
                  value={get(imagingStudy, 'modality[0].code', '')}
                  label="Modality"
                  onChange={function(e) { 
                    const selected = modalityOptions.find(function(opt){ return opt.value === e.target.value; });
                    handleChange('modality[0].code', e.target.value);
                    handleChange('modality[0].display', selected ? selected.label : e.target.value);
                  }}
                  disabled={!isEditing}
                >
                  {modalityOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>

            {/* Description */}
            <TextField
              id="descriptionInput"
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={get(imagingStudy, 'description', '')}
              onChange={function(e) { handleChange('description', e.target.value); }}
              helperText="Brief description of the imaging study"
              disabled={!isEditing}
            />

            {/* Started Date/Time */}
            <TextField
              id="startedInput"
              fullWidth
              label="Started Date/Time"
              type="datetime-local"
              value={moment(get(imagingStudy, 'started', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={function(e) { handleChange('started', e.target.value); }}
              disabled={!isEditing}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Procedure Code */}
            <Stack direction="row" spacing={2}>
              <TextField
                id="procedureCodeInput"
                fullWidth
                label="Procedure Code"
                value={get(imagingStudy, 'procedureCode[0].coding[0].code', '')}
                onChange={function(e) { handleChange('procedureCode[0].coding[0].code', e.target.value); }}
                helperText="LOINC code"
                disabled={!isEditing}
              />
              <TextField
                id="procedureDisplayInput"
                fullWidth
                label="Procedure Display"
                value={get(imagingStudy, 'procedureCode[0].coding[0].display', '') || 
                       get(imagingStudy, 'procedureCode[0].text', '')}
                onChange={function(e) { 
                  handleChange('procedureCode[0].coding[0].display', e.target.value);
                  handleChange('procedureCode[0].text', e.target.value);
                }}
                disabled={!isEditing}
              />
            </Stack>

            {/* Series and Instances */}
            <Stack direction="row" spacing={2}>
              <TextField
                id="numberOfSeriesInput"
                fullWidth
                label="Number of Series"
                type="number"
                value={get(imagingStudy, 'numberOfSeries', 1)}
                onChange={function(e) { handleChange('numberOfSeries', parseInt(e.target.value) || 1); }}
                disabled={!isEditing}
                inputProps={{ min: 1 }}
              />
              <TextField
                id="numberOfInstancesInput"
                fullWidth
                label="Number of Instances"
                type="number"
                value={get(imagingStudy, 'numberOfInstances', 1)}
                onChange={function(e) { handleChange('numberOfInstances', parseInt(e.target.value) || 1); }}
                disabled={!isEditing}
                inputProps={{ min: 1 }}
              />
            </Stack>

            {/* Reason Code */}
            <Stack direction="row" spacing={2}>
              <TextField
                id="reasonCodeInput"
                fullWidth
                label="Reason Code"
                value={get(imagingStudy, 'reasonCode[0].coding[0].code', '')}
                onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
                helperText="SNOMED code"
                disabled={!isEditing}
              />
              <TextField
                id="reasonCodeDisplayInput"
                fullWidth
                label="Reason Display"
                value={get(imagingStudy, 'reasonCode[0].coding[0].display', '') || 
                       get(imagingStudy, 'reasonCode[0].text', '')}
                onChange={function(e) { 
                  handleChange('reasonCode[0].coding[0].display', e.target.value);
                  handleChange('reasonCode[0].text', e.target.value);
                }}
                disabled={!isEditing}
              />
            </Stack>

            {/* Referrer and Interpreter */}
            <Stack direction="row" spacing={2}>
              <TextField
                id="referrerInput"
                fullWidth
                label="Referrer"
                value={get(imagingStudy, 'referrer.display', '')}
                onChange={function(e) { handleChange('referrer.display', e.target.value); }}
                helperText="Practitioner who referred the patient"
                disabled={!isEditing}
              />
              <TextField
                id="interpreterInput"
                fullWidth
                label="Interpreter"
                value={get(imagingStudy, 'interpreter[0].display', '')}
                onChange={function(e) { handleChange('interpreter[0].display', e.target.value); }}
                helperText="Practitioner who interpreted the images"
                disabled={!isEditing}
              />
            </Stack>

            {/* Endpoint */}
            <TextField
              id="endpointInput"
              fullWidth
              label="Endpoint"
              value={get(imagingStudy, 'endpoint[0].display', '')}
              onChange={function(e) { handleChange('endpoint[0].display', e.target.value); }}
              helperText="Where the images can be accessed"
              disabled={!isEditing}
            />

            {/* Location */}
            <TextField
              id="locationInput"
              fullWidth
              label="Location"
              value={get(imagingStudy, 'location.display', '')}
              onChange={function(e) { handleChange('location.display', e.target.value); }}
              helperText="Where the imaging was performed"
              disabled={!isEditing}
            />

            {/* Notes */}
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(imagingStudy, 'note[0].text', '')}
              onChange={function(e) { handleChange('note[0].text', e.target.value); }}
              helperText="Additional notes about the imaging study"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && imagingStudyId && imagingStudyId !== 'new' && (
            <>
              <Button onClick={handleBackButton}>
                Back
              </Button>
              <Button 
                color="error" 
                onClick={handleDeleteButton}
                disabled={loading}
              >
                Delete
              </Button>
              <Button 
                variant="contained" 
                onClick={handleEditButton}
              >
                Edit
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button onClick={handleCancelButton} disabled={loading}>
                Cancel
              </Button>
              <Button 
                id="saveImagingStudyButton"
                variant="contained" 
                onClick={handleSaveButton}
                disabled={loading}
              >
                {imagingStudyId && imagingStudyId !== 'new' ? 'Update' : 'Save'} Study
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ImagingStudyDetail;
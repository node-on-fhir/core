// /imports/ui-fhir/procedures/ProcedureDetail.jsx

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
  Switch,
  FormControlLabel,
  Link
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';

import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ProcedureDetail(props) {
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
  const [procedure, setProcedure] = useState({
    resourceType: 'Procedure',
    identifier: [{
      use: 'official',
      type: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0203",
          code: "PLAC"
        }],
        text: "Placer Identifier"
      },
      value: ""
    }],
    status: 'unknown',
    notPerformed: false,
    category: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    code: {
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
    encounter: {
      reference: "",
      display: ""
    },
    performedDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    bodySite: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    outcome: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    location: {
      reference: "",
      display: ""
    },
    note: [{
      time: moment().format('YYYY-MM-DDTHH:mm:ss'),
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and performer on component mount for new procedures
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new procedures
      setIsEditing(true);
      
      // For new procedures, set the patient name
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
      
      setProcedure(prev => ({
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
      // Viewing existing procedure - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load procedure if editing
  useEffect(function() {
    async function loadProcedure() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('procedures.get', id);
          if (result) {
            setProcedure(result);
          }
        } catch (err) {
          console.error('Error loading procedure:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadProcedure();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedProcedure = { ...procedure };
    set(updatedProcedure, path, value);
    setProcedure(updatedProcedure);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      // Ensure code.text is set from display if available
      if (get(procedure, 'code.coding[0].display')) {
        handleChange('code.text', get(procedure, 'code.coding[0].display'));
      }
      
      if (id && id !== 'new') {
        // Update existing procedure
        await Meteor.callAsync('updateProcedure', id, procedure);
        console.log('Procedure updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new procedure
        const newId = await Meteor.callAsync('createProcedure', procedure);
        console.log('Procedure created with ID:', newId);
        // Navigate back to procedures list for new procedures
        navigate('/procedures');
      }
    } catch (err) {
      console.error('Error saving procedure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this procedure?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeProcedure', id);
        console.log('Procedure deleted successfully');
        navigate('/procedures');
      } catch (err) {
        console.error('Error deleting procedure:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/procedures');
  }

  const statusOptions = [
    { value: 'preparation', label: 'Preparation' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'not-done', label: 'Not Done' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'stopped', label: 'Stopped' },
    { value: 'completed', label: 'Completed' },
    { value: 'entered-in-error', label: 'Entered in Error' },
    { value: 'unknown', label: 'Unknown' }
  ];


  return (
    <Container id="procedureDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Procedure' : 'New Procedure'}
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
              id="identifier"
              fullWidth
              label="Identifier"
              value={get(procedure, 'identifier[0].value', '')}
              onChange={(e) => handleChange('identifier[0].value', e.target.value)}
              helperText="Unique identifier for this procedure"
              disabled={!isEditing}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="categoryCode"
                fullWidth
                label="Category Code"
                value={get(procedure, 'category.coding[0].code', '')}
                onChange={(e) => handleChange('category.coding[0].code', e.target.value)}
                helperText="Category code (e.g., 240917005)"
                disabled={!isEditing}
              />
              
              <TextField
                id="categoryDisplay"
                fullWidth
                label="Category Display"
                value={get(procedure, 'category.coding[0].display', '') || get(procedure, 'category.text', '')}
                onChange={(e) => {
                  handleChange('category.coding[0].display', e.target.value);
                  handleChange('category.text', e.target.value);
                }}
                helperText="e.g., Interventional Radiology"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="codeCode"
                fullWidth
                label="Procedure Code"
                value={get(procedure, 'code.coding[0].code', '')}
                onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
                helperText="SNOMED CT procedure code"
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Lookup SNOMED CT codes">
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
              
              <TextField
                id="codeDisplay"
                fullWidth
                label="Procedure Name"
                value={get(procedure, 'code.coding[0].display', '') || get(procedure, 'code.text', '')}
                onChange={(e) => {
                  handleChange('code.coding[0].display', e.target.value);
                  handleChange('code.text', e.target.value);
                }}
                helperText="Human-readable procedure name"
                disabled={!isEditing}
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="status"
                  value={get(procedure, 'status', 'unknown')}
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
                id="performedDateTime"
                fullWidth
                type="datetime-local"
                label="Performed Date/Time"
                value={moment(get(procedure, 'performedDateTime', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('performedDateTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={get(procedure, 'notPerformed', false)}
                    onChange={(e) => handleChange('notPerformed', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Not Performed"
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Patient & Performer</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient Name"
                value={get(procedure, 'subject.display', '')}
                helperText={get(procedure, 'subject.reference', '') || 'Patient reference will be assigned'}
                disabled // Always disabled to prevent editing
              />
              
              <TextField
                id="performerDisplay"
                fullWidth
                label="Performed By"
                value={get(procedure, 'performer[0].actor.display', '')}
                onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
                helperText={get(procedure, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Body Site</Typography>
            
            <Stack direction="row" spacing={2}>
              <TextField
                id="bodySiteCode"
                fullWidth
                label="Body Site Code"
                value={get(procedure, 'bodySite[0].coding[0].code', '')}
                onChange={(e) => handleChange('bodySite[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
              />
              
              <TextField
                id="bodySiteDisplay"
                fullWidth
                label="Body Site Display"
                value={get(procedure, 'bodySite[0].coding[0].display', '') || get(procedure, 'bodySite[0].text', '')}
                onChange={(e) => {
                  handleChange('bodySite[0].coding[0].display', e.target.value);
                  handleChange('bodySite[0].text', e.target.value);
                }}
                helperText="e.g., Biliary Ducts, Right Arm, Left Knee"
                disabled={!isEditing}
              />
            </Stack>
            
            <Typography variant="h6" sx={{ mt: 2 }}>Outcome & Reason</Typography>
            
            <Stack spacing={2}>
              <TextField
                id="outcome"
                fullWidth
                label="Outcome"
                value={get(procedure, 'outcome.text', '')}
                onChange={(e) => handleChange('outcome.text', e.target.value)}
                helperText="e.g., successful, unsuccessful, partially successful"
                disabled={!isEditing}
              />
              
              <Stack direction="row" spacing={2}>
                <TextField
                  id="reasonCode"
                  fullWidth
                  label="Reason Code"
                  value={get(procedure, 'reasonCode[0].coding[0].code', '')}
                  onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
                  helperText="SNOMED code for procedure reason"
                  disabled={!isEditing}
                />
                
                <TextField
                  id="reasonDisplay"
                  fullWidth
                  label="Reason Display"
                  value={get(procedure, 'reasonCode[0].coding[0].display', '') || get(procedure, 'reasonCode[0].text', '')}
                  onChange={(e) => {
                    handleChange('reasonCode[0].coding[0].display', e.target.value);
                    handleChange('reasonCode[0].text', e.target.value);
                  }}
                  helperText="e.g., Appendicitis, Fracture"
                  disabled={!isEditing}
                />
              </Stack>
              
              <TextField
                id="locationDisplay"
                fullWidth
                label="Location"
                value={get(procedure, 'location.display', '')}
                onChange={(e) => handleChange('location.display', e.target.value)}
                helperText="e.g., Operating Room 3, Emergency Department"
                disabled={!isEditing}
              />
            </Stack>
            
            {!props.hideNotes && (
              <>
                <Typography variant="h6" sx={{ mt: 2 }}>Notes</Typography>
                
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Note Time"
                    value={moment(get(procedure, 'note[0].time', '')).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => handleChange('note[0].time', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!isEditing}
                  />
                  
                  <TextField
                    id="notesTextarea"
                    fullWidth
                    multiline
                    rows={3}
                    label="Note Text"
                    value={get(procedure, 'note[0].text', '')}
                    onChange={(e) => handleChange('note[0].text', e.target.value)}
                    helperText="e.g., Routine follow-up. No complications."
                    disabled={!isEditing}
                  />
                </Stack>
              </>
            )}
            
          </Stack>
        </CardContent>
        
        {!props.hideButtons && (
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {!isEditing && id && id !== 'new' ? (
              // Read-only mode buttons
              <>
                <Button 
                  onClick={() => navigate('/procedures')}
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
                      // Reload the procedure to discard changes
                      async function reloadProcedure() {
                        try {
                          const result = await Meteor.callAsync('procedures.get', id);
                          if (result) {
                            setProcedure(result);
                          }
                        } catch (err) {
                          console.error('Error reloading procedure:', err);
                        }
                      }
                      reloadProcedure();
                    } else {
                      // For new procedures, go back
                      navigate('/procedures');
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
                  id="saveProcedureButton"
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
        )}
      </Card>
    </Container>
  );
}

ProcedureDetail.propTypes = {
  showPatientInputs: PropTypes.bool,
  hideButtons: PropTypes.bool,
  hideNotes: PropTypes.bool,
  showHints: PropTypes.bool,
  showDatePicker: PropTypes.bool
};

export default ProcedureDetail;
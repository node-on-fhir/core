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
  Tooltip
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ConditionDetail(props) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and asserter on component mount for new conditions
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new conditions
      setIsEditing(true);
      
      // For new conditions, set the patient name
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
  }, [id, selectedPatient, currentUser]);

  // Load condition if editing
  useEffect(function() {
    async function loadCondition() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('conditions.get', id);
          if (result) {
            setCondition(result);
          }
        } catch (err) {
          console.error('Error loading condition:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadCondition();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedCondition = { ...condition };
    set(updatedCondition, path, value);
    setCondition(updatedCondition);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
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

  return (
    <Container id="conditionDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Condition' : 'New Condition'}
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
              id="patientDisplay"
              fullWidth
              label="Patient Name"
              value={get(condition, 'subject.display', '')}
              helperText={get(condition, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              id="asserterDisplay"
              fullWidth
              label="Asserter Name"
              value={get(condition, 'asserter.display', '')}
              onChange={(e) => handleChange('asserter.display', e.target.value)}
              helperText={get(condition, 'asserter.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              id="snomedCode"
              fullWidth
              label="SNOMED Code"
              value={get(condition, 'code.coding[0].code', '')}
              onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
              helperText="SNOMED CT code"
              disabled={!isEditing}
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
            
            <TextField
              id="snomedDisplay"
              fullWidth
              label="Condition Name"
              value={get(condition, 'code.coding[0].display', '')}
              onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
              helperText="Human-readable name of the condition"
              disabled={!isEditing}
            />
            
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
          </Stack>
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
    </Container>
  );
}

export default ConditionDetail;
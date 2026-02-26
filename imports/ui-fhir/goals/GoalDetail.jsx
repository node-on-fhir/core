// /imports/ui-fhir/goals/GoalDetail.jsx

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

import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';



function GoalDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [goal, setGoal] = useState({
    resourceType: "Goal",
    subject: {
      reference: "",
      display: ""
    },
    expressedBy: {
      reference: "",
      display: ""
    },
    lifecycleStatus: "proposed",
    achievementStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/goal-achievement",
        code: "in-progress",
        display: "In Progress"
      }]
    },
    priority: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/goal-priority",
        code: "medium-priority",
        display: "Medium Priority"
      }]
    },
    description: {
      text: ""
    },
    startDate: moment().format('YYYY-MM-DD'),
    target: [{
      measure: {
        coding: [{
          system: "http://loinc.org",
          code: "",
          display: ""
        }]
      },
      dueDate: moment().add(30, 'days').format('YYYY-MM-DD')
    }],
    statusDate: moment().format('YYYY-MM-DD'),
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setGoal(function(prev) {
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

  // Set patient name and expressedBy on component mount for new goals
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new goals
      setIsEditing(true);
      
      // For new goals, set the patient name
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
      
      // Set expressedBy to current user
      let expressedByName = '';
      let expressedByReference = '';
      
      if (currentUser) {
        expressedByName = get(currentUser, 'profile.name.text', '') ||
                         `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                         get(currentUser, 'username', '');
        expressedByReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setGoal(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        expressedBy: {
          reference: expressedByReference,
          display: expressedByName
        }
      }));
    } else {
      // Viewing existing goal - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load goal if editing
  useEffect(function() {
    async function loadGoal() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('goals.get', id);
          if (result) {
            setGoal(result);
          }
        } catch (err) {
          console.error('Error loading goal:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadGoal();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedGoal = { ...goal };
    set(updatedGoal, path, value);
    setGoal(updatedGoal);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedGoal);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing goal
        await Meteor.callAsync('goals.update', id, goal);
        console.log('Goal updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new goal
        const newId = await Meteor.callAsync('goals.create', goal);
        console.log('Goal created with ID:', newId);
        // Navigate back to goals list for new goals
        navigate('/goals');
      }
    } catch (err) {
      console.error('Error saving goal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('goals.remove', id);
        console.log('Goal deleted successfully');
        navigate('/goals');
      } catch (err) {
        console.error('Error deleting goal:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/goals');
  }

  const lifecycleStatusOptions = [
    'proposed', 'planned', 'accepted', 'active', 'on-hold', 'completed', 'cancelled', 'entered-in-error', 'rejected'
  ];

  const achievementStatusOptions = [
    { code: 'in-progress', display: 'In Progress' },
    { code: 'improving', display: 'Improving' },
    { code: 'worsening', display: 'Worsening' },
    { code: 'no-change', display: 'No Change' },
    { code: 'achieved', display: 'Achieved' },
    { code: 'sustaining', display: 'Sustaining' },
    { code: 'not-achieved', display: 'Not Achieved' },
    { code: 'no-progress', display: 'No Progress' },
    { code: 'not-attainable', display: 'Not Attainable' }
  ];

  const priorityOptions = [
    { code: 'high-priority', display: 'High Priority' },
    { code: 'medium-priority', display: 'Medium Priority' },
    { code: 'low-priority', display: 'Low Priority' }
  ];

  if (isEmbedded) {
    return (
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Patient Name"
          value={get(goal, 'subject.display', '')}
          helperText={get(goal, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled // Always disabled to prevent editing
        />

        <TextField
          fullWidth
          label="Expressed By"
          value={get(goal, 'expressedBy.display', '')}
          onChange={(e) => handleChange('expressedBy.display', e.target.value)}
          helperText={get(goal, 'expressedBy.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          label="Goal Description"
          value={get(goal, 'description.text', '')}
          onChange={(e) => handleChange('description.text', e.target.value)}
          helperText="What is the patient trying to achieve?"
          multiline
          rows={3}
          disabled={!isEditing}
        />

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Lifecycle Status</InputLabel>
          <Select
            value={get(goal, 'lifecycleStatus', 'proposed')}
            onChange={(e) => handleChange('lifecycleStatus', e.target.value)}
            label="Lifecycle Status"
          >
            {lifecycleStatusOptions.map(status => (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Achievement Status</InputLabel>
          <Select
            value={get(goal, 'achievementStatus.coding[0].code', 'in-progress')}
            onChange={(e) => {
              const option = achievementStatusOptions.find(o => o.code === e.target.value);
              handleChange('achievementStatus.coding[0].code', option.code);
              handleChange('achievementStatus.coding[0].display', option.display);
            }}
            label="Achievement Status"
          >
            {achievementStatusOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={get(goal, 'priority.coding[0].code', 'medium-priority')}
            onChange={(e) => {
              const option = priorityOptions.find(o => o.code === e.target.value);
              handleChange('priority.coding[0].code', option.code);
              handleChange('priority.coding[0].display', option.display);
            }}
            label="Priority"
          >
            {priorityOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="date"
          label="Start Date"
          value={moment(get(goal, 'startDate', '')).format('YYYY-MM-DD')}
          onChange={(e) => handleChange('startDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          type="date"
          label="Target Due Date"
          value={moment(get(goal, 'target[0].dueDate', '')).format('YYYY-MM-DD')}
          onChange={(e) => handleChange('target[0].dueDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          type="date"
          label="Status Date"
          value={moment(get(goal, 'statusDate', '')).format('YYYY-MM-DD')}
          onChange={(e) => handleChange('statusDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(goal, 'note[0].text', '')}
          onChange={(e) => handleChange('note[0].text', e.target.value)}
          helperText="Additional notes about this goal"
          disabled={!isEditing}
        />
      </Stack>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Goal' : 'New Goal'}
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
              label="Patient Name"
              value={get(goal, 'subject.display', '')}
              helperText={get(goal, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              fullWidth
              label="Expressed By"
              value={get(goal, 'expressedBy.display', '')}
              onChange={(e) => handleChange('expressedBy.display', e.target.value)}
              helperText={get(goal, 'expressedBy.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Goal Description"
              value={get(goal, 'description.text', '')}
              onChange={(e) => handleChange('description.text', e.target.value)}
              helperText="What is the patient trying to achieve?"
              multiline
              rows={3}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Lifecycle Status</InputLabel>
              <Select
                value={get(goal, 'lifecycleStatus', 'proposed')}
                onChange={(e) => handleChange('lifecycleStatus', e.target.value)}
                label="Lifecycle Status"
              >
                {lifecycleStatusOptions.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Achievement Status</InputLabel>
              <Select
                value={get(goal, 'achievementStatus.coding[0].code', 'in-progress')}
                onChange={(e) => {
                  const option = achievementStatusOptions.find(o => o.code === e.target.value);
                  handleChange('achievementStatus.coding[0].code', option.code);
                  handleChange('achievementStatus.coding[0].display', option.display);
                }}
                label="Achievement Status"
              >
                {achievementStatusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={get(goal, 'priority.coding[0].code', 'medium-priority')}
                onChange={(e) => {
                  const option = priorityOptions.find(o => o.code === e.target.value);
                  handleChange('priority.coding[0].code', option.code);
                  handleChange('priority.coding[0].display', option.display);
                }}
                label="Priority"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={moment(get(goal, 'startDate', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Target Due Date"
              value={moment(get(goal, 'target[0].dueDate', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('target[0].dueDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Status Date"
              value={moment(get(goal, 'statusDate', '')).format('YYYY-MM-DD')}
              onChange={(e) => handleChange('statusDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(goal, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about this goal"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/goals')}
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
                    // Reload the goal to discard changes
                    async function reloadGoal() {
                      try {
                        const result = await Meteor.callAsync('goals.get', id);
                        if (result) {
                          setGoal(result);
                        }
                      } catch (err) {
                        console.error('Error reloading goal:', err);
                      }
                    }
                    reloadGoal();
                  } else {
                    // For new goals, go back
                    navigate('/goals');
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

export default GoalDetail;
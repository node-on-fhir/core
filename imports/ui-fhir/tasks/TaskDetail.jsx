// /imports/ui-fhir/tasks/TaskDetail.jsx

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
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function TaskDetail(props) {
  const navigate = useNavigate();
  const { id: taskId } = useParams();
  
  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);
  
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to Tasks
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Tasks', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('tasks.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [task, setTask] = useState({
    resourceType: "Task",
    status: "requested",
    intent: "order",
    priority: "routine",
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    description: "",
    for: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    executionPeriod: {
      start: "",
      end: ""
    },
    authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss'),
    lastModified: moment().format('YYYY-MM-DDTHH:mm:ss'),
    requester: {
      reference: "",
      display: ""
    },
    owner: {
      reference: "",
      display: ""
    },
    reasonCode: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    businessStatus: {
      coding: [{
        system: "",
        code: "",
        display: ""
      }],
      text: ""
    },
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and requester on component mount for new tasks
  useEffect(function() {
    if (!taskId || taskId === 'new') {
      // Enable editing for new tasks
      setIsEditing(true);
      
      // For new tasks, set the patient name
      let patientName = '';
      let patientReference = '';
      
      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') || 
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
        
        // Update the task with patient information
        setTask(prev => ({
          ...prev,
          for: {
            reference: patientReference,
            display: patientName
          }
        }));
      }
      
      // Set requester to current user
      let requesterName = '';
      let requesterReference = '';
      
      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;
        
        // Update the task with requester information
        setTask(prev => ({
          ...prev,
          requester: {
            reference: requesterReference,
            display: requesterName
          }
        }));
      }
    } else {
      // Viewing existing task - start in read-only mode
      setIsEditing(false);
    }
  }, [taskId, selectedPatient, currentUser]);

  // Load task when subscription is ready
  useEffect(() => {
    if (taskId && taskId !== 'new' && isSubscriptionReady) {
      const existingTask = Tasks.findOne({_id: taskId});
      if (existingTask) {
        setTask(existingTask);
        setIsEditing(false);
      }
    }
  }, [taskId, isSubscriptionReady]);

  function handleChange(field, value) {
    setTask(prev => {
      const updated = { ...prev };
      set(updated, field, value);
      return updated;
    });
  }

  function handleSearchUser() {
    console.log('Search for patient/user');
    // TODO: Implement patient search dialog
  }

  async function handleSaveButton() {
    console.log('TaskDetail.handleSaveButton', task);
    setLoading(true);
    setError(null);
    
    try {
      let dataToSave = {
        ...task,
        lastModified: moment().format('YYYY-MM-DDTHH:mm:ss')
      };
      
      // Remove _id for FHIR compliance
      delete dataToSave._id;
      
      if (taskId && taskId !== 'new') {
        // Update existing task
        await Meteor.callAsync('updateTask', taskId, dataToSave);
        console.log('Task updated successfully');
        setIsEditing(false); // Stay on page, switch to read mode
      } else {
        // Create new task
        const id = await Meteor.callAsync('createTask', dataToSave);
        console.log('Task created successfully:', id);
        navigate('/tasks'); // Navigate to list after create
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setLoading(true);
      Meteor.callAsync('removeTask', taskId)
        .then(() => {
          console.log('Task deleted successfully');
          navigate('/tasks');
        })
        .catch(err => {
          console.error('Error deleting task:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }

  function handleCancelButton() {
    if (taskId && taskId !== 'new') {
      // If editing existing, just switch back to read mode
      setIsEditing(false);
      // Reload original data
      if (isSubscriptionReady) {
        const existingTask = Tasks.findOne({_id: taskId});
        if (existingTask) {
          setTask(existingTask);
        }
      }
    } else {
      // If new, navigate back to list
      navigate('/tasks');
    }
  }

  const statusOptions = [
    'draft', 'requested', 'received', 'accepted', 'rejected', 
    'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 
    'completed', 'entered-in-error'
  ];

  const priorityOptions = ['routine', 'urgent', 'asap', 'stat'];
  
  const intentOptions = [
    'unknown', 'proposal', 'plan', 'order', 'original-order',
    'reflex-order', 'filler-order', 'instance-order', 'option'
  ];

  if (loading && (!taskId || taskId === 'new')) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container id='taskDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={taskId && taskId !== 'new' ? 'Edit Task' : 'New Task'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          action={
            taskId && taskId !== 'new' && (
              <IconButton onClick={() => setIsEditing(!isEditing)} sx={{ color: 'primary.contrastText' }}>
                {isEditing ? <LockOpenIcon /> : <LockIcon />}
              </IconButton>
            )
          }
        />
        <CardContent>
          {(taskId && taskId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{taskId}</span>
            </Box>
          )}
          
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}

          <TextField
            id="forDisplay"
            fullWidth
            label="Patient"
            value={get(task, 'for.display', '')}
            onChange={(e) => handleChange('for.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
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

          <TextField
            id="requesterDisplay"
            fullWidth
            label="Requester"
            value={get(task, 'requester.display', '')}
            onChange={(e) => handleChange('requester.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />

          <TextField
            id="ownerDisplay"
            fullWidth
            label="Owner"
            value={get(task, 'owner.display', '')}
            onChange={(e) => handleChange('owner.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              id="codeCode"
              fullWidth
              label="Code"
              value={get(task, 'code.coding[0].code', '')}
              onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
              disabled={!isEditing}
              margin="normal"
            />
            <TextField
              id="codeDisplay"
              fullWidth
              label="Code Display"
              value={get(task, 'code.coding[0].display', '')}
              onChange={(e) => {
                handleChange('code.coding[0].display', e.target.value);
                handleChange('code.text', e.target.value);
              }}
              disabled={!isEditing}
              margin="normal"
            />
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="status"
              value={get(task, 'status', 'requested')}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!isEditing}
              label="Status"
            >
              {statusOptions.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="intent-label">Intent</InputLabel>
              <Select
                labelId="intent-label"
                id="intent"
                value={get(task, 'intent', 'order')}
                onChange={(e) => handleChange('intent', e.target.value)}
                disabled={!isEditing}
                label="Intent"
              >
                {intentOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                value={get(task, 'priority', 'routine')}
                onChange={(e) => handleChange('priority', e.target.value)}
                disabled={!isEditing}
                label="Priority"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            id="description"
            fullWidth
            label="Description"
            value={get(task, 'description', '')}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={!isEditing}
            multiline
            rows={3}
            margin="normal"
          />

          <TextField
            id="authoredOn"
            fullWidth
            label="Authored On"
            type="datetime-local"
            value={get(task, 'authoredOn', '').substring(0, 16)}
            onChange={(e) => handleChange('authoredOn', e.target.value + ':00')}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            id="lastModified"
            fullWidth
            label="Last Modified"
            type="datetime-local"
            value={get(task, 'lastModified', '').substring(0, 16)}
            onChange={(e) => handleChange('lastModified', e.target.value + ':00')}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              id="businessStatusCode"
              fullWidth
              label="Business Status Code"
              value={get(task, 'businessStatus.coding[0].code', '')}
              onChange={(e) => {
                handleChange('businessStatus.coding[0].code', e.target.value);
                handleChange('businessStatus.text', e.target.value);
              }}
              disabled={!isEditing}
              margin="normal"
            />
            <TextField
              id="businessStatusDisplay"
              fullWidth
              label="Business Status Display"
              value={get(task, 'businessStatus.coding[0].display', '')}
              onChange={(e) => handleChange('businessStatus.coding[0].display', e.target.value)}
              disabled={!isEditing}
              margin="normal"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              id="executionPeriodStart"
              fullWidth
              label="Execution Start"
              type="datetime-local"
              value={get(task, 'executionPeriod.start', '').substring(0, 16)}
              onChange={(e) => handleChange('executionPeriod.start', e.target.value + ':00')}
              disabled={!isEditing}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              id="executionPeriodEnd"
              fullWidth
              label="Execution End"
              type="datetime-local"
              value={get(task, 'executionPeriod.end', '').substring(0, 16)}
              onChange={(e) => handleChange('executionPeriod.end', e.target.value + ':00')}
              disabled={!isEditing}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            id="notesTextarea"
            fullWidth
            label="Notes"
            value={get(task, 'note[0].text', '')}
            onChange={(e) => handleChange('note[0].text', e.target.value)}
            disabled={!isEditing}
            multiline
            rows={3}
            margin="normal"
          />
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {taskId && taskId !== 'new' && !isEditing && (
            <>
              <Button onClick={() => navigate('/tasks')}>
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
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button 
                onClick={handleCancelButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                color="primary"
                onClick={handleSaveButton}
                disabled={loading}
              >
                {taskId && taskId !== 'new' ? 'Update' : 'Save'} Task
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default TaskDetail;
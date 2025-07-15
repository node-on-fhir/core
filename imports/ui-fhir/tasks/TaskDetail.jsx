// /imports/ui-fhir/tasks/TaskDetail.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

// Collection reference
let Tasks;
Meteor.startup(async function(){
  if(Meteor.isClient){
    Tasks = await global.Collections.Tasks;
  }
});

//===========================================================================
// MAIN COMPONENT

export function TaskDetail(props){
  const [taskId, setTaskId] = useState(false);
  const [task, setTask] = useState({
    resourceType: "Task",
    status: "requested",
    intent: "order",
    priority: "routine",
    description: "",
    for: {
      reference: "",
      display: ""
    },
    owner: {
      reference: "",
      display: ""
    },
    requester: {
      reference: "",
      display: ""
    },
    businessStatus: {
      text: ""
    },
    lastModified: null,
    authoredOn: null
  });

  // Update internal state when props change
  useEffect(() => {
    if(props.taskId !== taskId){
      setTaskId(props.taskId);
    }
    if(props.task && props.task !== task){
      setTask(props.task);
    }
  }, [props.taskId, props.task]);

  function handleChange(field, value){
    let updatedTask = Object.assign({}, task);
    
    switch(field) {
      case 'patientDisplay':
        set(updatedTask, 'for.display', value);
        break;
      case 'ownerDisplay':
        set(updatedTask, 'owner.display', value);
        break;
      case 'requesterDisplay':
        set(updatedTask, 'requester.display', value);
        break;
      case 'status':
        set(updatedTask, 'status', value);
        break;
      case 'intent':
        set(updatedTask, 'intent', value);
        break;
      case 'priority':
        set(updatedTask, 'priority', value);
        break;
      case 'description':
        set(updatedTask, 'description', value);
        break;
      case 'businessStatus':
        set(updatedTask, 'businessStatus.text', value);
        break;
      default:
        break;
    }
    
    setTask(updatedTask);
  }

  function handleSaveButton(){
    console.log('TaskDetail.handleSaveButton', task);
    
    let taskToSave = Object.assign({}, task);
    
    // Remove the _id field for FHIR compliance
    delete taskToSave._id;
    
    if(taskId){
      // Update existing task
      console.log('Updating task', taskId);
      if(Tasks){
        Tasks._collection.update(
          {_id: taskId},
          {$set: taskToSave},
          function(error, result){
            if(error){
              console.error('Error updating task:', error);
            } else {
              console.log('Task updated successfully');
              if(props.onUpdate){
                props.onUpdate(taskId);
              }
            }
          }
        );
      }
    } else {
      // Insert new task
      console.log('Creating new task');
      if(Tasks){
        Tasks._collection.insert(taskToSave, function(error, result){
          if(error){
            console.error('Error creating task:', error);
          } else {
            console.log('Task created successfully', result);
            if(props.onInsert){
              props.onInsert(result);
            }
          }
        });
      }
    }
  }

  function handleDeleteButton(){
    console.log('TaskDetail.handleDeleteButton', taskId);
    
    if(taskId && Tasks){
      Tasks._collection.remove({_id: taskId}, function(error, result){
        if(error){
          console.error('Error deleting task:', error);
        } else {
          console.log('Task deleted successfully');
          if(props.onRemove){
            props.onRemove(taskId);
          }
        }
      });
    }
  }

  function handleCancelButton(){
    if(props.onCancel){
      props.onCancel();
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

  return (
    <div id={props.id} className="taskDetail">
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              id='patientDisplayInput'
              name='patientDisplay'
              label='Patient'
              value={get(task, 'for.display', '')}
              onChange={(e) => handleChange('patientDisplay', e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              id='ownerDisplayInput'
              name='ownerDisplay'
              label='Owner'
              value={get(task, 'owner.display', '')}
              onChange={(e) => handleChange('ownerDisplay', e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              id='requesterDisplayInput'
              name='requesterDisplay'
              label='Requester'
              value={get(task, 'requester.display', '')}
              onChange={(e) => handleChange('requesterDisplay', e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              id='descriptionInput'
              name='description'
              label='Description'
              value={get(task, 'description', '')}
              onChange={(e) => handleChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id='statusInput'
                value={get(task, 'status', 'requested')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id='priorityInput'
                value={get(task, 'priority', 'routine')}
                onChange={(e) => handleChange('priority', e.target.value)}
                label="Priority"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="intent-label">Intent</InputLabel>
              <Select
                labelId="intent-label"
                id='intentInput'
                value={get(task, 'intent', 'order')}
                onChange={(e) => handleChange('intent', e.target.value)}
                label="Intent"
              >
                {intentOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              id='businessStatusInput'
              name='businessStatus'
              label='Business Status'
              value={get(task, 'businessStatus.text', '')}
              onChange={(e) => handleChange('businessStatus', e.target.value)}
              fullWidth
              margin="normal"
            />
          </Grid>
        </Grid>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
        {taskId && (
          <Button 
            id="deleteTaskButton" 
            color="error"
            onClick={handleDeleteButton}
          >
            Delete
          </Button>
        )}
        <Button 
          id="cancelTaskButton" 
          onClick={handleCancelButton}
        >
          Cancel
        </Button>
        <Button 
          id="saveTaskButton" 
          variant="contained"
          color="primary"
          onClick={handleSaveButton}
        >
          Save
        </Button>
      </CardActions>
    </div>
  );
}

export default TaskDetail;
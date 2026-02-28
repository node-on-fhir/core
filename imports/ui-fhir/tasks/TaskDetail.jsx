// /imports/ui-fhir/tasks/TaskDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import TaskFormView from './TaskFormView';
import TaskPreview from './TaskPreview';

function TaskDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var taskId = _params.id || null;

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to Tasks
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
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

  const [form, setForm] = useState({
    forDisplay: '',
    requesterDisplay: '',
    ownerDisplay: '',
    codeCode: '',
    codeDisplay: '',
    status: 'requested',
    intent: 'order',
    priority: 'routine',
    description: '',
    authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss').substring(0, 16),
    lastModified: moment().format('YYYY-MM-DDTHH:mm:ss').substring(0, 16),
    businessStatusCode: '',
    businessStatusDisplay: '',
    executionPeriodStart: '',
    executionPeriodEnd: '',
    notes: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setTask(function(prev) {
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
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewTask = !taskId || taskId === 'new';

  // Set patient name and requester on component mount for new tasks
  useEffect(function() {
    if (!taskId || taskId === 'new') {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';
      let requesterName = '';
      let requesterReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;

        setTask(prev => ({
          ...prev,
          for: {
            reference: patientReference,
            display: patientName
          }
        }));
      }

      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;

        setTask(prev => ({
          ...prev,
          requester: {
            reference: requesterReference,
            display: requesterName
          }
        }));
      }

      setForm({
        forDisplay: patientName,
        requesterDisplay: requesterName,
        ownerDisplay: '',
        codeCode: '',
        codeDisplay: '',
        status: 'requested',
        intent: 'order',
        priority: 'routine',
        description: '',
        authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss').substring(0, 16),
        lastModified: moment().format('YYYY-MM-DDTHH:mm:ss').substring(0, 16),
        businessStatusCode: '',
        businessStatusDisplay: '',
        executionPeriodStart: '',
        executionPeriodEnd: '',
        notes: ''
      });
    } else {
      setIsEditing(false);
    }
  }, [taskId, selectedPatient, currentUser]);

  // Load task from collection
  useEffect(() => {
    if (taskId && taskId !== 'new') {
      const existingTask = Tasks.findOne({_id: taskId}) || Tasks.findOne({id: taskId});
      if (existingTask) {
        setTask(existingTask);
        setIsEditing(false);

        setForm({
          forDisplay: get(existingTask, 'for.display', ''),
          requesterDisplay: get(existingTask, 'requester.display', ''),
          ownerDisplay: get(existingTask, 'owner.display', ''),
          codeCode: get(existingTask, 'code.coding[0].code', ''),
          codeDisplay: get(existingTask, 'code.coding[0].display', ''),
          status: get(existingTask, 'status', 'requested'),
          intent: get(existingTask, 'intent', 'order'),
          priority: get(existingTask, 'priority', 'routine'),
          description: get(existingTask, 'description', ''),
          authoredOn: get(existingTask, 'authoredOn', '').substring(0, 16),
          lastModified: get(existingTask, 'lastModified', '').substring(0, 16),
          businessStatusCode: get(existingTask, 'businessStatus.coding[0].code', ''),
          businessStatusDisplay: get(existingTask, 'businessStatus.coding[0].display', ''),
          executionPeriodStart: get(existingTask, 'executionPeriod.start', '').substring(0, 16),
          executionPeriodEnd: get(existingTask, 'executionPeriod.end', '').substring(0, 16),
          notes: get(existingTask, 'note[0].text', '')
        });
      }
    }
  }, [taskId]);

  function handleChange(name, value){
    pendingUpdate.current = true;
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the underlying FHIR resource
    setTask(function(prev){
      const updated = { ...prev };
      switch(name){
        case 'forDisplay':
          set(updated, 'for.display', value);
          break;
        case 'requesterDisplay':
          set(updated, 'requester.display', value);
          break;
        case 'ownerDisplay':
          set(updated, 'owner.display', value);
          break;
        case 'codeCode':
          set(updated, 'code.coding[0].code', value);
          break;
        case 'codeDisplay':
          set(updated, 'code.coding[0].display', value);
          set(updated, 'code.text', value);
          break;
        case 'status':
          set(updated, 'status', value);
          break;
        case 'intent':
          set(updated, 'intent', value);
          break;
        case 'priority':
          set(updated, 'priority', value);
          break;
        case 'description':
          set(updated, 'description', value);
          break;
        case 'authoredOn':
          set(updated, 'authoredOn', value + ':00');
          break;
        case 'lastModified':
          set(updated, 'lastModified', value + ':00');
          break;
        case 'businessStatusCode':
          set(updated, 'businessStatus.coding[0].code', value);
          set(updated, 'businessStatus.text', value);
          break;
        case 'businessStatusDisplay':
          set(updated, 'businessStatus.coding[0].display', value);
          break;
        case 'executionPeriodStart':
          set(updated, 'executionPeriod.start', value + ':00');
          break;
        case 'executionPeriodEnd':
          set(updated, 'executionPeriod.end', value + ':00');
          break;
        case 'notes':
          set(updated, 'note[0].text', value);
          break;
        default:
          break;
      }
      return updated;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(task);
    }
  }, [task]);

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
        await Meteor.callAsync('updateTask', taskId, dataToSave);
        console.log('Task updated successfully');
        setIsEditing(false);
      } else {
        const id = await Meteor.callAsync('createTask', dataToSave);
        console.log('Task created successfully:', id);
        navigate('/tasks');
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
      setIsEditing(false);
      setError(null);
      if (isSubscriptionReady) {
        const existingTask = Tasks.findOne({_id: taskId});
        if (existingTask) {
          setTask(existingTask);
          setForm({
            forDisplay: get(existingTask, 'for.display', ''),
            requesterDisplay: get(existingTask, 'requester.display', ''),
            ownerDisplay: get(existingTask, 'owner.display', ''),
            codeCode: get(existingTask, 'code.coding[0].code', ''),
            codeDisplay: get(existingTask, 'code.coding[0].display', ''),
            status: get(existingTask, 'status', 'requested'),
            intent: get(existingTask, 'intent', 'order'),
            priority: get(existingTask, 'priority', 'routine'),
            description: get(existingTask, 'description', ''),
            authoredOn: get(existingTask, 'authoredOn', '').substring(0, 16),
            lastModified: get(existingTask, 'lastModified', '').substring(0, 16),
            businessStatusCode: get(existingTask, 'businessStatus.coding[0].code', ''),
            businessStatusDisplay: get(existingTask, 'businessStatus.coding[0].display', ''),
            executionPeriodStart: get(existingTask, 'executionPeriod.start', '').substring(0, 16),
            executionPeriodEnd: get(existingTask, 'executionPeriod.end', '').substring(0, 16),
            notes: get(existingTask, 'note[0].text', '')
          });
        }
      }
    } else {
      navigate('/tasks');
    }
  }

  if (loading && (!taskId || taskId === 'new')) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  // Build the header title
  let headerTitle = 'New Task';
  if (taskId && taskId !== 'new') {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{taskId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new tasks */}
        {!isNewTask && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new tasks */}
        {!isNewTask && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle - only for existing tasks */}
        {!isNewTask && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - only for existing tasks, gated on edit mode */}
        {!isNewTask && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDeleteButton}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <TaskFormView
          resource={task}
          form={form}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveTaskButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <TaskPreview
        resource={task}
        resourceId={taskId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='taskDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default TaskDetail;

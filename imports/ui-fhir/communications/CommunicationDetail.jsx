// /imports/ui-fhir/communications/CommunicationDetail.jsx

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
  Chip
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function CommunicationDetail(props) {
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
  const [communication, setCommunication] = useState({
    resourceType: "Communication",
    status: "completed",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/communication-category",
        code: "notification",
        display: "Notification"
      }]
    }],
    priority: "routine",
    subject: {
      reference: "",
      display: ""
    },
    topic: {
      text: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    sent: moment().format('YYYY-MM-DDTHH:mm:ss'),
    received: moment().format('YYYY-MM-DDTHH:mm:ss'),
    recipient: [{
      reference: "",
      display: ""
    }],
    sender: {
      reference: "",
      display: ""
    },
    reasonCode: [{
      text: ""
    }],
    payload: [{
      contentString: ""
    }],
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and sender on component mount for new communications
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new communications
      setIsEditing(true);
      
      // For new communications, set the patient name
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
      
      // Set sender to current user
      let senderName = '';
      let senderReference = '';
      
      if (currentUser) {
        senderName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        senderReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setCommunication(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        sender: {
          reference: senderReference,
          display: senderName
        }
      }));
    } else {
      // Viewing existing communication - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load communication if editing
  useEffect(function() {
    async function loadCommunication() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('communications.get', id);
          if (result) {
            setCommunication(result);
          }
        } catch (err) {
          console.error('Error loading communication:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadCommunication();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedCommunication = { ...communication };
    set(updatedCommunication, path, value);
    setCommunication(updatedCommunication);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing communication
        await Meteor.callAsync('communications.update', id, communication);
        console.log('Communication updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new communication
        const newId = await Meteor.callAsync('communications.create', communication);
        console.log('Communication created with ID:', newId);
        // Navigate back to communications list for new communications
        navigate('/communications');
      }
    } catch (err) {
      console.error('Error saving communication:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this communication?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('communications.remove', id);
        console.log('Communication deleted successfully');
        navigate('/communications');
      } catch (err) {
        console.error('Error deleting communication:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/communications');
  }

  const statusOptions = [
    { code: 'preparation', display: 'Preparation' },
    { code: 'in-progress', display: 'In Progress' },
    { code: 'not-done', display: 'Not Done' },
    { code: 'on-hold', display: 'On Hold' },
    { code: 'stopped', display: 'Stopped' },
    { code: 'completed', display: 'Completed' },
    { code: 'entered-in-error', display: 'Entered in Error' },
    { code: 'unknown', display: 'Unknown' }
  ];

  const priorityOptions = [
    { code: 'routine', display: 'Routine' },
    { code: 'urgent', display: 'Urgent' },
    { code: 'asap', display: 'ASAP' },
    { code: 'stat', display: 'STAT' }
  ];

  const categoryOptions = [
    { code: 'alert', display: 'Alert' },
    { code: 'notification', display: 'Notification' },
    { code: 'reminder', display: 'Reminder' },
    { code: 'instruction', display: 'Instruction' }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Communication' : 'New Communication'}
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
              value={get(communication, 'subject.display', '')}
              helperText={get(communication, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              fullWidth
              label="Sender Name"
              value={get(communication, 'sender.display', '')}
              onChange={(e) => handleChange('sender.display', e.target.value)}
              helperText={get(communication, 'sender.reference', '') || 'Sender reference will be assigned'}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Recipient Name"
              value={get(communication, 'recipient[0].display', '')}
              onChange={(e) => handleChange('recipient[0].display', e.target.value)}
              helperText="Who should receive this communication"
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                value={get(communication, 'status', 'completed')}
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
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={get(communication, 'priority', 'routine')}
                onChange={(e) => handleChange('priority', e.target.value)}
                label="Priority"
              >
                {priorityOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Category</InputLabel>
              <Select
                value={get(communication, 'category[0].coding[0].code', 'notification')}
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
              fullWidth
              label="Topic"
              value={get(communication, 'topic.text', '')}
              onChange={(e) => handleChange('topic.text', e.target.value)}
              helperText="What this communication is about"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="datetime-local"
              label="Sent Date/Time"
              value={moment(get(communication, 'sent', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('sent', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="datetime-local"
              label="Received Date/Time"
              value={moment(get(communication, 'received', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('received', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Message"
              value={get(communication, 'payload[0].contentString', '')}
              onChange={(e) => handleChange('payload[0].contentString', e.target.value)}
              helperText="The actual message content"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Reason"
              value={get(communication, 'reasonCode[0].text', '')}
              onChange={(e) => handleChange('reasonCode[0].text', e.target.value)}
              helperText="Why this communication was sent"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(communication, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about the communication"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/communications')}
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
                    // Reload the communication to discard changes
                    async function reloadCommunication() {
                      try {
                        const result = await Meteor.callAsync('communications.get', id);
                        if (result) {
                          setCommunication(result);
                        }
                      } catch (err) {
                        console.error('Error reloading communication:', err);
                      }
                    }
                    reloadCommunication();
                  } else {
                    // For new communications, go back
                    navigate('/communications');
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

export default CommunicationDetail;
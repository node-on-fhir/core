// /imports/ui-fhir/messageHeaders/MessageHeaderDetail.jsx

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
  FormControlLabel,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function MessageHeaderDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user and patient from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Subscribe to MessageHeaders
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.MessageHeaders', {}, {});
    } else {
      handle = Meteor.subscribe('messageHeaders.all');
    }
    return handle.ready();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [messageHeader, setMessageHeader] = useState({
    resourceType: "MessageHeader",
    eventCoding: {
      system: "http://hl7.org/fhir/message-events",
      code: "",
      display: ""
    },
    eventUri: "",
    destination: [{
      name: "",
      target: {
        reference: "",
        display: ""
      },
      endpoint: "",
      receiver: {
        reference: "",
        display: ""
      }
    }],
    sender: {
      reference: "",
      display: ""
    },
    source: {
      name: "",
      software: "",
      version: "",
      endpoint: ""
    },
    responsible: {
      reference: "",
      display: ""
    },
    reason: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/message-reasons-encounter",
        code: "",
        display: ""
      }],
      text: ""
    },
    response: {
      identifier: "",
      code: "ok"
    },
    focus: [{
      reference: "",
      display: ""
    }],
    definition: "",
    note: [{
      text: ""
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new message headers
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new message headers
      setIsEditing(true);
    } else {
      // Viewing existing message header - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load message header if editing
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      const existingMessageHeader = MessageHeaders.findOne({_id: id});
      if (existingMessageHeader) {
        setMessageHeader(existingMessageHeader);
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedMessageHeader = { ...messageHeader };
    set(updatedMessageHeader, path, value);
    setMessageHeader(updatedMessageHeader);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing message header
        await Meteor.callAsync('updateMessageHeader', id, messageHeader);
        console.log('Message header updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new message header
        console.log('Creating message header with data:', JSON.stringify(messageHeader, null, 2));
        const newId = await Meteor.callAsync('createMessageHeader', messageHeader);
        console.log('Message header created with ID:', newId);
        // Navigate back to message headers list for new message headers
        navigate('/message-headers');
      }
    } catch (err) {
      console.error('Error saving message header:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this message header?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeMessageHeader', id);
        console.log('Message header deleted successfully');
        navigate('/message-headers');
      } catch (err) {
        console.error('Error deleting message header:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/message-headers');
  }

  // Handle resource search for focus field
  function handleSearchResource() {
    console.log('Opening resource search dialog...');
    // TODO: Implement resource search dialog for focus references
  }

  const eventOptions = [
    { code: 'diagnosticreport-provide', display: 'Provide Diagnostic Report' },
    { code: 'communication-request', display: 'Communication Request' },
    { code: 'observation-provide', display: 'Provide Observation' },
    { code: 'patient-link', display: 'Link Patients' },
    { code: 'patient-unlink', display: 'Unlink Patients' },
    { code: 'valueset-expand', display: 'Expand Value Set' },
    { code: 'admin-notify', display: 'Administrative Notification' },
    { code: 'notification', display: 'Event Notification' }
  ];

  const responseCodeOptions = [
    { value: 'ok', display: 'OK' },
    { value: 'transient-error', display: 'Transient Error' },
    { value: 'fatal-error', display: 'Fatal Error' }
  ];

  const reasonOptions = [
    { code: 'admit', display: 'Admit' },
    { code: 'discharge', display: 'Discharge' },
    { code: 'absent', display: 'Absent' },
    { code: 'return', display: 'Return' },
    { code: 'moved', display: 'Moved' },
    { code: 'edit', display: 'Edit' },
    { code: 'routine-notification', display: 'Routine Notification' }
  ];

  return (
    <Container id="messageHeaderDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Message Header' : 'New Message Header'}
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
            <Typography variant="h6">Event Information</Typography>
            
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  id="eventCodingInput"
                  value={get(messageHeader, 'eventCoding.code', '')}
                  onChange={(e) => {
                    const option = eventOptions.find(o => o.code === e.target.value);
                    if (option) {
                      handleChange('eventCoding', {
                        system: "http://hl7.org/fhir/message-events",
                        code: option.code,
                        display: option.display
                      });
                    }
                  }}
                  label="Event Type"
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  {eventOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                id="eventCodingInput"
                fullWidth
                label="Event Type"
                value={get(messageHeader, 'eventCoding.display', '') || get(messageHeader, 'eventCoding.code', '')}
                disabled
                inputProps={{
                  'data-value': get(messageHeader, 'eventCoding.code', '')
                }}
              />
            )}
            
            <TextField
              id="eventDisplayInput"
              fullWidth
              label="Event Display"
              value={get(messageHeader, 'eventCoding.display', '')}
              onChange={(e) => handleChange('eventCoding.display', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="eventUriInput"
              fullWidth
              label="Event URI"
              value={get(messageHeader, 'eventUri', '')}
              onChange={(e) => handleChange('eventUri', e.target.value)}
              disabled={!isEditing}
              placeholder="http://example.org/event-definition"
            />
            
            <Typography variant="h6">Destination</Typography>
            
            <TextField
              id="destinationNameInput"
              fullWidth
              label="Destination Name"
              value={get(messageHeader, 'destination[0].name', '')}
              onChange={(e) => handleChange('destination[0].name', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="destinationEndpointInput"
              fullWidth
              label="Destination Endpoint"
              value={get(messageHeader, 'destination[0].endpoint', '')}
              onChange={(e) => handleChange('destination[0].endpoint', e.target.value)}
              disabled={!isEditing}
              placeholder="http://example.org/endpoint"
            />
            
            <TextField
              id="destinationTargetInput"
              fullWidth
              label="Destination Target Reference"
              value={get(messageHeader, 'destination[0].target.reference', '')}
              onChange={(e) => handleChange('destination[0].target.reference', e.target.value)}
              disabled={!isEditing}
              placeholder="Device/123"
            />
            
            <TextField
              id="destinationTargetDisplayInput"
              fullWidth
              label="Destination Target Display"
              value={get(messageHeader, 'destination[0].target.display', '')}
              onChange={(e) => handleChange('destination[0].target.display', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Sender & Source</Typography>
            
            <TextField
              id="senderDisplayInput"
              fullWidth
              label="Sender Display"
              value={get(messageHeader, 'sender.display', '')}
              onChange={(e) => handleChange('sender.display', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="senderReferenceInput"
              fullWidth
              label="Sender Reference"
              value={get(messageHeader, 'sender.reference', '')}
              onChange={(e) => handleChange('sender.reference', e.target.value)}
              disabled={!isEditing}
              placeholder="Organization/123"
            />
            
            <TextField
              id="sourceNameInput"
              fullWidth
              label="Source Name"
              value={get(messageHeader, 'source.name', '')}
              onChange={(e) => handleChange('source.name', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="senderEndpointInput"
              fullWidth
              label="Source Endpoint"
              value={get(messageHeader, 'source.endpoint', '')}
              onChange={(e) => handleChange('source.endpoint', e.target.value)}
              disabled={!isEditing}
              placeholder="http://example.org/source"
              required
            />
            
            <TextField
              id="senderTargetInput"
              fullWidth
              label="Source Software"
              value={get(messageHeader, 'source.software', '')}
              onChange={(e) => handleChange('source.software', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="senderTargetDisplayInput"
              fullWidth
              label="Source Version"
              value={get(messageHeader, 'source.version', '')}
              onChange={(e) => handleChange('source.version', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Reason & Response</Typography>
            
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Reason Code</InputLabel>
                <Select
                  id="reasonCodeInput"
                  value={get(messageHeader, 'reason.coding[0].code', '')}
                  onChange={(e) => {
                    const option = reasonOptions.find(o => o.code === e.target.value);
                    if (option) {
                      handleChange('reason', {
                        coding: [{
                          system: "http://terminology.hl7.org/CodeSystem/message-reasons-encounter",
                          code: option.code,
                          display: option.display
                        }],
                        text: option.display
                      });
                    }
                  }}
                  label="Reason Code"
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  {reasonOptions.map(option => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                id="reasonCodeInput"
                fullWidth
                label="Reason Code"
                value={get(messageHeader, 'reason.coding[0].display', '') || get(messageHeader, 'reason.coding[0].code', '')}
                disabled
                inputProps={{
                  'data-value': get(messageHeader, 'reason.coding[0].code', '')
                }}
              />
            )}
            
            <TextField
              id="reasonDisplayInput"
              fullWidth
              label="Reason Display"
              value={get(messageHeader, 'reason.text', '')}
              onChange={(e) => handleChange('reason.text', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="responseIdInput"
              fullWidth
              label="Response Identifier"
              value={get(messageHeader, 'response.identifier', '')}
              onChange={(e) => handleChange('response.identifier', e.target.value)}
              disabled={!isEditing}
              placeholder="Original message ID this is responding to"
            />
            
            {isEditing ? (
              <FormControl fullWidth>
                <InputLabel>Response Code</InputLabel>
                <Select
                  id="responseCodeSelect"
                  value={get(messageHeader, 'response.code', 'ok')}
                  onChange={(e) => handleChange('response.code', e.target.value)}
                  label="Response Code"
                >
                  {responseCodeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.display}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                id="responseCodeSelect"
                fullWidth
                label="Response Code"
                value={(() => {
                  const code = get(messageHeader, 'response.code', 'ok');
                  const option = responseCodeOptions.find(o => o.value === code);
                  return option ? option.display : code;
                })()}
                disabled
                inputProps={{
                  'data-value': get(messageHeader, 'response.code', 'ok')
                }}
              />
            )}
            
            <Typography variant="h6">Focus</Typography>
            
            <TextField
              id="focusTargetInput"
              fullWidth
              label="Focus Reference"
              value={get(messageHeader, 'focus[0].reference', '')}
              onChange={(e) => handleChange('focus[0].reference', e.target.value)}
              disabled={!isEditing}
              placeholder="Patient/123"
            />
            
            <TextField
              id="focusDisplayInput"
              fullWidth
              label="Focus Display"
              value={get(messageHeader, 'focus[0].display', '')}
              onChange={(e) => handleChange('focus[0].display', e.target.value)}
              disabled={!isEditing}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Search for resource">
                      <IconButton
                        onClick={handleSearchResource}
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
            
            <Typography variant="h6">Additional Information</Typography>
            
            <TextField
              id="definitionInput"
              fullWidth
              label="Definition"
              value={get(messageHeader, 'definition', '')}
              onChange={(e) => handleChange('definition', e.target.value)}
              disabled={!isEditing}
              placeholder="http://example.org/MessageDefinition/123"
            />
            
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={get(messageHeader, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/message-headers')}
              >
                Back
              </Button>
              <Button 
                color="error"
                onClick={handleDelete}
              >
                Delete
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
                    // Reload the message header to discard changes
                    const existingMessageHeader = MessageHeaders.findOne({_id: id});
                    if (existingMessageHeader) {
                      setMessageHeader(existingMessageHeader);
                    }
                  } else {
                    // For new message headers, go back
                    navigate('/message-headers');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                id="saveMessageHeaderButton"
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

export default MessageHeaderDetail;
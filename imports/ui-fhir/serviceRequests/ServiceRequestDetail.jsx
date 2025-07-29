// /imports/ui-fhir/serviceRequests/ServiceRequestDetail.jsx

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
  Switch
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function ServiceRequestDetail(props) {
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
  const [serviceRequest, setServiceRequest] = useState({
    resourceType: "ServiceRequest",
    status: "active",
    intent: "order",
    priority: "routine",
    doNotPerform: false,
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    orderDetail: [],
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    occurrencePeriod: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(7, 'days').format('YYYY-MM-DD')
    },
    asNeededBoolean: false,
    authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss'),
    requester: {
      reference: "",
      display: ""
    },
    performerType: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    },
    performer: [{
      reference: "",
      display: ""
    }],
    locationReference: [{
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
    reasonReference: [],
    insurance: [],
    supportingInfo: [],
    specimen: [],
    bodySite: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    note: [{
      text: ""
    }],
    patientInstruction: "",
    relevantHistory: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient name and requester on component mount for new service requests
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new service requests
      setIsEditing(true);
      
      // For new service requests, set the patient name
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
      
      // Set requester to current user
      let requesterName = '';
      let requesterReference = '';
      
      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }
      
      setServiceRequest(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        requester: {
          reference: requesterReference,
          display: requesterName
        }
      }));
    } else {
      // Viewing existing service request - start in read-only mode
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load service request if editing
  useEffect(function() {
    async function loadServiceRequest() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('serviceRequests.get', id);
          if (result) {
            setServiceRequest(result);
          }
        } catch (err) {
          console.error('Error loading service request:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadServiceRequest();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedServiceRequest = { ...serviceRequest };
    set(updatedServiceRequest, path, value);
    setServiceRequest(updatedServiceRequest);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing service request
        await Meteor.callAsync('serviceRequests.update', id, serviceRequest);
        console.log('Service request updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new service request
        const newId = await Meteor.callAsync('serviceRequests.create', serviceRequest);
        console.log('Service request created with ID:', newId);
        // Navigate back to service requests list for new service requests
        navigate('/service-requests');
      }
    } catch (err) {
      console.error('Error saving service request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this service request?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('serviceRequests.remove', id);
        console.log('Service request deleted successfully');
        navigate('/service-requests');
      } catch (err) {
        console.error('Error deleting service request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/service-requests');
  }

  const statusOptions = [
    { code: 'draft', display: 'Draft' },
    { code: 'active', display: 'Active' },
    { code: 'on-hold', display: 'On Hold' },
    { code: 'revoked', display: 'Revoked' },
    { code: 'completed', display: 'Completed' },
    { code: 'entered-in-error', display: 'Entered in Error' },
    { code: 'unknown', display: 'Unknown' }
  ];

  const intentOptions = [
    { code: 'proposal', display: 'Proposal' },
    { code: 'plan', display: 'Plan' },
    { code: 'directive', display: 'Directive' },
    { code: 'order', display: 'Order' },
    { code: 'original-order', display: 'Original Order' },
    { code: 'reflex-order', display: 'Reflex Order' },
    { code: 'filler-order', display: 'Filler Order' },
    { code: 'instance-order', display: 'Instance Order' },
    { code: 'option', display: 'Option' }
  ];

  const priorityOptions = [
    { code: 'routine', display: 'Routine' },
    { code: 'urgent', display: 'Urgent' },
    { code: 'asap', display: 'ASAP' },
    { code: 'stat', display: 'STAT' }
  ];

  const categoryOptions = [
    { code: '103693007', display: 'Diagnostic procedure' },
    { code: '387713003', display: 'Surgical procedure' },
    { code: '409063005', display: 'Counseling' },
    { code: '409073007', display: 'Education' },
    { code: '108252007', display: 'Laboratory procedure' },
    { code: '363679005', display: 'Imaging' },
    { code: '410201008', display: 'Physical therapy' },
    { code: '410203006', display: 'Occupational therapy' }
  ];

  return (
    <Container id="serviceRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Service Request' : 'New Service Request'}
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
              id="subjectDisplay"
              fullWidth
              label="Patient Name"
              value={get(serviceRequest, 'subject.display', '')}
              helperText={get(serviceRequest, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled // Always disabled to prevent editing
            />
            
            <TextField
              id="requesterDisplay"
              fullWidth
              label="Requester Name"
              value={get(serviceRequest, 'requester.display', '')}
              onChange={(e) => handleChange('requester.display', e.target.value)}
              helperText={get(serviceRequest, 'requester.reference', '') || 'Requester reference will be assigned'}
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="status"
                value={get(serviceRequest, 'status', 'active')}
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
              <InputLabel>Intent</InputLabel>
              <Select
                id="intent"
                value={get(serviceRequest, 'intent', 'order')}
                onChange={(e) => handleChange('intent', e.target.value)}
                label="Intent"
              >
                {intentOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Priority</InputLabel>
              <Select
                id="priority"
                value={get(serviceRequest, 'priority', 'routine')}
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
            
            <FormControlLabel
              control={
                <Switch
                  checked={get(serviceRequest, 'doNotPerform', false)}
                  onChange={(e) => handleChange('doNotPerform', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="Do Not Perform"
            />
            
            <TextField
              id="codeCode"
              fullWidth
              label="Service Code"
              value={get(serviceRequest, 'code.coding[0].code', '')}
              onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
              helperText="SNOMED CT code for the service"
              disabled={!isEditing}
            />
            
            <TextField
              id="codeDisplay"
              fullWidth
              label="Service Description"
              value={get(serviceRequest, 'code.coding[0].display', '')}
              onChange={(e) => {
                handleChange('code.coding[0].display', e.target.value);
                handleChange('code.text', e.target.value);
              }}
              helperText="Human-readable description of the service"
              disabled={!isEditing}
            />
            
            <TextField
              id="categoryCode"
              fullWidth
              label="Category Code"
              value={get(serviceRequest, 'category[0].coding[0].code', '')}
              onChange={(e) => handleChange('category[0].coding[0].code', e.target.value)}
              helperText="SNOMED CT code for service category"
              disabled={!isEditing}
            />
            
            <TextField
              id="categoryDisplay"
              fullWidth
              label="Category Description"
              value={get(serviceRequest, 'category[0].coding[0].display', '')}
              onChange={(e) => {
                handleChange('category[0].coding[0].display', e.target.value);
                handleChange('category[0].text', e.target.value);
              }}
              helperText="Description of the service category"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="datetime-local"
              label="Requested Date/Time"
              value={moment(get(serviceRequest, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('occurrenceDateTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              id="authoredOn"
              fullWidth
              type="datetime-local"
              label="Authored On"
              value={moment(get(serviceRequest, 'authoredOn', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('authoredOn', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={get(serviceRequest, 'asNeededBoolean', false)}
                  onChange={(e) => handleChange('asNeededBoolean', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="As Needed"
            />
            
            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer Name"
              value={get(serviceRequest, 'performer[0].display', '')}
              onChange={(e) => handleChange('performer[0].display', e.target.value)}
              helperText="Who should perform this service"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Location"
              value={get(serviceRequest, 'locationReference[0].display', '')}
              onChange={(e) => handleChange('locationReference[0].display', e.target.value)}
              helperText="Where the service should be performed"
              disabled={!isEditing}
            />
            
            <TextField
              id="reasonCode"
              fullWidth
              label="Reason Code"
              value={get(serviceRequest, 'reasonCode[0].coding[0].code', '')}
              onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
              helperText="SNOMED CT code for the reason"
              disabled={!isEditing}
            />
            
            <TextField
              id="reasonDisplay"
              fullWidth
              label="Reason Description"
              value={get(serviceRequest, 'reasonCode[0].text', '')}
              onChange={(e) => {
                handleChange('reasonCode[0].coding[0].display', e.target.value);
                handleChange('reasonCode[0].text', e.target.value);
              }}
              helperText="Why this service is being requested"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Body Site"
              value={get(serviceRequest, 'bodySite[0].text', '')}
              onChange={(e) => handleChange('bodySite[0].text', e.target.value)}
              helperText="Anatomical location for the service"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Patient Instructions"
              value={get(serviceRequest, 'patientInstruction', '')}
              onChange={(e) => handleChange('patientInstruction', e.target.value)}
              helperText="Instructions for the patient"
              disabled={!isEditing}
            />
            
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={get(serviceRequest, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              helperText="Additional notes about the service request"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/service-requests')}
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
                    // Reload the service request to discard changes
                    async function reloadServiceRequest() {
                      try {
                        const result = await Meteor.callAsync('serviceRequests.get', id);
                        if (result) {
                          setServiceRequest(result);
                        }
                      } catch (err) {
                        console.error('Error reloading service request:', err);
                      }
                    }
                    reloadServiceRequest();
                  } else {
                    // For new service requests, go back
                    navigate('/service-requests');
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
                id="saveServiceRequestButton"
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

export default ServiceRequestDetail;
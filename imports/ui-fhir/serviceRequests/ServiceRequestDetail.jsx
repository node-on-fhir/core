// /imports/ui-fhir/serviceRequests/ServiceRequestDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  InputAdornment,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'draft': 'default',
  'active': 'success',
  'on-hold': 'warning',
  'revoked': 'error',
  'completed': 'info',
  'entered-in-error': 'error',
  'unknown': 'default'
};

const intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'directive', label: 'Directive' },
  { value: 'order', label: 'Order' },
  { value: 'original-order', label: 'Original Order' },
  { value: 'reflex-order', label: 'Reflex Order' },
  { value: 'filler-order', label: 'Filler Order' },
  { value: 'instance-order', label: 'Instance Order' },
  { value: 'option', label: 'Option' }
];

const priorityOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'asap', label: 'ASAP' },
  { value: 'stat', label: 'STAT' }
];

function ServiceRequestDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const serviceRequestId = id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRequest = !serviceRequestId || serviceRequestId === 'new';
  const isExistingRequest = serviceRequestId && serviceRequestId !== 'new';

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to service requests
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.ServiceRequests', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('servicerequests.all');
    }
    return handle.ready();
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
    category: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    subject: {
      reference: "",
      display: ""
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    asNeededBoolean: false,
    authoredOn: moment().format('YYYY-MM-DDTHH:mm:ss'),
    requester: {
      reference: "",
      display: ""
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
    patientInstruction: ""
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setServiceRequest(function(prev) {
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

  // Set patient and requester on component mount for new service requests
  useEffect(function() {
    if (isNewRequest) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', '')}`;
      }

      let requesterName = '';
      let requesterReference = '';

      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setServiceRequest(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          requester: {
            reference: requesterReference,
            display: requesterName
          }
        };
      });
    }
  }, [serviceRequestId, selectedPatient, currentUser]);

  // Load service request if viewing existing one
  useEffect(function() {
    if (isExistingRequest) {
      const existingRequest = ServiceRequests.findOne({_id: serviceRequestId});

      if (existingRequest) {
        setServiceRequest(existingRequest);
        setIsEditing(false);
      } else {
        const requestById = ServiceRequests.findOne({id: serviceRequestId});
        if (requestById) {
          setServiceRequest(requestById);
          setIsEditing(false);
        }
      }
    }
  }, [serviceRequestId]);

  // Reload when subscription becomes ready (for direct URL navigation)
  useEffect(function() {
    if (isExistingRequest && isSubscriptionReady) {
      const existingRequest = ServiceRequests.findOne({_id: serviceRequestId});
      if (existingRequest) {
        setServiceRequest(existingRequest);
      } else {
        const requestById = ServiceRequests.findOne({id: serviceRequestId});
        if (requestById) {
          setServiceRequest(requestById);
        }
      }
    }
  }, [serviceRequestId, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedServiceRequest = { ...serviceRequest };
    set(updatedServiceRequest, path, value);
    setServiceRequest(updatedServiceRequest);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedServiceRequest);
    }
  }

  // Handle search for patient
  function handleSearchUser() {
    console.log('[ServiceRequestDetail] Search for patient clicked');
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRequest) {
        await Meteor.callAsync('serviceRequests.update', serviceRequestId, serviceRequest);
        console.log('[ServiceRequestDetail] Service request updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('serviceRequests.create', serviceRequest);
        console.log('[ServiceRequestDetail] Service request created with ID:', newId);
        navigate('/service-requests');
      }
    } catch (err) {
      console.error('[ServiceRequestDetail] Error saving service request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingRequest) return;

    if (window.confirm('Are you sure you want to delete this service request?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('serviceRequests.remove', serviceRequestId);
        console.log('[ServiceRequestDetail] Service request deleted successfully');
        navigate('/service-requests');
      } catch (err) {
        console.error('[ServiceRequestDetail] Error deleting service request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingRequest) {
      setIsEditing(false);
      setError(null);
      // Reload to discard changes
      const existingRequest = ServiceRequests.findOne({_id: serviceRequestId});
      if (existingRequest) {
        setServiceRequest(existingRequest);
      } else {
        const requestById = ServiceRequests.findOne({id: serviceRequestId});
        if (requestById) {
          setServiceRequest(requestById);
        }
      }
    } else {
      navigate('/service-requests');
    }
  }

  // Build the header title
  let headerTitle = 'New Service Request';
  if (isExistingRequest) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{serviceRequestId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new requests */}
        {!isNewRequest && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new requests (always form) */}
        {!isNewRequest && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle — only for existing requests */}
        {!isNewRequest && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing requests, gated on edit mode */}
        {!isNewRequest && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
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
  function renderFormView() {
    return (
      <>
        <Stack spacing={3}>
          <Typography variant="h6">Patient</Typography>

          {/* Patient Field */}
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(serviceRequest, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            helperText={get(serviceRequest, 'subject.reference', '') || 'Patient reference will be assigned'}
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

          <Divider />
          <Typography variant="h6">Service Details</Typography>

          {/* Service Code + Display */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="codeCode"
              fullWidth
              label="Service Code"
              value={get(serviceRequest, 'code.coding[0].code', '')}
              onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
              helperText="SNOMED CT code"
              disabled={!isEditing}
            />
            <TextField
              id="codeDisplay"
              fullWidth
              label="Service Description"
              value={get(serviceRequest, 'code.coding[0].display', '')}
              onChange={function(e) {
                handleChange('code.coding[0].display', e.target.value);
                handleChange('code.text', e.target.value);
              }}
              helperText="Human-readable description"
              disabled={!isEditing}
            />
          </Stack>

          {/* Category */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="categoryCode"
              fullWidth
              label="Category Code"
              value={get(serviceRequest, 'category[0].coding[0].code', '')}
              onChange={function(e) { handleChange('category[0].coding[0].code', e.target.value); }}
              helperText="SNOMED CT code for category"
              disabled={!isEditing}
            />
            <TextField
              id="categoryDisplay"
              fullWidth
              label="Category Description"
              value={get(serviceRequest, 'category[0].coding[0].display', '')}
              onChange={function(e) {
                handleChange('category[0].coding[0].display', e.target.value);
                handleChange('category[0].text', e.target.value);
              }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Status & Intent</Typography>

          {/* Status, Intent, Priority */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="statusSelect"
                value={get(serviceRequest, 'status', 'active')}
                label="Status"
                onChange={function(e) { handleChange('status', e.target.value); }}
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

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="intent-label">Intent</InputLabel>
              <Select
                labelId="intent-label"
                id="intentSelect"
                value={get(serviceRequest, 'intent', 'order')}
                label="Intent"
                onChange={function(e) { handleChange('intent', e.target.value); }}
              >
                {intentOptions.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="prioritySelect"
                value={get(serviceRequest, 'priority', 'routine')}
                label="Priority"
                onChange={function(e) { handleChange('priority', e.target.value); }}
              >
                {priorityOptions.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* Do Not Perform + As Needed */}
          <Stack direction="row" spacing={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={get(serviceRequest, 'doNotPerform', false)}
                  onChange={function(e) { handleChange('doNotPerform', e.target.checked); }}
                  disabled={!isEditing}
                />
              }
              label="Do Not Perform"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={get(serviceRequest, 'asNeededBoolean', false)}
                  onChange={function(e) { handleChange('asNeededBoolean', e.target.checked); }}
                  disabled={!isEditing}
                />
              }
              label="As Needed"
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Scheduling</Typography>

          {/* Occurrence DateTime + Authored On */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="occurrenceDateTime"
              fullWidth
              type="datetime-local"
              label="Occurrence Date/Time"
              value={moment(get(serviceRequest, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={function(e) { handleChange('occurrenceDateTime', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            <TextField
              id="authoredOn"
              fullWidth
              type="datetime-local"
              label="Authored On"
              value={moment(get(serviceRequest, 'authoredOn', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={function(e) { handleChange('authoredOn', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">People</Typography>

          {/* Requester */}
          <TextField
            id="requesterDisplay"
            fullWidth
            label="Requester"
            value={get(serviceRequest, 'requester.display', '')}
            onChange={function(e) { handleChange('requester.display', e.target.value); }}
            helperText={get(serviceRequest, 'requester.reference', '')}
            disabled={!isEditing}
          />

          {/* Performer + Location */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer"
              value={get(serviceRequest, 'performer[0].display', '')}
              onChange={function(e) { handleChange('performer[0].display', e.target.value); }}
              helperText="Who should perform this service"
              disabled={!isEditing}
            />
            <TextField
              id="locationDisplay"
              fullWidth
              label="Location"
              value={get(serviceRequest, 'locationReference[0].display', '')}
              onChange={function(e) { handleChange('locationReference[0].display', e.target.value); }}
              helperText="Where the service should be performed"
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Clinical</Typography>

          {/* Reason Code */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="reasonCode"
              fullWidth
              label="Reason Code"
              value={get(serviceRequest, 'reasonCode[0].coding[0].code', '')}
              onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
              helperText="SNOMED CT code for the reason"
              disabled={!isEditing}
            />
            <TextField
              id="reasonDisplay"
              fullWidth
              label="Reason Description"
              value={get(serviceRequest, 'reasonCode[0].text', '')}
              onChange={function(e) {
                handleChange('reasonCode[0].coding[0].display', e.target.value);
                handleChange('reasonCode[0].text', e.target.value);
              }}
              helperText="Why this service is being requested"
              disabled={!isEditing}
            />
          </Stack>

          {/* Body Site */}
          <TextField
            id="bodySite"
            fullWidth
            label="Body Site"
            value={get(serviceRequest, 'bodySite[0].text', '')}
            onChange={function(e) { handleChange('bodySite[0].text', e.target.value); }}
            helperText="Anatomical location for the service"
            disabled={!isEditing}
          />

          <Divider />
          <Typography variant="h6">Instructions & Notes</Typography>

          {/* Patient Instructions */}
          <TextField
            id="patientInstruction"
            fullWidth
            multiline
            rows={2}
            label="Patient Instructions"
            value={get(serviceRequest, 'patientInstruction', '')}
            onChange={function(e) { handleChange('patientInstruction', e.target.value); }}
            helperText="Instructions for the patient"
            disabled={!isEditing}
          />

          {/* Notes */}
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(serviceRequest, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            helperText="Additional notes about the service request"
            disabled={!isEditing}
          />
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveServiceRequestButton"
              onClick={handleSave}
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
  function renderPreviewView() {
    const codeDisplay = get(serviceRequest, 'code.text', '') ||
                        get(serviceRequest, 'code.coding[0].display', 'Untitled Service Request');
    const statusValue = get(serviceRequest, 'status', 'unknown');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');
    const intentValue = get(serviceRequest, 'intent', '');
    const intentLabel = get(intentOptions.find(function(opt) { return opt.value === intentValue; }), 'label', intentValue);
    const priorityValue = get(serviceRequest, 'priority', '');
    const priorityLabel = get(priorityOptions.find(function(opt) { return opt.value === priorityValue; }), 'label', priorityValue);
    const patientDisplay = get(serviceRequest, 'subject.display', '');
    const patientReference = get(serviceRequest, 'subject.reference', '');
    const requesterDisplay = get(serviceRequest, 'requester.display', '');
    const performerDisplay = get(serviceRequest, 'performer[0].display', '');
    const locationDisplay = get(serviceRequest, 'locationReference[0].display', '');
    const authoredOn = get(serviceRequest, 'authoredOn', '');
    const formattedAuthoredOn = authoredOn ? moment(authoredOn).format('MMMM D, YYYY [at] h:mm A') : '';
    const occurrenceDateTime = get(serviceRequest, 'occurrenceDateTime', '');
    const formattedOccurrence = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';
    const categoryDisplay = get(serviceRequest, 'category[0].text', '') ||
                             get(serviceRequest, 'category[0].coding[0].display', '');
    const reasonDisplay = get(serviceRequest, 'reasonCode[0].text', '') ||
                          get(serviceRequest, 'reasonCode[0].coding[0].display', '');
    const reasonCode = get(serviceRequest, 'reasonCode[0].coding[0].code', '');
    const bodySite = get(serviceRequest, 'bodySite[0].text', '');
    const noteText = get(serviceRequest, 'note[0].text', '');
    const patientInstruction = get(serviceRequest, 'patientInstruction', '');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Title (code display) + Status Chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {codeDisplay}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        {/* Subtitle: intent + priority */}
        {(intentLabel || priorityLabel) && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {intentLabel}{priorityLabel ? ' \u2022 ' + priorityLabel : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata: Patient/Requester (left), Date/Priority (right) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {patientDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {patientDisplay}
                </Typography>
              </>
            )}
            {patientReference && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {patientReference}
              </Typography>
            )}
            {requesterDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Requester
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {requesterDisplay}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {formattedAuthoredOn && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Authored On
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {formattedAuthoredOn}
                </Typography>
              </>
            )}
            {formattedOccurrence && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Occurrence
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedOccurrence}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Category, Performer, Location */}
        {(categoryDisplay || performerDisplay || locationDisplay) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {categoryDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {categoryDisplay}
                    </Typography>
                  </Box>
                )}
                {performerDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Performer
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {performerDisplay}
                    </Typography>
                  </Box>
                )}
                {locationDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {locationDisplay}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Reason section */}
        {(reasonDisplay || reasonCode) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Reason
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Body Site section */}
        {bodySite && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Body Site
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {bodySite}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Patient Instructions section */}
        {patientInstruction && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Patient Instructions
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {patientInstruction}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Notes section */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Notes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '100px'
            }}
          >
            {noteText || 'No notes provided.'}
          </Typography>
        </Box>

        <Divider />

        {/* Footer with ID */}
        {isExistingRequest && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Service Request ID: {serviceRequestId}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="serviceRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ServiceRequestDetail;

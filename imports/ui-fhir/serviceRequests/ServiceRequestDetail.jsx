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

import ServiceRequestFormView from './ServiceRequestFormView';
import ServiceRequestPreview from './ServiceRequestPreview';

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
    console.log('[ServiceRequestDetail] Search for patient clicked'); // phi-audit: ok
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
              aria-label="Preview"
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
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewRequest && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewRequest && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <ServiceRequestFormView
          resource={serviceRequest}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

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
    return (
      <ServiceRequestPreview
        resource={serviceRequest}
        resourceId={isExistingRequest ? serviceRequestId : null}
      />
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

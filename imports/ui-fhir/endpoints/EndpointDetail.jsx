// /imports/ui-fhir/endpoints/EndpointDetail.jsx

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

import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import EndpointFormView from './EndpointFormView';
import EndpointPreview from './EndpointPreview';

function EndpointDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewEndpoint = !id || id === 'new';
  const isExistingEndpoint = id && id !== 'new';

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to endpoint data
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (isExistingEndpoint) {
      console.log('[EndpointDetail] Subscribing to endpoints');
      const handle = Meteor.subscribe('autopublish.Endpoints', {}, {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [endpoint, setEndpoint] = useState({
    resourceType: "Endpoint",
    status: "active",
    name: "",
    address: "",
    connectionType: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/endpoint-connection-type",
        code: "",
        display: ""
      }]
    }],
    payloadType: [{
      coding: [{
        system: "http://hl7.org/fhir/ValueSet/endpoint-payload-type",
        code: "",
        display: ""
      }],
      text: ""
    }],
    payloadMimeType: ["application/fhir+json"],
    managingOrganization: {
      reference: "",
      display: ""
    },
    period: {
      start: "",
      end: ""
    },
    header: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setEndpoint(function(prev) {
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

  // Set default values on component mount for new endpoints
  useEffect(function() {
    if (isNewEndpoint) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  // Load endpoint from collection
  useEffect(function() {
    if (isExistingEndpoint) {
      console.log('[EndpointDetail] Loading endpoint from collection');
      const existingEndpoint = Endpoints.findOne({_id: id}) || Endpoints.findOne({id: id});

      if (existingEndpoint) {
        console.log('[EndpointDetail] Loaded endpoint:', {
          _id: existingEndpoint._id,
          name: get(existingEndpoint, 'name'),
          address: get(existingEndpoint, 'address'),
          status: get(existingEndpoint, 'status')
        });
        setEndpoint(existingEndpoint);
        setIsEditing(false);
      } else {
        console.warn('[EndpointDetail] Endpoint not found in collection:', id);
        setError('Endpoint not found');
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedEndpoint = { ...endpoint };
    set(updatedEndpoint, path, value);
    setEndpoint(updatedEndpoint);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedEndpoint);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[EndpointDetail] Saving endpoint:', {
      name: get(endpoint, 'name'),
      address: get(endpoint, 'address'),
      status: get(endpoint, 'status'),
      fullEndpoint: endpoint
    });

    try {
      if (isExistingEndpoint) {
        await Meteor.callAsync('endpoints.update', id, endpoint);
        console.log('Endpoint updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('endpoints.create', endpoint);
        console.log('Endpoint created with ID:', newId);
        navigate('/endpoints');
      }
    } catch (err) {
      console.error('Error saving endpoint:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewEndpoint) return;

    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('endpoints.remove', id);
        console.log('Endpoint deleted successfully');
        navigate('/endpoints');
      } catch (err) {
        console.error('Error deleting endpoint:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingEndpoint) {
      setIsEditing(false);
      setError(null);
      const existingEndpoint = Endpoints.findOne({_id: id});
      if (existingEndpoint) {
        setEndpoint(existingEndpoint);
      }
    } else {
      navigate('/endpoints');
    }
  }

  // Build the header title
  let headerTitle = 'New Endpoint';
  if (isExistingEndpoint) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{get(endpoint, '_id') || id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new endpoints */}
        {!isNewEndpoint && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new endpoints (always form) */}
        {!isNewEndpoint && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
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
        {!isNewEndpoint && (
          <Button
              id="editEndpointButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewEndpoint && (
          <Button
              id="deleteEndpointButton"
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
        <EndpointFormView
          resource={endpoint}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveEndpointButton"
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
    return <EndpointPreview resource={endpoint} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="endpointDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default EndpointDetail;

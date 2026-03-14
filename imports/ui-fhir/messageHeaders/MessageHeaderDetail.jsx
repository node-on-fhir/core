// /imports/ui-fhir/messageHeaders/MessageHeaderDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MessageHeaderFormView from './MessageHeaderFormView';
import MessageHeaderPreview from './MessageHeaderPreview';

function MessageHeaderDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Get current user and patient from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Subscribe to MessageHeaders
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.MessageHeaders', Session.get('selectedPatientId'), {});
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

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMessageHeader(function(prev) {
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

  const isNewRecord = !id || id === 'new';

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
    if (id && id !== 'new') {
      const existingMessageHeader = MessageHeaders.findOne({_id: id}) || MessageHeaders.findOne({id: id});
      if (existingMessageHeader) {
        setMessageHeader(existingMessageHeader);
        setIsEditing(false);
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedMessageHeader = { ...messageHeader };
    set(updatedMessageHeader, path, value);
    setMessageHeader(updatedMessageHeader);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMessageHeader);
    }
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
    if (id && id !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      setError(null);
      const existingMessageHeader = MessageHeaders.findOne({_id: id});
      if (existingMessageHeader) {
        setMessageHeader(existingMessageHeader);
      }
    } else {
      navigate('/message-headers');
    }
  }

  // Build the header title
  var headerTitle = 'New Message Header';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {!isNewRecord && (
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

        {/* Form toggle -- hidden for new records (always form) */}
        {!isNewRecord && (
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

        {/* Lock / Unlock toggle -- only for existing records */}
        {!isNewRecord && (
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

        {/* Delete -- only for existing records, gated on edit mode */}
        {!isNewRecord && (
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
        <MessageHeaderFormView
          resource={messageHeader}
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
              id="saveMessageHeaderButton"
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
      <MessageHeaderPreview
        resource={messageHeader}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="messageHeaderDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default MessageHeaderDetail;

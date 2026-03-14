// imports/ui-fhir/auditEvents/AuditEventDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

import AuditEventFormView from './AuditEventFormView';
import AuditEventPreview from './AuditEventPreview';

export function AuditEventDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [auditEvent, setAuditEvent] = useState({
    resourceType: 'AuditEvent',
    type: {
      system: 'http://hl7.org/fhir/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    action: 'R',
    recorded: new Date().toISOString(),
    outcome: '0',
    outcomeDesc: '',
    agent: [{
      who: { display: '' },
      requestor: true
    }],
    source: {
      observer: { display: 'Honeycomb FHIR Server' }
    },
    entity: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setAuditEvent(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isNewRecord = !id || id === 'new';

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.AuditEvents', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('auditEvents', {}, {});
    }
    return handle.ready();
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      const existingAuditEvent = AuditEvents.findOne({ _id: id }) || AuditEvents.findOne({ id: id });
      if (existingAuditEvent) {
        setAuditEvent(existingAuditEvent);
        setIsEditing(false);
      }
    } else if (id === 'new' || !id) {
      setIsEditing(true);
    }
  }, [id]);

  function handleChange(path, value) {
    const newAuditEvent = { ...auditEvent };
    set(newAuditEvent, path, value);
    setAuditEvent(newAuditEvent);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newAuditEvent);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        type: auditEvent.type,
        action: auditEvent.action,
        recorded: auditEvent.recorded || new Date().toISOString(),
        outcome: auditEvent.outcome,
        outcomeDesc: auditEvent.outcomeDesc,
        agent: auditEvent.agent,
        source: auditEvent.source,
        entity: auditEvent.entity
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('auditEvents.update', id, dataToSave);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('auditEvents.insert', dataToSave);
        navigate('/audit-events');
      }
    } catch (err) {
      console.error('Error saving audit event:', err);
      setError(err.message || 'Failed to save audit event');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this audit event?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('auditEvents.remove', id);
        navigate('/audit-events');
      } catch (err) {
        console.error('Error deleting audit event:', err);
        setError(err.message || 'Failed to delete audit event');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      const existingAuditEvent = AuditEvents.findOne({ _id: id });
      if (existingAuditEvent) {
        setAuditEvent(existingAuditEvent);
      }
      setIsEditing(false);
    } else {
      navigate('/audit-events');
    }
  }

  // Build the header title
  let headerTitle = 'New Audit Event';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewRecord && (
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

        {/* Form toggle */}
        {!isNewRecord && (
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

        {/* Lock / Unlock toggle */}
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

        {/* Delete */}
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
  function renderFormView(){
    return (
      <>
        <AuditEventFormView
          resource={auditEvent}
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
              id="saveAuditEventButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Save')}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <AuditEventPreview
        resource={auditEvent}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="auditEventDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default AuditEventDetail;

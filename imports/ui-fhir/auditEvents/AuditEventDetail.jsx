// imports/ui-fhir/auditEvents/AuditEventDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Grid,
  Alert
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { AuditEvents } from '../../lib/schemas/SimpleSchemas/AuditEvents';

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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  function handleEdit() {
    setIsEditing(true);
  }

  function handleBack() {
    navigate('/audit-events');
  }

  if (isEmbedded) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Event Type</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="typeCodeInput"
            fullWidth
            label="Type Code"
            value={get(auditEvent, 'type.code', '')}
            onChange={(e) => handleChange('type.code', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <TextField
            id="typeDisplayInput"
            fullWidth
            label="Type Display"
            value={get(auditEvent, 'type.display', '')}
            onChange={(e) => handleChange('type.display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="action-label">Action</InputLabel>
            <Select
              id="actionSelect"
              labelId="action-label"
              value={get(auditEvent, 'action', '')}
              onChange={(e) => handleChange('action', e.target.value)}
              label="Action"
              disabled={!isEditing}
            >
              <MenuItem value="C">Create (C)</MenuItem>
              <MenuItem value="R">Read (R)</MenuItem>
              <MenuItem value="U">Update (U)</MenuItem>
              <MenuItem value="D">Delete (D)</MenuItem>
              <MenuItem value="E">Execute (E)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="outcome-label">Outcome</InputLabel>
            <Select
              id="outcomeSelect"
              labelId="outcome-label"
              value={get(auditEvent, 'outcome', '')}
              onChange={(e) => handleChange('outcome', e.target.value)}
              label="Outcome"
              disabled={!isEditing}
            >
              <MenuItem value="0">Success (0)</MenuItem>
              <MenuItem value="4">Minor Failure (4)</MenuItem>
              <MenuItem value="8">Serious Failure (8)</MenuItem>
              <MenuItem value="12">Major Failure (12)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="outcomeDescInput"
            fullWidth
            label="Outcome Description"
            value={get(auditEvent, 'outcomeDesc', '')}
            onChange={(e) => handleChange('outcomeDesc', e.target.value)}
            disabled={!isEditing}
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="recordedInput"
            fullWidth
            label="Recorded Date/Time"
            type="datetime-local"
            value={get(auditEvent, 'recorded', '').substring(0, 16)}
            onChange={(e) => handleChange('recorded', new Date(e.target.value).toISOString())}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Agent</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="agentWhoDisplayInput"
            fullWidth
            label="Agent (Who)"
            value={get(auditEvent, 'agent.0.who.display', '')}
            onChange={(e) => handleChange('agent.0.who.display', e.target.value)}
            disabled={!isEditing}
            helperText="The actor involved in the event"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Source</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="sourceObserverDisplayInput"
            fullWidth
            label="Source Observer"
            value={get(auditEvent, 'source.observer.display', '')}
            onChange={(e) => handleChange('source.observer.display', e.target.value)}
            disabled={!isEditing}
            helperText="The system reporting the event"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="sourceSiteInput"
            fullWidth
            label="Source Site"
            value={get(auditEvent, 'source.site', '')}
            onChange={(e) => handleChange('source.site', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Entity</Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="entityWhatReferenceInput"
            fullWidth
            label="Entity Reference"
            value={get(auditEvent, 'entity.0.what.reference', '')}
            onChange={(e) => handleChange('entity.0.what.reference', e.target.value)}
            disabled={!isEditing}
            helperText="Reference to the data/object accessed (e.g., Patient/123)"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="entityWhatDisplayInput"
            fullWidth
            label="Entity Display"
            value={get(auditEvent, 'entity.0.what.display', '')}
            onChange={(e) => handleChange('entity.0.what.display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Container id="auditEventDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Audit Event Details' : 'New Audit Event'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Event Type</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="typeCodeInput"
                fullWidth
                label="Type Code"
                value={get(auditEvent, 'type.code', '')}
                onChange={(e) => handleChange('type.code', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                id="typeDisplayInput"
                fullWidth
                label="Type Display"
                value={get(auditEvent, 'type.display', '')}
                onChange={(e) => handleChange('type.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="action-label">Action</InputLabel>
                <Select
                  id="actionSelect"
                  labelId="action-label"
                  value={get(auditEvent, 'action', '')}
                  onChange={(e) => handleChange('action', e.target.value)}
                  label="Action"
                  disabled={!isEditing}
                >
                  <MenuItem value="C">Create (C)</MenuItem>
                  <MenuItem value="R">Read (R)</MenuItem>
                  <MenuItem value="U">Update (U)</MenuItem>
                  <MenuItem value="D">Delete (D)</MenuItem>
                  <MenuItem value="E">Execute (E)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="outcome-label">Outcome</InputLabel>
                <Select
                  id="outcomeSelect"
                  labelId="outcome-label"
                  value={get(auditEvent, 'outcome', '')}
                  onChange={(e) => handleChange('outcome', e.target.value)}
                  label="Outcome"
                  disabled={!isEditing}
                >
                  <MenuItem value="0">Success (0)</MenuItem>
                  <MenuItem value="4">Minor Failure (4)</MenuItem>
                  <MenuItem value="8">Serious Failure (8)</MenuItem>
                  <MenuItem value="12">Major Failure (12)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="outcomeDescInput"
                fullWidth
                label="Outcome Description"
                value={get(auditEvent, 'outcomeDesc', '')}
                onChange={(e) => handleChange('outcomeDesc', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="recordedInput"
                fullWidth
                label="Recorded Date/Time"
                type="datetime-local"
                value={get(auditEvent, 'recorded', '').substring(0, 16)}
                onChange={(e) => handleChange('recorded', new Date(e.target.value).toISOString())}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Agent</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="agentWhoDisplayInput"
                fullWidth
                label="Agent (Who)"
                value={get(auditEvent, 'agent.0.who.display', '')}
                onChange={(e) => handleChange('agent.0.who.display', e.target.value)}
                disabled={!isEditing}
                helperText="The actor involved in the event"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Source</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="sourceObserverDisplayInput"
                fullWidth
                label="Source Observer"
                value={get(auditEvent, 'source.observer.display', '')}
                onChange={(e) => handleChange('source.observer.display', e.target.value)}
                disabled={!isEditing}
                helperText="The system reporting the event"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="sourceSiteInput"
                fullWidth
                label="Source Site"
                value={get(auditEvent, 'source.site', '')}
                onChange={(e) => handleChange('source.site', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Entity</Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="entityWhatReferenceInput"
                fullWidth
                label="Entity Reference"
                value={get(auditEvent, 'entity.0.what.reference', '')}
                onChange={(e) => handleChange('entity.0.what.reference', e.target.value)}
                disabled={!isEditing}
                helperText="Reference to the data/object accessed (e.g., Patient/123)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="entityWhatDisplayInput"
                fullWidth
                label="Entity Display"
                value={get(auditEvent, 'entity.0.what.display', '')}
                onChange={(e) => handleChange('entity.0.what.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Box>
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
            {id && id !== 'new' && !isEditing && (
              <Button
                id="deleteAuditEventButton"
                color="error"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box>
            {isEditing ? (
              <>
                <Button onClick={handleCancel} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button
                  id="saveAuditEventButton"
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {id && id !== 'new' ? 'Update' : 'Save'}
                </Button>
              </>
            ) : (
              <Button
                id="editAuditEventButton"
                variant="contained"
                color="primary"
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}
          </Box>
        </CardActions>
      </Card>
    </Container>
  );
}

export default AuditEventDetail;

// npmPackages/fhircast-module/client/components/PublishEvent.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Button, Box, Typography, Alert,
  FormControl, InputLabel, Select, MenuItem, ListSubheader
} from '@mui/material';
import { Random } from 'meteor/random';

import { EventType } from '../lib/types.js';
import { DEFAULT_TOPIC, DEFAULT_CONTEXT } from '../lib/constants.js';
import {
  LifecycleToFhircast,
  AllLifecycleEvents
} from '../../../record-lifecycle/lib/RecordLifecycleEvents';

// =============================================================================
// CONSTANTS
// =============================================================================

var EVENT_EVENT = 'hub.event';
var EVENT_TOPIC = 'hub.topic';

// Lifecycle events that have a FHIRcast mapping
var PUBLISHABLE_LIFECYCLE_EVENTS = AllLifecycleEvents.filter(function(evt) {
  return LifecycleToFhircast[evt] !== null && LifecycleToFhircast[evt] !== undefined;
});

// =============================================================================
// PUBLISH EVENT
// =============================================================================

function PublishEvent({ isPublishAllowed, onPublishEvent, topic: propTopic, onTopicChange, embedded }) {
  const [eventName, setEventName] = useState(EventType.PatientOpen);
  const [contextString, setContextString] = useState(
    JSON.stringify(DEFAULT_CONTEXT, null, 2)
  );
  const [contextError, setContextError] = useState(null);
  const [internalTopic, setInternalTopic] = useState(DEFAULT_TOPIC);
  const [previousId, setPreviousId] = useState(null);

  var effectiveTopic = propTopic !== undefined ? propTopic : internalTopic;
  var handleTopicChange = onTopicChange
    ? function(e) { onTopicChange(e.target.value); }
    : function(e) { setInternalTopic(e.target.value); };

  function validateContextJson(context) {
    try {
      var parsedContext = JSON.parse(context);
      var isArray = Array.isArray(parsedContext);
      var err = isArray ? null : 'Context should be an array';
      setContextError(err);
      return isArray;
    } catch (e) {
      setContextError('Invalid JSON');
      return false;
    }
  }

  function handlePublishEvent() {
    if (!validateContextJson(contextString)) {
      return;
    }

    if (!onPublishEvent) {
      return;
    }

    var resolvedEventName = eventName;

    // If a lifecycle event was selected, resolve to FHIRcast event name
    if (AllLifecycleEvents.indexOf(eventName) !== -1) {
      var fhircastAction = LifecycleToFhircast[eventName];
      if (fhircastAction) {
        // Try to infer resource type from context
        var parsedCtx = JSON.parse(contextString);
        var resourceType = '';
        if (Array.isArray(parsedCtx) && parsedCtx.length > 0) {
          resourceType = (parsedCtx[0].resource && parsedCtx[0].resource.resourceType) || '';
        }
        if (resourceType) {
          resolvedEventName = resourceType.toLowerCase() + '-' + fhircastAction;
        } else {
          resolvedEventName = 'patient-' + fhircastAction;
        }
      }
    }

    var evt = {};
    evt[EVENT_TOPIC] = effectiveTopic;
    evt[EVENT_EVENT] = resolvedEventName;
    evt.context = JSON.parse(contextString);

    var id = Random.id();
    setPreviousId(id);
    onPublishEvent(evt, id);
  }

  function handleContextChange(e) {
    var value = e.target.value;
    setContextString(value);
    validateContextJson(value);
  }

  var isFormDisabled = !isPublishAllowed;
  var isContextInvalid = Boolean(contextError);
  var isPublishDisabled = isFormDisabled || isContextInvalid;

  // Build menu items with grouped sections
  function renderEventMenuItems() {
    var items = [];

    // FHIRcast Events group
    items.push(
      <ListSubheader key="fhircast-header" sx={{ bgcolor: 'background.paper', fontWeight: 'bold' }}>
        FHIRcast Events
      </ListSubheader>
    );
    Object.values(EventType).forEach(function(value) {
      items.push(
        <MenuItem key={value} value={value}>{value}</MenuItem>
      );
    });

    // Lifecycle Events group
    items.push(
      <ListSubheader key="lifecycle-header" sx={{ bgcolor: 'background.paper', fontWeight: 'bold' }}>
        Lifecycle Events
      </ListSubheader>
    );
    PUBLISHABLE_LIFECYCLE_EVENTS.forEach(function(evt) {
      var fhircastAction = LifecycleToFhircast[evt];
      var label = evt + ' \u2192 ' + fhircastAction;
      items.push(
        <MenuItem key={'lifecycle-' + evt} value={evt}>{label}</MenuItem>
      );
    });

    return items;
  }

  var formContent = (
    <>
      {isFormDisabled ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          WebSocket not bound to hub. Events will be publishable once the connection is established.
        </Alert>
      ) : null}
      <Box component="form" onSubmit={function(e) { e.preventDefault(); }}>
        <TextField
          id="publishTopicInput"
          fullWidth
          label="Topic"
          value={topic}
          onChange={function(e) { setTopic(e.target.value); }}
          disabled={isFormDisabled}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }} disabled={isFormDisabled}>
          <InputLabel id="event-type-label">Event</InputLabel>
          <Select
            labelId="event-type-label"
            id="eventTypeSelect"
            value={eventName}
            label="Event"
            onChange={function(e) { setEventName(e.target.value); }}
          >
            {renderEventMenuItems()}
          </Select>
        </FormControl>
        <TextField
          id="contextTextarea"
          fullWidth
          multiline
          rows={6}
          label="Context"
          value={contextString}
          onChange={handleContextChange}
          error={isContextInvalid}
          helperText={contextError || (contextString ? 'Valid JSON' : '')}
          disabled={isFormDisabled}
          sx={{ mb: 2 }}
          InputProps={{
            sx: { fontFamily: 'monospace', fontSize: '0.8rem' }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            id="publishButton"
            variant="contained"
            disabled={isPublishDisabled}
            onClick={handlePublishEvent}
          >
            Publish
          </Button>
        </Box>
      </Box>
      {previousId ? (
        <Box sx={{ pt: 1 }}>
          <Typography variant="caption" sx={{ color: 'success.main' }}>
            Published event with ID <strong>{previousId}</strong>
          </Typography>
        </Box>
      ) : null}
    </>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper', opacity: isFormDisabled ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <CardHeader
        title="Publish Event"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}

export default PublishEvent;

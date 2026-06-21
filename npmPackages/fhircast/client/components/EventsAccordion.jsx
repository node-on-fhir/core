// npmPackages/fhircast-module/client/components/EventsAccordion.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  Alert, Chip, Typography, Box, Collapse, IconButton, Button,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { get } from 'lodash';

// =============================================================================
// HELPERS
// =============================================================================

function getEventType(evt) {
  return get(evt, 'event.hub_event') || get(evt, ['event', 'hub.event'], 'unknown');
}

function getEventTimestamp(evt) {
  return get(evt, 'timestamp') || get(evt, '_receivedAt', '');
}

function sortByTimestampDesc(a, b) {
  var tsA = getEventTimestamp(a);
  var tsB = getEventTimestamp(b);
  if (tsA > tsB) return -1;
  if (tsA < tsB) return 1;
  return 0;
}

function getUniqueEventTypes(events) {
  var types = {};
  events.forEach(function(evt) {
    var type = getEventType(evt);
    types[type] = true;
  });
  return Object.keys(types);
}

// =============================================================================
// EVENT ITEM
// =============================================================================

function EventItem({ evt, severity }) {
  const [expanded, setExpanded] = useState(false);

  var eventType = getEventType(evt);
  var eventTopic = get(evt, 'event.hub_topic') || get(evt, ['event', 'hub.topic'], '');
  var eventId = get(evt, 'id', '');
  var timestamp = get(evt, 'timestamp', '');

  return (
    <Alert
      severity={severity}
      sx={{ mb: 1, cursor: 'pointer' }}
      onClick={function() { setExpanded(!expanded); }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {eventType !== 'unknown' ? (
            <Chip label={eventType} size="small" color="info" />
          ) : null}
          <IconButton size="small" sx={{ color: 'inherit' }}>
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      }
    >
      <Typography variant="body2">
        {timestamp ? timestamp + ' — ' : ''}
        <strong>{eventId}</strong>
        {eventTopic ? ' — topic: ' + eventTopic : ''}
      </Typography>
      <Collapse in={expanded}>
        <Box sx={{
          mt: 1,
          p: 1,
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          bgcolor: 'background.default',
          borderRadius: 1
        }}>
          {JSON.stringify(evt, null, 2)}
        </Box>
      </Collapse>
    </Alert>
  );
}

// =============================================================================
// EVENTS ACCORDION (now a flat chronological list with filter)
// =============================================================================

function EventsAccordion({ events, title, severity, emptyMessage }) {
  var effectiveTitle = title || 'Events';
  var effectiveSeverity = severity || 'info';
  var effectiveEmpty = emptyMessage || 'No events yet';

  const [filterType, setFilterType] = useState('all');
  const [displayLimit, setDisplayLimit] = useState(100);

  var safeEvents = events || [];
  var eventTypes = getUniqueEventTypes(safeEvents);

  // Filter by selected type
  var filteredEvents = filterType === 'all'
    ? safeEvents
    : safeEvents.filter(function(evt) { return getEventType(evt) === filterType; });

  // Sort by timestamp descending (newest first)
  var sortedEvents = filteredEvents.slice().sort(sortByTimestampDesc);

  var displayedEvents = sortedEvents.slice(0, displayLimit);
  var hasMore = sortedEvents.length > displayLimit;

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title={effectiveTitle}
        action={
          safeEvents.length > 0 ? (
            <Chip
              label={safeEvents.length}
              size="small"
              color="default"
              sx={{ mr: 1 }}
            />
          ) : null
        }
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        {eventTypes.length > 0 ? (
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="event-type-filter-label">Filter by event type</InputLabel>
            <Select
              labelId="event-type-filter-label"
              value={filterType}
              label="Filter by event type"
              onChange={function(e) { setFilterType(e.target.value); setDisplayLimit(100); }}
            >
              <MenuItem value="all">All ({safeEvents.length})</MenuItem>
              {eventTypes.map(function(type) {
                var count = safeEvents.filter(function(evt) { return getEventType(evt) === type; }).length;
                return (
                  <MenuItem key={type} value={type}>{type} ({count})</MenuItem>
                );
              })}
            </Select>
          </FormControl>
        ) : null}

        {displayedEvents.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {effectiveEmpty}
          </Typography>
        ) : (
          displayedEvents.map(function(evt, index) {
            return (
              <EventItem
                key={get(evt, 'id', index)}
                evt={evt}
                severity={effectiveSeverity}
              />
            );
          })
        )}
        {hasMore ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={function() { setDisplayLimit(function(prev) { return prev + 100; }); }}
            >
              Load More ({sortedEvents.length - displayLimit} remaining)
            </Button>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default EventsAccordion;

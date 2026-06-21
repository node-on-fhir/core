// npmPackages/fhircast-module/client/components/ReceivedEvents.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Typography, Box
} from '@mui/material';
import { get } from 'lodash';

// =============================================================================
// EVENT ROW
// =============================================================================

function EventRow({ evt }) {
  var eventTopic = get(evt, 'event[hub.topic]', get(evt, 'event.hub\\.topic', ''));
  var eventName = get(evt, 'event[hub.event]', get(evt, 'event.hub\\.event', ''));

  return (
    <TableRow>
      <TableCell sx={{ color: 'text.primary', fontFamily: 'monospace', fontSize: '0.75rem' }}>
        {evt.id}
      </TableCell>
      <TableCell sx={{ color: 'text.primary' }}>
        {eventTopic}
      </TableCell>
      <TableCell>
        <Chip
          label={eventName}
          size="small"
          color="info"
        />
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// RECEIVED EVENTS
// =============================================================================

function ReceivedEvents({ events }) {
  var latestEvent = events.length > 0 ? events[0] : null;

  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardHeader
        title="Received Events"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        {events.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No events received yet
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" id="receivedEventsTable">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Topic</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Event</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map(function(evt, index) {
                  return <EventRow key={index} evt={evt} />;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
      {latestEvent ? (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ color: 'success.main' }}>
            Received event with ID <strong>{latestEvent.id}</strong>
          </Typography>
        </Box>
      ) : null}
    </Card>
  );
}

export default ReceivedEvents;

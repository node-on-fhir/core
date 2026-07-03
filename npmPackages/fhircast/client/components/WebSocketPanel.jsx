// npmPackages/fhircast-module/client/components/WebSocketPanel.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Alert, Box, Typography
} from '@mui/material';

import ReceivedEvents from './ReceivedEvents.jsx';
import PublishEvent from './PublishEvent.jsx';
import { useFhircastWebSocket } from '../hooks/useFhircastWebSocket.js';
import { WebSocketStatus } from '../lib/types.js';
import { DEFAULT_WS_URL } from '../lib/constants.js';

// =============================================================================
// STATUS MAPPING
// =============================================================================

var STATUS_SEVERITY = {};
STATUS_SEVERITY[WebSocketStatus.Closed] = 'warning';
STATUS_SEVERITY[WebSocketStatus.Opening] = 'info';
STATUS_SEVERITY[WebSocketStatus.Open] = 'info';

var STATUS_TEXT = {};
STATUS_TEXT[WebSocketStatus.Closed] = 'Closed';
STATUS_TEXT[WebSocketStatus.Opening] = 'Opening...';
STATUS_TEXT[WebSocketStatus.Open] = 'Waiting for confirmation...';

// =============================================================================
// STATUS TEXT COMPONENT
// =============================================================================

function StatusDisplay({ status, isBound, endpoint }) {
  if (isBound) {
    return (
      <Alert severity="success" sx={{ mb: 0 }}>
        Bound to <strong>{endpoint}</strong>
      </Alert>
    );
  }

  var severity = STATUS_SEVERITY[status] || 'warning';
  var text = STATUS_TEXT[status] || 'Unknown';

  return (
    <Alert severity={severity} sx={{ mb: 0 }}>
      {text}
    </Alert>
  );
}

// =============================================================================
// WEBSOCKET PANEL
// =============================================================================

function WebSocketPanel({ endpoint, connect }) {
  const [url, setUrl] = useState(DEFAULT_WS_URL);
  const [receivedEvents, setReceivedEvents] = useState([]);

  var ws = useFhircastWebSocket({
    url: url,
    endpoint: endpoint,
    connect: connect,
    onEvent: function(evt) {
      setReceivedEvents(function(prevEvents) { return [evt].concat(prevEvents); });
    }
  });

  var status = ws.status;
  var isBound = ws.isBound;
  var publishEvent = ws.publishEvent;

  return (
    <Box>
      <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <CardHeader
          title="WebSocket"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem'
            }
          }}
        />
        <CardContent>
          <TextField
            id="wsUrlInput"
            fullWidth
            label="WebSocket URL"
            value={url}
            onChange={function(e) { setUrl(e.target.value); }}
            disabled={isBound}
            sx={{ mb: 2 }}
          />
          <StatusDisplay
            status={status}
            isBound={isBound}
            endpoint={endpoint}
          />
        </CardContent>
      </Card>
      <ReceivedEvents events={receivedEvents} />
      <PublishEvent isPublishAllowed={isBound} onPublishEvent={publishEvent} />
    </Box>
  );
}

export default WebSocketPanel;

// npmPackages/fhircast-module/client/FhircastSubscribePage.jsx

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardHeader, CardContent,
  TextField, Button, Alert, Autocomplete, Chip,
  CircularProgress, Typography, FormControlLabel, Checkbox,
  InputAdornment, Tooltip, IconButton
} from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSearchParams } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { FhircastEvents } from '../lib/FhircastEvents';
import SubscriptionList from './components/SubscriptionList.jsx';
import EventsAccordion from './components/EventsAccordion.jsx';
import { useFhircastWebSocket } from './hooks/useFhircastWebSocket.js';
import { SubscriptionParams, SubscriptionMode, EventType, WebSocketStatus } from './lib/types.js';
import {
  DEFAULT_HUB_URL,
  DEFAULT_CLIENT_URL,
  DEFAULT_SECRET,
  DEFAULT_TOPIC,
  DEFAULT_LEASE,
  DEFAULT_WS_URL,
  WEBSOCKET_CHANNEL_TYPE
} from './lib/constants.js';
import { sanitizeDottedKeys } from '../lib/sanitize.js';

// =============================================================================
// CONSTANTS
// =============================================================================

var SubscriptionStatus = {
  Idle: 'Idle',
  Unsubscribing: 'Unsubscribing',
  Subscribing: 'Subscribing'
};

var EVENT_OPTIONS = Object.values(EventType).map(function(value) {
  return { value: value, label: value };
});

var INITIAL_SUB = {};
INITIAL_SUB[SubscriptionParams.events] = [EventType.PatientOpen, EventType.PatientClose, EventType.ImagingStudyOpen, EventType.ImagingStudyClose];
INITIAL_SUB[SubscriptionParams.secret] = DEFAULT_SECRET;
INITIAL_SUB[SubscriptionParams.topic] = DEFAULT_TOPIC;
INITIAL_SUB[SubscriptionParams.lease] = DEFAULT_LEASE;
INITIAL_SUB[SubscriptionParams.channelType] = WEBSOCKET_CHANNEL_TYPE;

// =============================================================================
// STATUS MAPPING
// =============================================================================

var STATUS_TEXT = {};
STATUS_TEXT[WebSocketStatus.Closed] = 'Closed';
STATUS_TEXT[WebSocketStatus.Opening] = 'Opening...';
STATUS_TEXT[WebSocketStatus.Open] = 'Waiting for confirmation...';

// =============================================================================
// HELPERS
// =============================================================================

function isSuccessStatus(status) {
  return status && status >= 200 && status < 300;
}

async function sendSubscription(url, subscription, authorization) {
  var payload = Object.assign({}, subscription);
  if (Array.isArray(payload['hub.events'])) {
    payload['hub.events'] = payload['hub.events'].join(',');
  }

  var mode = payload['hub.mode'];
  var methodName = mode === 'unsubscribe' ? 'fhircast.unsubscribe' : 'fhircast.subscribe';

  try {
    var result = await Meteor.rpc(methodName, { hubUrl: url, subscriptionData: payload, authorization: authorization });
    return { status: result.status };
  } catch (error) {
    console.error('[fhircast] Subscription error:', error);
    return null;
  }
}

// =============================================================================
// FHIRCAST SUBSCRIBE PAGE
// =============================================================================

function FhircastSubscribePage() {
  var [searchParams] = useSearchParams();
  var topicFromUrl = searchParams.get('topic');

  // Subscription form state — use topic from URL query param if provided
  var initialSub = INITIAL_SUB;
  if (topicFromUrl) {
    initialSub = Object.assign({}, INITIAL_SUB, {
      [SubscriptionParams.topic]: topicFromUrl
    });
  }
  var [subscription, setSubscription] = useState(initialSub);

  // Authorization visibility: default hidden, ?authorization=true shows it
  var [showAuthorization, setShowAuthorization] = useState(
    searchParams.get('authorization') === 'true'
  );
  var [hubUrl, setHubUrl] = useState(DEFAULT_HUB_URL);
  var [authorization, setAuthorization] = useState('');
  var [clientUrl, setClientUrl] = useState(DEFAULT_CLIENT_URL);
  var [subscriptions, setSubscriptions] = useState({});
  var [error, setError] = useState(null);
  var [status, setStatus] = useState(SubscriptionStatus.Idle);

  // WebSocket state
  var [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  var [wsEndpoint, setWsEndpoint] = useState(Random.id());
  var [connectWebSocket, setConnectWebSocket] = useState(false);
  var [receivedEvents, setReceivedEvents] = useState([]);
  var [saveToMinimongo, setSaveToMinimongo] = useState(true);
  var [saveToServer, setSaveToServer] = useState(false);

  var ws = useFhircastWebSocket({
    url: wsUrl,
    endpoint: wsEndpoint,
    connect: connectWebSocket,
    onEvent: function(evt) {
      setReceivedEvents(function(prev) { return [evt].concat(prev); });
      if (saveToMinimongo) {
        FhircastEvents.insert(Object.assign({}, sanitizeDottedKeys(evt), {
          _receivedAt: new Date().toISOString(),
          _source: 'ws-client'
        }));
      }
    }
  });

  // Set topic from URL param or Session on mount
  useEffect(function() {
    var topicParam = searchParams.get('topic');
    if (topicParam) {
      setSubscription(function(prev) {
        return Object.assign({}, prev, {
          [SubscriptionParams.topic]: topicParam
        });
      });
    } else {
      var patientId = Session.get('selectedPatientId') || Session.get('selectedPatient');
      if (patientId && typeof patientId === 'string') {
        setSubscription(function(prev) {
          return Object.assign({}, prev, {
            [SubscriptionParams.topic]: patientId
          });
        });
      }
    }
  }, []);

  // Subscribe to DDP events from Meteor pub/sub (reliable fallback)
  var ddpEvents = useTracker(function() {
    Meteor.subscribe('fhircast.events');
    return FhircastEvents.find({}, { sort: { _receivedAt: -1 }, limit: 200 }).fetch();
  }, []);

  // Merge WS events with DDP events for display
  var allReceivedEvents = receivedEvents.concat(ddpEvents);

  // =========================================================================
  // SUBSCRIPTION HANDLERS
  // =========================================================================

  function handleSubscribe(mode) {
    setStatus(
      mode === SubscriptionMode.subscribe
        ? SubscriptionStatus.Subscribing
        : SubscriptionStatus.Unsubscribing
    );

    sendSubscription(hubUrl, Object.assign({}, subscription, {
      [SubscriptionParams.callback]: clientUrl,
      [SubscriptionParams.mode]: mode,
      [SubscriptionParams.channelEndpoint]: wsEndpoint
    }), authorization).then(function(response) {
      setError(getError(response));
      setStatus(SubscriptionStatus.Idle);

      var newSubs = getSubscriptions(mode, response);
      if (!newSubs) {
        return;
      }

      setSubscriptions(newSubs);

      var emptySubs = Object.values(newSubs).length === 0;
      if (emptySubs) {
        setWsEndpoint(Random.id());
      }
      setConnectWebSocket(!emptySubs);
    });
  }

  function getError(response) {
    if (!response) {
      return 'Network error: invalid hub URL?';
    }
    return isSuccessStatus(response.status) ? null : 'Error status ' + response.status;
  }

  function getSubscriptions(mode, response) {
    if (!response || !isSuccessStatus(response.status)) {
      return null;
    }

    var sub = {
      topic: subscription[SubscriptionParams.topic],
      events: subscription[SubscriptionParams.events]
    };

    return mode === SubscriptionMode.subscribe
      ? addOrUpdateSub(sub)
      : removeSubEvents(sub);
  }

  function addOrUpdateSub(sub) {
    var result = Object.assign({}, subscriptions);
    result[sub.topic] = Object.assign({}, sub, { status: 'active' });
    return result;
  }

  function removeSubEvents(sub) {
    var subKey = sub.topic;
    var foundSub = subscriptions[subKey];

    if (!foundSub) {
      return null;
    }

    var remainingEvents = foundSub.events.filter(function(e) {
      return !sub.events.includes(e);
    });

    if (remainingEvents.length === 0) {
      var result = Object.assign({}, subscriptions);
      delete result[subKey];
      return result;
    }

    var updatedResult = Object.assign({}, subscriptions);
    updatedResult[subKey] = Object.assign({}, foundSub, { events: remainingEvents });
    return updatedResult;
  }

  function handleUnsubscribeSub(sub) {
    var unsubPayload = Object.assign({}, subscription, {
      [SubscriptionParams.topic]: sub.topic,
      [SubscriptionParams.events]: sub.events,
      [SubscriptionParams.callback]: clientUrl,
      [SubscriptionParams.mode]: SubscriptionMode.unsubscribe,
      [SubscriptionParams.channelEndpoint]: wsEndpoint
    });

    setStatus(SubscriptionStatus.Unsubscribing);

    sendSubscription(hubUrl, unsubPayload, authorization).then(function(response) {
      setError(getError(response));
      setStatus(SubscriptionStatus.Idle);

      if (!response || !isSuccessStatus(response.status)) return;

      var newSubs = Object.assign({}, subscriptions);
      delete newSubs[sub.topic];
      setSubscriptions(newSubs);

      if (Object.keys(newSubs).length === 0) {
        setWsEndpoint(Random.id());
        setConnectWebSocket(false);
      }
    });
  }

  function getSubArray() {
    return Object.values(subscriptions).filter(function(sub) { return Boolean(sub); });
  }

  // =========================================================================
  // DERIVED STATE
  // =========================================================================

  var hasSubscriptions = Object.keys(subscriptions).length > 0;
  var isButtonDisabled = !hubUrl ||
    !clientUrl ||
    !subscription[SubscriptionParams.topic] ||
    status !== SubscriptionStatus.Idle;

  var selectedEvents = get(subscription, [SubscriptionParams.events], []);
  var selectedOptions = selectedEvents.map(function(value) {
    return { value: value, label: value };
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Box id="fhircastSubscribePage" sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 4,
      px: 3
    }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper', flexShrink: 0 }}>
        <CardHeader
          avatar={<CastIcon />}
          title="FHIRcast Subscribe"
          subheader="Subscription management and event monitoring"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
            '& .MuiCardHeader-avatar': { color: 'primary.contrastText' }
          }}
        />
      </Card>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
        gap: 2,
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Column 1: Subscribe to Events + Active Subscriptions (stacked) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', overflow: 'auto' }}>
          <Card sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
            <CardHeader
              title="Subscribe to Events"
              action={
                <Tooltip title={showAuthorization ? 'Hide authorization' : 'Show authorization'}>
                  <IconButton
                    size="small"
                    onClick={function() { setShowAuthorization(function(prev) { return !prev; }); }}
                  >
                    {showAuthorization ? <LockOpenIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              }
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiCardHeader-title': { fontSize: '1.1rem' }
              }}
            />
            <CardContent sx={{ flex: 1, overflow: 'auto' }}>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              ) : null}
              <Box component="form" onSubmit={function(e) { e.preventDefault(); }}>
                <TextField
                  id="subscribeHubUrlInput"
                  fullWidth
                  label="Hub URL"
                  value={hubUrl}
                  onChange={function(e) { setHubUrl(e.target.value); }}
                  disabled={hasSubscriptions}
                  sx={{ mb: 2 }}
                  size="small"
                />
                <TextField
                  id="subscribeWsUrlInput"
                  fullWidth
                  label="WebSocket URL"
                  value={wsUrl}
                  onChange={function(e) { setWsUrl(e.target.value); }}
                  disabled={ws.isBound}
                  sx={{ mb: 2 }}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={ws.isBound ? 'Bound to ' + wsEndpoint : (STATUS_TEXT[ws.status] || 'Unknown')}>
                          {ws.isBound ? (
                            <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                          ) : ws.status === WebSocketStatus.Opening ? (
                            <CircularProgress size={18} />
                          ) : ws.status === WebSocketStatus.Open ? (
                            <InfoIcon sx={{ color: 'info.main' }} fontSize="small" />
                          ) : (
                            <WarningAmberIcon sx={{ color: 'warning.main' }} fontSize="small" />
                          )}
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
                {showAuthorization ? (
                  <TextField
                    id="subscribeAuthorizationInput"
                    fullWidth
                    label="Authorization"
                    value={authorization}
                    onChange={function(e) { setAuthorization(e.target.value); }}
                    disabled={hasSubscriptions}
                    placeholder="Bearer eyJhbGciOiJSUzI1..."
                    helperText="Optional. Bearer token or session header for the hub."
                    sx={{ mb: 2 }}
                    size="small"
                  />
                ) : null}
                <TextField
                  id="subscribeTopicInput"
                  fullWidth
                  label="Topic"
                  value={subscription[SubscriptionParams.topic]}
                  onChange={function(e) {
                    setSubscription(Object.assign({}, subscription, {
                      [SubscriptionParams.topic]: e.target.value
                    }));
                  }}
                  sx={{ mb: 2 }}
                  size="small"
                />
                <Autocomplete
                  id="subscribeEventsSelect"
                  multiple
                  options={EVENT_OPTIONS}
                  getOptionLabel={function(option) { return option.label; }}
                  value={selectedOptions}
                  isOptionEqualToValue={function(option, value) {
                    return option.value === value.value;
                  }}
                  onChange={function(event, newValue) {
                    setSubscription(Object.assign({}, subscription, {
                      [SubscriptionParams.events]: newValue.map(function(o) { return o.value; })
                    }));
                  }}
                  renderTags={function(value, getTagProps) {
                    return value.map(function(option, index) {
                      return (
                        <Chip
                          key={option.value}
                          label={option.label}
                          size="small"
                          color="info"
                          {...getTagProps({ index: index })}
                        />
                      );
                    });
                  }}
                  renderInput={function(params) {
                    return <TextField {...params} label="Events" size="small" />;
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveToMinimongo}
                      onChange={function(e) { setSaveToMinimongo(e.target.checked); }}
                      size="small"
                    />
                  }
                  label="Save to client"
                  sx={{ mb: 1 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveToServer}
                      onChange={function(e) { setSaveToServer(e.target.checked); }}
                      size="small"
                    />
                  }
                  label="Save to server"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    id="subscribePageSubscribeButton"
                    variant="contained"
                    size="small"
                    disabled={isButtonDisabled}
                    onClick={function() { handleSubscribe(SubscriptionMode.subscribe); }}
                    startIcon={status === SubscriptionStatus.Subscribing ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {status === SubscriptionStatus.Subscribing ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                  <Button
                    id="subscribePageUnsubscribeButton"
                    variant="outlined"
                    size="small"
                    disabled={isButtonDisabled}
                    onClick={function() { handleSubscribe(SubscriptionMode.unsubscribe); }}
                    startIcon={status === SubscriptionStatus.Unsubscribing ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {status === SubscriptionStatus.Unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <SubscriptionList subs={getSubArray()} onUnsubscribe={handleUnsubscribeSub} />
        </Box>

        {/* Column 2: Received Events */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
          <EventsAccordion
            events={allReceivedEvents}
            title="Received Events"
            severity="info"
            emptyMessage="No events received yet"
          />
        </Box>
      </Box>
    </Box>
  );
}

export default FhircastSubscribePage;

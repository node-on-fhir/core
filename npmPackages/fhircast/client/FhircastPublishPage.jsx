// npmPackages/fhircast-module/client/FhircastPublishPage.jsx

import React, { useState } from 'react';
import {
  Container, Box, Card, CardHeader, CardContent,
  ToggleButtonGroup, ToggleButton,
  TextField, Button, Alert, CircularProgress
} from '@mui/material';
import CastIcon from '@mui/icons-material/Cast';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import { FhircastEvents } from '../lib/FhircastEvents';
import CollectionsToPublish from './components/CollectionsToPublish.jsx';
import HubEventsFeed from './components/HubEventsFeed.jsx';
import AuditEventsColumn from './components/AuditEventsColumn.jsx';
import SubscriptionList from './components/SubscriptionList.jsx';
import { useFhircastWebSocket } from './hooks/useFhircastWebSocket.js';
import { SubscriptionParams, SubscriptionMode, EventType } from './lib/types.js';
import {
  DEFAULT_HUB_URL,
  DEFAULT_CLIENT_URL,
  DEFAULT_SECRET,
  DEFAULT_TOPIC,
  DEFAULT_LEASE,
  DEFAULT_WS_URL,
  WEBSOCKET_CHANNEL_TYPE
} from './lib/constants.js';

// =============================================================================
// CONSTANTS
// =============================================================================

var MAX_EVENTS = 200;

var SubscriptionStatus = {
  Idle: 'Idle',
  Subscribing: 'Subscribing',
  Unsubscribing: 'Unsubscribing'
};

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
// FHIRCAST PUBLISH PAGE
// =============================================================================

function FhircastPublishPage() {
  var [wsEndpoint] = useState(Random.id());
  var [sentEvents, setSentEvents] = useState([]);
  var [hubEvents, setHubEvents] = useState([]);
  var [columnMode, setColumnMode] = useState(2);
  // publishMode is now managed inside CollectionsToPublish

  // Subscription state
  var [hubUrl, setHubUrl] = useState(DEFAULT_HUB_URL);
  var [authorization, setAuthorization] = useState('');
  var [clientUrl] = useState(DEFAULT_CLIENT_URL);
  var [topic, setTopic] = useState(DEFAULT_TOPIC);
  var [subscriptions, setSubscriptions] = useState({});
  var [subError, setSubError] = useState(null);
  var [subStatus, setSubStatus] = useState(SubscriptionStatus.Idle);
  var [connectWebSocket, setConnectWebSocket] = useState(false);

  // React to Construction Zone toggle (Cmd+Shift+C)
  var settingsRefresh = useTracker(function() {
    return Session.get('settingsRefreshRequest');
  });

  // Subscribe to DDP events from Meteor pub/sub
  var ddpEvents = useTracker(function() {
    Meteor.subscribe('fhircast.events');
    return FhircastEvents.find({}, { sort: { _receivedAt: -1 }, limit: MAX_EVENTS }).fetch();
  }, []);

  var ws = useFhircastWebSocket({
    url: DEFAULT_WS_URL,
    endpoint: wsEndpoint,
    connect: connectWebSocket,
    onEvent: function(event) {
      setHubEvents(function(prev) {
        var next = [event].concat(prev);
        if (next.length > MAX_EVENTS) {
          next = next.slice(0, MAX_EVENTS);
        }
        return next;
      });
    }
  });

  // Merge WebSocket events and DDP events for the hub feed
  var mergedHubEvents = ddpEvents.concat(hubEvents);

  // =========================================================================
  // SUBSCRIPTION HANDLERS
  // =========================================================================

  function handleSubscribe() {
    var defaultEvents = [
      EventType.PatientOpen, EventType.PatientClose,
      EventType.ImagingStudyOpen, EventType.ImagingStudyClose
    ];

    setSubStatus(SubscriptionStatus.Subscribing);

    sendSubscription(hubUrl, {
      [SubscriptionParams.topic]: topic,
      [SubscriptionParams.events]: defaultEvents,
      [SubscriptionParams.secret]: DEFAULT_SECRET,
      [SubscriptionParams.lease]: DEFAULT_LEASE,
      [SubscriptionParams.channelType]: WEBSOCKET_CHANNEL_TYPE,
      [SubscriptionParams.callback]: clientUrl,
      [SubscriptionParams.mode]: SubscriptionMode.subscribe,
      [SubscriptionParams.channelEndpoint]: wsEndpoint
    }, authorization).then(function(response) {
      setSubError(!response ? 'Network error: invalid hub URL?' :
        isSuccessStatus(response.status) ? null : 'Error status ' + response.status);
      setSubStatus(SubscriptionStatus.Idle);

      if (!response || !isSuccessStatus(response.status)) return;

      var newSubs = Object.assign({}, subscriptions);
      newSubs[topic] = { topic: topic, events: defaultEvents, status: 'active' };
      setSubscriptions(newSubs);
      setConnectWebSocket(true);
    });
  }

  function handleUnsubscribeSub(sub) {
    var unsubPayload = {
      [SubscriptionParams.topic]: sub.topic,
      [SubscriptionParams.events]: sub.events,
      [SubscriptionParams.secret]: DEFAULT_SECRET,
      [SubscriptionParams.lease]: DEFAULT_LEASE,
      [SubscriptionParams.channelType]: WEBSOCKET_CHANNEL_TYPE,
      [SubscriptionParams.callback]: clientUrl,
      [SubscriptionParams.mode]: SubscriptionMode.unsubscribe,
      [SubscriptionParams.channelEndpoint]: wsEndpoint
    };

    setSubStatus(SubscriptionStatus.Unsubscribing);

    sendSubscription(hubUrl, unsubPayload, authorization).then(function(response) {
      setSubError(!response ? 'Network error' :
        isSuccessStatus(response.status) ? null : 'Error status ' + response.status);
      setSubStatus(SubscriptionStatus.Idle);

      if (!response || !isSuccessStatus(response.status)) return;

      var newSubs = Object.assign({}, subscriptions);
      delete newSubs[sub.topic];
      setSubscriptions(newSubs);

      if (Object.keys(newSubs).length === 0) {
        setConnectWebSocket(false);
      }
    });
  }

  function getSubArray() {
    return Object.values(subscriptions).filter(Boolean);
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  async function handlePublishEvent(evt, id) {
    var eventData = {
      timestamp: new Date().toJSON(),
      id: id || Random.id(),
      event: evt
    };

    // Track locally for "Sent Events" tab
    setSentEvents(function(prev) {
      var next = [eventData].concat(prev);
      if (next.length > MAX_EVENTS) {
        next = next.slice(0, MAX_EVENTS);
      }
      return next;
    });

    // Publish via REST POST to hub (fires DDP insert as well)
    try {
      await Meteor.rpc('fhircast.publishEvent', { hubUrl: hubUrl, eventData: eventData });
    } catch (err) {
      console.warn('[FhircastPublishPage] Publish error:', err.reason || err.message);
    }
  }

  function handleColumnModeChange(event, newMode) {
    if (newMode !== null) {
      setColumnMode(newMode);
    }
  }

  // =========================================================================
  // DERIVED STATE
  // =========================================================================

  var hasSubscriptions = Object.keys(subscriptions).length > 0;
  var isSubscribeDisabled = !hubUrl || !topic || subStatus !== SubscriptionStatus.Idle;

  var gridColumns = columnMode === 2
    ? { xs: '1fr', md: '4fr 8fr' }
    : { xs: '1fr', md: '4fr 4fr 4fr' };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Container id="fhircastPublishPage" maxWidth={false} sx={{ py: 4, px: 3 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<CastIcon />}
          title="FHIRcast Publish"
          subheader="Event publishing and administration"
          action={
            <ToggleButtonGroup
              value={columnMode}
              exclusive
              onChange={handleColumnModeChange}
              size="small"
              sx={{ mr: 1 }}
            >
              <ToggleButton value={2} title="2-Column Layout">
                <ViewStreamIcon fontSize="small" sx={{ mr: 0.5 }} />
                2-Col
              </ToggleButton>
              <ToggleButton value={3} title="3-Column Layout">
                <ViewColumnIcon fontSize="small" sx={{ mr: 0.5 }} />
                3-Col
              </ToggleButton>
            </ToggleButtonGroup>
          }
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
        gridTemplateColumns: gridColumns,
        gap: 2,
        minHeight: 0
      }}>
        {/* Column 1: Collections Config + Hub Connection + Subscriptions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <CollectionsToPublish
            isPublishAllowed={!!hubUrl}
            onPublishEvent={handlePublishEvent}
            topic={topic}
            onTopicChange={function(val) { setTopic(val); }}
          />

          {/* Hub Connection and Subscriptions — Construction Zone guard */}
          {get(Meteor, 'settings.public.defaults.sidebar.menuItems.ConstructionZone') ? (
            <>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardHeader
                  title="Hub Connection"
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    '& .MuiCardHeader-title': { fontSize: '1.1rem' }
                  }}
                />
                <CardContent>
                  {subError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>{subError}</Alert>
                  ) : null}

                  <TextField
                    id="publishHubUrlInput"
                    fullWidth
                    label="Hub URL"
                    value={hubUrl}
                    onChange={function(e) { setHubUrl(e.target.value); }}
                    disabled={hasSubscriptions}
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  <TextField
                    id="publishAuthorizationInput"
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

                  <TextField
                    id="publishTopicInput"
                    fullWidth
                    label="Topic"
                    value={topic}
                    onChange={function(e) { setTopic(e.target.value); }}
                    sx={{ mb: 2 }}
                    size="small"
                  />

                  {/* WebSocket status */}
                  {ws.isBound ? (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Bound to <strong>{wsEndpoint}</strong>
                    </Alert>
                  ) : connectWebSocket ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Connecting...
                    </Alert>
                  ) : null}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      id="publishSubscribeButton"
                      variant="contained"
                      size="small"
                      disabled={isSubscribeDisabled || hasSubscriptions}
                      onClick={handleSubscribe}
                      startIcon={subStatus === SubscriptionStatus.Subscribing ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                      {subStatus === SubscriptionStatus.Subscribing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <SubscriptionList subs={getSubArray()} onUnsubscribe={handleUnsubscribeSub} />
            </>
          ) : null}
        </Box>

        {/* Column 2: Hub Events Feed */}
        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <HubEventsFeed
            hubEvents={mergedHubEvents}
            sentEvents={sentEvents}
          />
        </Box>

        {/* Column 3: Audit Events (only in 3-column mode) */}
        {columnMode === 3 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <AuditEventsColumn />
          </Box>
        ) : null}
      </Box>
    </Container>
  );
}

export default FhircastPublishPage;

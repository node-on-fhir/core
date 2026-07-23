// npmPackages/fhircast-module/client/components/SubscriptionPanel.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Button, Box, Alert, Autocomplete, Chip,
  CircularProgress
} from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import SubscriptionList from './SubscriptionList.jsx';
import { SubscriptionParams, SubscriptionMode, EventType } from '../lib/types.js';
import {
  DEFAULT_HUB_URL,
  DEFAULT_CLIENT_URL,
  DEFAULT_SECRET,
  DEFAULT_TOPIC,
  DEFAULT_LEASE,
  WEBSOCKET_CHANNEL_TYPE
} from '../lib/constants.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const SubscriptionStatus = {
  Idle: 'Idle',
  Unsubscribing: 'Unsubscribing',
  Subscribing: 'Subscribing'
};

const EVENT_OPTIONS = Object.values(EventType).map(function(value) {
  return { value: value, label: value };
});

const INITIAL_SUB = {
  [SubscriptionParams.events]: [
    EventType.PatientOpen,
    EventType.PatientClose
  ],
  [SubscriptionParams.secret]: DEFAULT_SECRET,
  [SubscriptionParams.topic]: DEFAULT_TOPIC,
  [SubscriptionParams.lease]: DEFAULT_LEASE,
  [SubscriptionParams.channelType]: WEBSOCKET_CHANNEL_TYPE
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
// SUBSCRIPTION PANEL
// =============================================================================

function SubscriptionPanel({ wsEndpoint, onSubscriptionsChange }) {
  const [subscription, setSubscription] = useState(INITIAL_SUB);
  const [hubUrl, setHubUrl] = useState(DEFAULT_HUB_URL);
  const [authorization, setAuthorization] = useState('');
  const [clientUrl, setClientUrl] = useState(DEFAULT_CLIENT_URL);
  const [subscriptions, setSubscriptions] = useState({});
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(SubscriptionStatus.Idle);

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

      if (onSubscriptionsChange) {
        onSubscriptionsChange(Object.values(newSubs));
      }
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

  function getSubArray() {
    return Object.values(subscriptions).filter(function(sub) { return Boolean(sub); });
  }

  var hasSubscriptions = Object.keys(subscriptions).length > 0;
  var isButtonDisabled = !hubUrl ||
    !clientUrl ||
    !subscription[SubscriptionParams.topic] ||
    status !== SubscriptionStatus.Idle;

  var selectedEvents = get(subscription, [SubscriptionParams.events], []);
  var selectedOptions = selectedEvents.map(function(value) {
    return { value: value, label: value };
  });

  return (
    <Box>
      <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
        <CardHeader
          title="Subscribe to Events"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem'
            }
          }}
        />
        <CardContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : null}
          <Box component="form" onSubmit={function(e) { e.preventDefault(); }}>
            <TextField
              id="hubUrlInput"
              fullWidth
              label="Hub URL"
              value={hubUrl}
              onChange={function(e) { setHubUrl(e.target.value); }}
              disabled={hasSubscriptions}
              sx={{ mb: 2 }}
            />
            <TextField
              id="authorizationInput"
              fullWidth
              label="Authorization"
              value={authorization}
              onChange={function(e) { setAuthorization(e.target.value); }}
              disabled={hasSubscriptions}
              placeholder="Bearer eyJhbGciOiJSUzI1..."
              helperText="Optional. Bearer token or session header for the hub."
              sx={{ mb: 2 }}
            />
            <TextField
              id="topicInput"
              fullWidth
              label="Topic"
              value={subscription[SubscriptionParams.topic]}
              onChange={function(e) {
                setSubscription(Object.assign({}, subscription, {
                  [SubscriptionParams.topic]: e.target.value
                }));
              }}
              sx={{ mb: 2 }}
            />
            <Autocomplete
              id="eventsSelect"
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
                return <TextField {...params} label="Events" />;
              }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                id="subscribeButton"
                variant="contained"
                disabled={isButtonDisabled}
                onClick={function() { handleSubscribe(SubscriptionMode.subscribe); }}
                startIcon={status === SubscriptionStatus.Subscribing ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {status === SubscriptionStatus.Subscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
              <Button
                id="unsubscribeButton"
                variant="outlined"
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
      <SubscriptionList subs={getSubArray()} />
    </Box>
  );
}

export default SubscriptionPanel;

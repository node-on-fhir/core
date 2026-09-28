// /packages/pacio-core/client/components/SandboxServersCard.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('SandboxServersCard') : console);

// Persistent (per-browser) dismissal — the section shows by default and a
// Dismiss stays dismissed across reloads until restored.
const DISMISS_KEY = 'patientFetch.sandboxServers.dismissed';

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === 'true';
  } catch (err) {
    return false;
  }
}

// Hand-seeded sandbox Endpoints (meta.source urn:honeycomb:seed:*, e.g. the
// lantern Epic R4 sandbox seed) offered as one-click fetch targets. Renders
// nothing when no sandbox endpoints are seeded.
export function SandboxServersCard(props) {
  const view = props.view || 'select';
  const currentEndpointUrl = props.currentEndpointUrl || '';

  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() {};

  const [dismissed, setDismissed] = useState(readDismissed);
  const [endpoints, setEndpoints] = useState([]);

  useEffect(function() {
    let cancelled = false;
    Meteor.rpc('connect.listSandboxEndpoints', {})
      .then(function(rows) {
        if (!cancelled) {
          // An entry with no address can't be a fetch target — drop it.
          setEndpoints((rows || []).filter(function(row) { return row.address; }));
        }
      })
      .catch(function(err) {
        // Not signed in or method unavailable — the section just stays hidden.
        log.debug('Sandbox endpoint list unavailable', { error: get(err, 'reason', err.message) });
      });
    return function() { cancelled = true; };
  }, []);

  if (endpoints.length === 0) { return null; }

  if (dismissed) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          id="showSandboxServersLink"
          size="small"
          variant="text"
          startIcon={<ScienceIcon fontSize="small" />}
          onClick={function() {
            try { window.localStorage.removeItem(DISMISS_KEY); } catch (err) { /* no-op */ }
            setDismissed(false);
          }}
        >
          Show sandbox servers
        </Button>
      </Box>
    );
  }

  function handleUseServer(endpoint) {
    navigate('/patient-fetch?view=' + view +
      '&endpoint=' + encodeURIComponent(endpoint.address) +
      '&endpointName=' + encodeURIComponent(endpoint.name || ''), { replace: true });
  }

  return (
    <Card id="sandboxServersCard" variant="outlined" sx={{ mb: 3 }}>
      <CardHeader
        title="Sandbox servers"
        subheader="Test endpoints seeded into the endpoint directory — safe for development"
        action={
          <Button
            id="dismissSandboxServersButton"
            size="small"
            onClick={function() {
              try { window.localStorage.setItem(DISMISS_KEY, 'true'); } catch (err) { /* no-op */ }
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List dense disablePadding>
          {endpoints.map(function(endpoint) {
            const active = currentEndpointUrl === endpoint.address;
            return (
              <ListItem
                key={endpoint.endpointId}
                divider
                secondaryAction={
                  <Button
                    size="small"
                    variant={active ? 'contained' : 'outlined'}
                    disabled={active}
                    onClick={function() { handleUseServer(endpoint); }}
                  >
                    {active ? 'In use' : 'Use this server'}
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
                      {endpoint.name || endpoint.address}
                      {endpoint.healthTag ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          color={endpoint.healthTag === 'up' ? 'success' : 'default'}
                          label={String(endpoint.healthTag).toUpperCase()}
                        />
                      ) : null}
                    </Box>
                  }
                  secondary={
                    <Typography component="span" variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {endpoint.address}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
}

export default SandboxServersCard;

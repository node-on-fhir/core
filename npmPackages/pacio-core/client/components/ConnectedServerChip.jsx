// /packages/pacio-core/client/components/ConnectedServerChip.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import DnsIcon from '@mui/icons-material/Dns';

// Connected-server indicator for the Remote Patients card header.
// Host is the prominent label; the tooltip carries the full URL, the
// endpoint's display name (when handed off from the Provider Directory),
// and where the value came from. Click → the interfaces panel.
//
// source: 'explicit' (chosen endpoint) | 'interface' (configured Inbound
// Fetch interface) | 'fallback' (nothing configured — this app's own
// /baseR4, surfaced as a warning so the fallback is never silent).
export function ConnectedServerChip(props) {
  const url = props.url || '';
  const name = props.name || '';
  const source = props.source || 'interface';

  const useNavigate = Meteor.useNavigate;
  const navigate = useNavigate ? useNavigate() : function() {};

  let host = url;
  try {
    host = new URL(url).host;
  } catch (err) {
    // keep the raw string as the label
  }

  let color = 'default';
  let caption = 'Configured as the Inbound Fetch interface';
  if (source === 'explicit') {
    color = 'primary';
    caption = 'Endpoint chosen from the Provider Directory';
  } else if (source === 'fallback') {
    color = 'warning';
    caption = 'No inbound-fetch interface configured — falling back to this app\'s own /baseR4';
  }

  return (
    <Tooltip
      title={
        <Box>
          {name ? (
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
              {name}
            </Typography>
          ) : null}
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
            {url}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {caption} — click to manage interfaces.
          </Typography>
        </Box>
      }
    >
      <Chip
        id="connectedServerChip"
        clickable
        icon={<DnsIcon />}
        label={host}
        color={color}
        variant={source === 'explicit' ? 'filled' : 'outlined'}
        size="small"
        onClick={function() { navigate('/server-configuration?tab=interfaces'); }}
      />
    </Tooltip>
  );
}

export default ConnectedServerChip;

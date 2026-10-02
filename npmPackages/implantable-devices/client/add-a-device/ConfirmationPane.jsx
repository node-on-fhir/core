// npmPackages/implantable-devices/client/add-a-device/ConfirmationPane.jsx
//
// Replaces the right pane after a link/save: pulsing check, variant copy,
// summary card, and the exit buttons (Data Import continuation for the app
// branch, Known devices, or reset for another device).

import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import { useNavigate } from 'react-router-dom';

import { Tag, statusTagVariant } from './FlowPrimitives.jsx';
import { BTN_PRIMARY_SX, BTN_SECONDARY_SX, BTN_GHOST_SX } from './addDeviceStyles.js';

const VARIANT_COPY = {
  linked: {
    title: 'Device linked',
    body: 'It now appears in Known devices on your profile, and new telemetry will land in your record as it arrives.',
    next: 'Nothing — data will flow in automatically.',
    status: 'active'
  },
  incomplete: {
    title: 'Saved as incomplete',
    body: 'The device is on your profile without full identifier details — add them whenever you have the label or paperwork handy.',
    next: 'Add identifier details later from Known devices.',
    status: 'incomplete'
  },
  import: {
    title: 'Device registered',
    body: 'The device is registered and waiting for its first data. Import the export file to bring its history into your record.',
    next: 'Import the export file.',
    status: 'awaiting data'
  },
  registered: {
    title: 'Device registered',
    body: 'The device is on your profile tagged "awaiting data" — its readings will attach as soon as you run an import from its app.',
    next: 'Import whenever you have an export file ready.',
    status: 'awaiting data'
  }
};

function ConfirmationPane({ done, summary, patientId, consentGranted, onAddAnother }) {
  const navigate = useNavigate();
  const copy = VARIANT_COPY[done.variant] || VARIANT_COPY.linked;
  const isImport = done.variant === 'import';

  return (
    <Box className="adv-pane">
      <Box className="adv-confirm" id="advConfirmation">
        <Box className="adv-confirm-check adv-pulse">
          <CheckIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography sx={{ fontSize: 24, fontWeight: 500, color: 'var(--pf-ink)' }}>{copy.title}</Typography>
        <Typography sx={{ fontSize: 14, color: 'var(--pf-ink-mid)', maxWidth: 480 }}>{copy.body}</Typography>

        <Box className="adv-card" sx={{ width: '100%', maxWidth: 520, textAlign: 'left' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Box className={'adv-icon-circle' + (done.variant === 'linked' ? ' adv-pulse' : '')} sx={{ width: 36, height: 36 }}>
              <MonitorHeartIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
                {summary.name}
              </Typography>
              {summary.sub && (
                <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>{summary.sub}</Typography>
              )}
            </Box>
            <Tag label={copy.status} variant={statusTagVariant(copy.status)} />
          </Box>
          <Divider sx={{ borderColor: 'var(--pf-line-soft)', mb: 1.5 }} />
          <Box className="adv-kv">
            <span className="adv-kv-label">Resource</span>
            <span className="adv-kv-value pf-mono">{'Device/' + done.deviceId + ' → Patient/' + patientId}</span>
            <span className="adv-kv-label">Consent</span>
            <span className="adv-kv-value">
              {consentGranted ? 'Continuous write · granted just now' : 'Not granted'}
            </span>
            <span className="adv-kv-label">Next</span>
            <span className="adv-kv-value">{copy.next}</span>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {isImport && (
            <Button
              id="advContinueToImportButton"
              variant="outlined"
              sx={BTN_PRIMARY_SX}
              onClick={function() { navigate('/import-data?device=' + done.deviceId); }}
            >
              Continue to Data Import →
            </Button>
          )}
          <Button
            id="advViewKnownDevicesButton"
            variant="outlined"
            sx={isImport ? BTN_SECONDARY_SX : BTN_PRIMARY_SX}
            onClick={function() { navigate('/my-profile#section-devices'); }}
          >
            View in Known devices
          </Button>
          <Button variant="text" sx={BTN_GHOST_SX} onClick={onAddAnother}>
            Add another device
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default ConfirmationPane;

// imports/ui/profile/cards/KnownDevicesCard.jsx
//
// Known devices (design handoff screen 2b): FHIR Device resources referencing
// this patient — wearables, prescribed DME, implants. Rich table with
// Source / Identifier / Streams / Consent / Last data / Status columns driven
// by the meta.tags + extensions stamped by the add-a-device flow
// (implantableDevices.linkDevice), a post-link success banner (Session
// 'deviceJustLinked'), and a "+ Add a device" header action → /add-a-device.
// Subscribes to selectedPatient.Devices (server forces the caller's own
// patientId for patient-role users).
//
// PAN upgrade: when @orbital/personal-area-network is installed (lazy Package
// check), device navigation routes to the upgraded /personal-area-network
// experience and the extension's PanDevicesProfilePanel mounts in the card.

import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import WatchIcon from '@mui/icons-material/Watch';
import AccessibleIcon from '@mui/icons-material/Accessible';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { ProfileCardHeader, AddRow } from '../ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from '../selectProfilePatient.js';

// Tag/extension vocabulary stamped by implantableDevices.linkDevice — keep in
// sync with npmPackages/implantable-devices/server/methods.js.
const SOURCE_TAG_SYSTEM = 'http://honeycomb.fhir/device-onboarding-source';
const LIFECYCLE_TAG_SYSTEM = 'http://honeycomb.fhir/device-lifecycle';
const STREAM_EXTENSION_URL = 'http://honeycomb.fhir/StructureDefinition/device-data-stream';
const WRITE_CONSENT_EXTENSION_URL = 'http://honeycomb.fhir/StructureDefinition/device-write-consent';

const DEVICE_PULSE_CSS = `
.pf-device-pulse { position: relative; }
.pf-device-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid var(--pf-accent);
  border-radius: 50%;
  animation: pfDevicePulse 2.2s ease-out infinite;
}
@keyframes pfDevicePulse {
  0%   { transform: scale(0.6); opacity: 0.9; }
  100% { transform: scale(1.8); opacity: 0; }
}
`;

// Table grid shared by header + rows:
// icon | Device | Source | Identifier | Streams | Consent | Last data | Status | action
const TABLE_GRID = '30px minmax(0, 1.25fr) 90px minmax(0, 1.1fr) minmax(0, 1fr) 96px 70px 92px 58px';

function classifyDevice(device) {
  const text = [
    get(device, 'type.text', ''),
    get(device, 'type.coding[0].display', ''),
    get(device, 'deviceName[0].name', '')
  ].join(' ').toLowerCase();

  if (/implant|pacemaker|defibrillator|stent|cardiac/.test(text)) { return 'implant'; }
  if (/wheelchair|walker|crutch|prosthe|orthotic|dme|mobility|bed/.test(text)) { return 'dme'; }
  if (/watch|wearable|tracker|ring|band|cgm|monitor/.test(text)) { return 'wearable'; }
  return 'wearable';
}

const DEVICE_ICONS = {
  wearable: WatchIcon,
  dme: AccessibleIcon,
  implant: MonitorHeartIcon
};

// Lazy Package lookup for the personal-area-network extension (never module
// scope — sibling workflows register after this module loads). Returns the
// extension's registered module or null.
function resolvePanModule() {
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
  return (registry && registry['@orbital/personal-area-network']) || null;
}

function findTag(device, system) {
  return (get(device, 'meta.tag', []) || []).find(function(tag) {
    return get(tag, 'system') === system;
  });
}

function deviceStreams(device) {
  return (get(device, 'extension', []) || [])
    .filter(function(extension) { return get(extension, 'url') === STREAM_EXTENSION_URL; })
    .map(function(extension) { return get(extension, 'valueString'); })
    .filter(Boolean);
}

function hasWriteConsent(device) {
  return (get(device, 'extension', []) || []).some(function(extension) {
    return get(extension, 'url') === WRITE_CONSENT_EXTENSION_URL;
  });
}

function HeaderCell({ children, sx }) {
  return (
    <Typography component="span" className="pf-kicker" sx={{ fontSize: '9.5px !important', ...sx }}>
      {children}
    </Typography>
  );
}

function StatusTag({ label, accent }) {
  return (
    <Box component="span" sx={{
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: 11,
      letterSpacing: '0.02em',
      px: 1.1,
      py: 0.3,
      borderRadius: '6px',
      whiteSpace: 'nowrap',
      bgcolor: accent ? 'var(--pf-accent-chip)' : 'var(--pf-well)',
      color: accent ? 'var(--pf-accent-text)' : 'var(--pf-ink-mid)'
    }}>
      {label}
    </Box>
  );
}

export default function KnownDevicesCard({ patientId, onDevicesChange }) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuDevice, setMenuDevice] = useState(null);

  const devices = useTracker(function() {
    if (!patientId) { return []; }
    Meteor.subscribe('selectedPatient.Devices', patientId, { limit: 100 });
    const found = Devices.find({
      $or: [
        { 'patient.reference': { $regex: patientId } },
        { 'subject.reference': { $regex: patientId } }
      ]
    }).fetch();
    return found;
  }, [patientId]);

  const justLinked = useTracker(function() {
    return Session.get('deviceJustLinked');
  }, []);

  React.useEffect(function() {
    if (onDevicesChange) { onDevicesChange(devices); }
  }, [devices.length]);

  const panModule = resolvePanModule();
  const PanDevicesProfilePanel = (panModule && panModule.PanDevicesProfilePanel) || null;

  function navigateToAddDevice() {
    // Lazy Package check (never module scope — sibling workflows register
    // after this module loads); /devices/new as the packageless fallback.
    // personal-area-network is the fully upgraded devices experience and
    // wins when installed.
    if (panModule) {
      navigate('/personal-area-network');
      return;
    }
    const registry = (typeof Package !== 'undefined' && Package)
      || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
    if (registry && registry['@node-on-fhir/implantable-devices']) {
      navigate('/add-a-device');
    } else {
      navigate('/devices/new');
    }
  }

  // Empty state: the single dashed add affordance. Once devices exist, the
  // card renders with the "+ Add a device" header button instead — the button
  // and the empty state are two different things. (Imaging/genomics on-ramps
  // live in MedicalImagingCard / GenomicsCard — they aren't devices.)
  if (!devices.length) {
    return (
      <AddRow
        id="addDeviceRow"
        icon={<AddIcon />}
        label="Add a device"
        onClick={function() {
          ensureProfilePatientSelected(patientId);
          navigateToAddDevice();
        }}
      />
    );
  }

  const awaitingCount = devices.filter(function(device) {
    return get(findTag(device, LIFECYCLE_TAG_SYSTEM), 'code') === 'awaiting-data';
  }).length;
  const linkedCount = devices.length - awaitingCount;

  return (
    <Box className="pf-card" id="knownDevicesCard">
      <style>{DEVICE_PULSE_CSS}</style>
      <ProfileCardHeader
        icon={<DevicesIcon />}
        title="Known devices"
        kicker={linkedCount + ' linked · ' + awaitingCount + ' awaiting data'}
        action={
          <Button
            id="addDeviceHeaderButton"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={navigateToAddDevice}
            sx={{ fontSize: 12, textTransform: 'none', color: 'var(--pf-accent)', '&:hover': { bgcolor: 'var(--pf-accent-tint)' } }}
          >
            Add a device
          </Button>
        }
      />

      {justLinked && (
        <Box sx={{
          mx: 1.75, mt: 1,
          display: 'flex', alignItems: 'center', gap: 1,
          p: '8px 12px',
          border: '1px solid var(--pf-accent)',
          borderRadius: '8px',
          bgcolor: 'var(--pf-accent-tint)'
        }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: 'var(--pf-accent)' }} />
          <Typography sx={{ fontSize: 12.5, color: 'var(--pf-ink)', flex: 1 }}>
            {get(justLinked, 'name', 'Device')} linked. Telemetry will appear in the record as it arrives.
          </Typography>
          <Button
            size="small"
            onClick={function() { Session.set('deviceJustLinked', null); }}
            sx={{ fontSize: 11, textTransform: 'none', color: 'var(--pf-accent)', minWidth: 0 }}
          >
            Dismiss
          </Button>
        </Box>
      )}

      <Box sx={{ pt: 0.5, overflowX: 'auto' }}>
        {/* Column headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: TABLE_GRID, alignItems: 'center', gap: 1, p: '6px 14px 2px', minWidth: 720 }}>
          <span />
          <HeaderCell>Device</HeaderCell>
          <HeaderCell>Source</HeaderCell>
          <HeaderCell>Identifier</HeaderCell>
          <HeaderCell>Streams</HeaderCell>
          <HeaderCell>Consent</HeaderCell>
          <HeaderCell>Last data</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <span />
        </Box>

        {devices.map(function(device) {
          const kind = classifyDevice(device);
          const KindIcon = DEVICE_ICONS[kind] || DevicesIcon;
          const name = get(device, 'deviceName[0].name')
            || get(device, 'type.text')
            || get(device, 'type.coding[0].display', 'Device');
          const manufacturer = get(device, 'manufacturer', '');
          const model = get(device, 'modelNumber', '');
          const subline = [manufacturer, model].filter(Boolean).join(' · ')
            || get(device, 'type.text', '');

          const sourceTag = findTag(device, SOURCE_TAG_SYSTEM);
          const sourceCode = get(sourceTag, 'code');
          const sourceDisplay = get(sourceTag, 'display')
            || (kind === 'implant' ? 'Registry' : 'Detected in import');

          const di = get(device, 'udiCarrier[0].deviceIdentifier', '');
          const serial = get(device, 'serialNumber', '');
          const identifier = sourceCode === 'app'
            ? 'n/a — consumer device'
            : [di, serial ? 'SN ' + serial : ''].filter(Boolean).join(' · ') || '—';

          const streams = deviceStreams(device);
          const streamsDisplay = streams.length ? streams.join(', ') : '—';

          const consentDisplay = hasWriteConsent(device) ? 'Continuous write'
            : (sourceCode === 'app' ? 'On import' : '—');

          const lifecycleCode = get(findTag(device, LIFECYCLE_TAG_SYSTEM), 'code');
          const status = lifecycleCode === 'awaiting-data' ? 'awaiting data'
            : (lifecycleCode || get(device, 'status', 'active'));
          const isActive = status === 'active';
          const isLive = isActive && sourceCode === 'udi';
          const awaiting = status === 'awaiting data';

          const lastData = isLive ? 'just now' : '—';

          return (
            <Box
              key={device._id}
              className="pf-row"
              sx={{
                display: 'grid',
                gridTemplateColumns: TABLE_GRID,
                alignItems: 'center',
                gap: 1,
                p: '9px 14px',
                minWidth: 720
              }}
            >
              <Box
                className={isLive ? 'pf-device-pulse' : undefined}
                sx={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: '1px solid var(--pf-line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <KindIcon sx={{ fontSize: 14, color: isLive ? 'var(--pf-accent)' : 'var(--pf-ink-mid)' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 500, color: 'var(--pf-ink)' }}>
                  {name}
                </Typography>
                {subline && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: 'var(--pf-ink-dim)' }}>
                    {subline}
                  </Typography>
                )}
              </Box>
              <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>{sourceDisplay}</Typography>
              <Typography noWrap className="pf-mono" sx={{ fontSize: '11.5px !important', color: 'var(--pf-ink-mid)' }}>
                {identifier}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }} title={streamsDisplay}>
                {streamsDisplay}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>{consentDisplay}</Typography>
              <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>{lastData}</Typography>
              <Box>
                <StatusTag label={status} accent={isActive} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {awaiting ? (
                  <Box component="span"
                    onClick={function() { navigate('/import-data?device=' + device._id); }}
                    sx={{ fontSize: 12, color: 'var(--pf-accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Import
                  </Box>
                ) : (
                  <IconButton
                    size="small"
                    onClick={function(e) { setMenuAnchor(e.currentTarget); setMenuDevice(device); }}
                    sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}
                  >
                    <MoreHorizIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {PanDevicesProfilePanel && (
        <PanDevicesProfilePanel patientId={patientId} />
      )}

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={function() { setMenuAnchor(null); setMenuDevice(null); }}
      >
        <MenuItem onClick={function() {
          if (menuDevice) { navigate('/devices/' + menuDevice._id); }
          setMenuAnchor(null);
        }}>
          View resource
        </MenuItem>
        {panModule && (
          <MenuItem onClick={function() {
            navigate('/personal-area-network');
            setMenuAnchor(null);
          }}>
            Manage in Personal Area Network
          </MenuItem>
        )}
        <MenuItem onClick={function() {
          navigate('/implantable-devices');
          setMenuAnchor(null);
        }}>
          Manage in Implantables
        </MenuItem>
      </Menu>
    </Box>
  );
}

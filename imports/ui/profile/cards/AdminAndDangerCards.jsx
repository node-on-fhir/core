// imports/ui/profile/cards/AdminAndDangerCards.jsx
//
// Small end-of-page pieces: Administration stats (role admin), signed-in
// sessions (stubbed to the current session — no per-device tracking exists
// server-side yet), the Danger area (not a card — outlined box, no red fill
// per the Nocturne mono palette), and dev-only Debug tools.

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarningIcon from '@mui/icons-material/Warning';
import BugReportIcon from '@mui/icons-material/BugReport';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DevicesIcon from '@mui/icons-material/Devices';

import { get } from 'lodash';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

import { ProfileCardHeader, AccentChip } from '../ProfilePrimitives.jsx';

// ── Administration (role: admin) ─────────────────────────────────────────
export function AdministrationCard() {
  const navigate = useNavigate();
  const userCount = Meteor.users ? Meteor.users.find({}).count() : 0;

  return (
    <Box className="pf-card" id="administrationCard">
      <ProfileCardHeader icon={<AdminPanelSettingsIcon />} title="Administration" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', p: '10px 14px' }}>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: 'var(--pf-ink)' }}>{userCount || '—'}</Typography>
          <Typography className="pf-kicker">Users</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: 'var(--pf-ink)' }}>—</Typography>
          <Typography className="pf-kicker">Pending links</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: 'var(--pf-ink)' }}>—</Typography>
          <Typography className="pf-kicker">Apps</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, p: '0 14px 12px' }}>
        <Button size="small" variant="outlined" onClick={function() { navigate('/users'); }} sx={{ fontSize: 11, borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}>
          Users
        </Button>
        <Button size="small" variant="outlined" onClick={function() { navigate('/audit-log'); }} sx={{ fontSize: 11, borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}>
          Audit log
        </Button>
      </Box>
    </Box>
  );
}

// ── Signed-in sessions (stub: current session only) ──────────────────────
export function describeCurrentDevice() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /iPhone|iPad|Android/i.test(ua);
  let browser = 'Browser';
  if (/Edg\//.test(ua)) { browser = 'Edge'; }
  else if (/Chrome\//.test(ua)) { browser = 'Chrome'; }
  else if (/Safari\//.test(ua)) { browser = 'Safari'; }
  else if (/Firefox\//.test(ua)) { browser = 'Firefox'; }
  let device = 'Computer';
  if (/Macintosh/.test(ua)) { device = 'Mac'; }
  else if (/Windows/.test(ua)) { device = 'PC'; }
  else if (/iPhone/.test(ua)) { device = 'iPhone'; }
  else if (/iPad/.test(ua)) { device = 'iPad'; }
  else if (/Android/.test(ua)) { device = 'Android'; }
  return { device, browser, isMobile };
}

export function SessionsCard({ user }) {
  const { device, browser, isMobile } = describeCurrentDevice();
  const lastLogin = get(user, 'lastLoginAt');
  const DeviceIcon = isMobile ? PhoneIphoneIcon : ComputerIcon;

  return (
    <Box className="pf-card" id="sessionsCard">
      <ProfileCardHeader icon={<DevicesIcon />} title="Signed-in sessions" />
      <Box className="pf-row" sx={{ display: 'grid', gridTemplateColumns: '22px minmax(0, 1fr) 60px', alignItems: 'center', gap: 1, p: '9px 14px', mb: 1 }}>
        <DeviceIcon sx={{ fontSize: 16, color: 'var(--pf-ink-mid)' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{device} · {browser}</Typography>
          <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
            this device{lastLogin ? ` · signed in ${moment(lastLogin).fromNow()}` : ''}
          </Typography>
        </Box>
        <AccentChip label="now" />
      </Box>
    </Box>
  );
}

// ── Danger area (outlined box, mono palette — no red fill) ───────────────
export function DangerArea({ onDelete, compact = false }) {
  return (
    <Box
      id="dangerArea"
      sx={{
        border: '1px solid var(--pf-track)',
        borderRadius: '8px',
        p: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <WarningIcon sx={{ fontSize: 18, color: 'var(--pf-ink-dim)', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>Delete account</Typography>
        {!compact && (
          <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
            Removes your account and every linked record. Cannot be undone.
          </Typography>
        )}
      </Box>
      <Button
        id="deleteUserButton"
        size="small"
        variant="outlined"
        onClick={onDelete}
        sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)', flexShrink: 0 }}
      >
        Delete…
      </Button>
    </Box>
  );
}

// ── Debug tools (dev only) ───────────────────────────────────────────────
export function DebugTools({ onLinkToCMO }) {
  if (!Meteor.isDevelopment) { return null; }
  return (
    <Box
      id="debugTools"
      sx={{
        border: '1px dashed var(--pf-track)',
        borderRadius: '8px',
        p: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <BugReportIcon sx={{ fontSize: 16, color: 'var(--pf-ink-dim)' }} />
      <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', flex: 1 }}>
        Debug tools · dev only
      </Typography>
      <Button size="small" onClick={onLinkToCMO} sx={{ fontSize: 12, color: 'var(--pf-accent)' }}>
        Link to Chief Medical Officer
      </Button>
    </Box>
  );
}

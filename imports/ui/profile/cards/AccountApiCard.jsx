// imports/ui/profile/cards/AccountApiCard.jsx
//
// Account & API access: primary email + verification chip, masked session
// token with reveal/copy/regenerate, curl usage example. `collapsed` renders
// the 1g one-row form.

import React, { useState } from 'react';
import { Box, Typography, IconButton, Button, Collapse } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

import { get } from 'lodash';

import { copyWithToast } from '../ProfileBarcode.jsx';
import { ProfileCardHeader, Kicker, NeutralChip, ConfirmDialog } from '../ProfilePrimitives.jsx';

export function maskToken(token) {
  const str = String(token || '');
  if (str.length <= 13) { return str; }
  return `${str.slice(0, 8)}••••${str.slice(-5)}`;
}

export default function AccountApiCard({ user, token, patientId, collapsed = false, onRegenerateToken, onVerifyEmail, emailConfigured = false }) {
  const [revealed, setRevealed] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);

  const email = get(user, 'emails[0].address', '');
  const verified = Boolean(get(user, 'emails[0].verified'));

  // 1g collapsed one-row form
  if (collapsed) {
    return (
      <Box className="pf-card" id="accountApiCard" sx={{ p: '10px 14px', display: 'flex', alignItems: 'center', gap: 1 }}>
        <KeyIcon sx={{ fontSize: 15, color: 'var(--pf-accent)' }} />
        <Typography variant="h5" sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
          Account & API
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
          <span>{email}</span>
          {!verified && <NeutralChip icon={<WarningIcon />} label="unverified" />}
          <Box component="span" className="pf-mono">{maskToken(token)}</Box>
        </Typography>
        <IconButton size="small" onClick={function() { copyWithToast(token, 'API token'); }} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)' }}>
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
        {!verified && onVerifyEmail && (
          <Button size="small" onClick={onVerifyEmail} disabled={!emailConfigured} sx={{ fontSize: 12, color: 'var(--pf-accent)' }}>
            Verify email
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box className="pf-card" id="accountApiCard">
      <ProfileCardHeader
        icon={<KeyIcon />}
        title="Account & API access"
        kicker="signed in via password"
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px', p: '10px 14px 0' }}>
        <Box sx={{ minWidth: 0 }}>
          <Kicker sx={{ display: 'block', mb: 0.5 }}>Primary email</Kicker>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', overflowWrap: 'anywhere' }}>{email}</Typography>
            {!verified && <NeutralChip icon={<WarningIcon />} label="unverified" />}
            {!verified && onVerifyEmail && (
              <Button size="small" onClick={onVerifyEmail} disabled={!emailConfigured} sx={{ fontSize: 11, color: 'var(--pf-accent)', minWidth: 0, p: '1px 4px' }}>
                Verify
              </Button>
            )}
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Kicker sx={{ display: 'block', mb: 0.5 }}>Session token · API key</Kicker>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" className="pf-mono" id="apiTokenValue" sx={{ color: 'var(--pf-ink)', overflowWrap: 'anywhere' }}>
              {revealed ? token : maskToken(token)}
            </Box>
            <IconButton size="small" onClick={function() { setRevealed(!revealed); }} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
              {revealed ? <VisibilityOffIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
            </IconButton>
            <IconButton size="small" onClick={function() { copyWithToast(token, 'API token'); }} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </IconButton>
            {onRegenerateToken && (
              <IconButton size="small" onClick={function() { setRegenConfirmOpen(true); }} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
                <RefreshIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ p: '10px 14px 12px', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
          Send it in the <Box component="span" className="pf-mono">session</Box> header.
        </Typography>
        <Box
          component="span"
          onClick={function() { setShowExample(!showExample); }}
          sx={{ fontSize: 12, color: 'var(--pf-accent)', cursor: 'pointer' }}
        >
          API usage example {showExample ? '▴' : '▾'}
        </Box>
      </Box>
      <Collapse in={showExample} timeout="auto" unmountOnExit>
        <Box sx={{ px: 1.75, pb: 1.75 }}>
          <Box className="pf-mono" component="pre" sx={{
            m: 0, p: 1.5,
            bgcolor: 'var(--pf-well)',
            borderRadius: '6px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'var(--pf-ink-mid)'
          }}>
{`# Get a specific Patient record:
curl -H "session:${token}" \\
  http://localhost:3000/baseR4/Patient/${patientId || 'patient-id'}

# Search for Patients:
curl -H "session:${token}" \\
  http://localhost:3000/baseR4/Patient?name=smith

# Get Observations for a Patient:
curl -H "session:${token}" \\
  http://localhost:3000/baseR4/Observation?patient=${patientId || 'patient-id'}`}
          </Box>
        </Box>
      </Collapse>

      <ConfirmDialog
        open={regenConfirmOpen}
        title="Regenerate API token"
        message="Generate a new API token? Your current session stays signed in; update any scripts using the old token."
        confirmLabel="Regenerate"
        onConfirm={function() { if (onRegenerateToken) { onRegenerateToken(); } }}
        onClose={function() { setRegenConfirmOpen(false); }}
      />
    </Box>
  );
}

// imports/ui/profile/ProfilePrimitives.jsx
//
// Shared building blocks for the My Profile redesign. Everything here is
// theme-agnostic: colors come from var(--pf-*) provided by the .profile-page
// scope (see profileVars.js).

import React, { useState } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Collapse
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { copyWithToast } from './ProfileBarcode.jsx';

// ── Kicker: 10px uppercase tracked label ─────────────────────────────────
export function Kicker({ icon, children, sx = {} }) {
  return (
    <Box component="span" className="pf-kicker" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ...sx }}>
      {icon ? React.cloneElement(icon, { sx: { fontSize: 12 } }) : null}
      {children}
    </Box>
  );
}

// ── FadingRule: 1px gradient rule with transparent 48px ends ─────────────
export function FadingRule({ sx = {} }) {
  return <Box className="pf-fading-rule" sx={sx} />;
}

// ── ProfileCardHeader: the shared card-header pattern ────────────────────
// padding 12px 14px 0 · 15px accent icon · 14px/500 title · right kicker/chips
export function ProfileCardHeader({ icon, title, kicker, chips, action, id }) {
  return (
    <Box id={id} sx={{ p: '12px 14px 0', display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon ? React.cloneElement(icon, { sx: { fontSize: 15, color: 'var(--pf-accent)' } }) : null}
      <Typography variant="h5" sx={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--pf-ink)', flex: chips || kicker ? 'none' : 1 }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      {chips}
      {action}
    </Box>
  );
}

// ── Chips in the two Nocturne treatments ─────────────────────────────────
export function AccentChip({ label, icon, size = 'small', sx = {}, ...rest }) {
  return (
    <Chip
      label={label}
      icon={icon}
      size={size}
      sx={{
        bgcolor: 'var(--pf-accent-chip)',
        color: 'var(--pf-accent-text)',
        fontSize: 11,
        height: 20,
        borderRadius: '6px',
        '& .MuiChip-icon': { color: 'var(--pf-accent-text)', fontSize: 13 },
        ...sx
      }}
      {...rest}
    />
  );
}

export function NeutralChip({ label, icon, size = 'small', sx = {}, ...rest }) {
  return (
    <Chip
      label={label}
      icon={icon}
      size={size}
      sx={{
        bgcolor: 'var(--pf-track)',
        color: 'var(--pf-ink-mid)',
        fontSize: 11,
        height: 20,
        borderRadius: '6px',
        '& .MuiChip-icon': { color: 'var(--pf-ink-mid)', fontSize: 13 },
        ...sx
      }}
      {...rest}
    />
  );
}

// ── MonoCopyValue: truncated mono id + copy icon ─────────────────────────
// Renders `xxxxxxxx…xxxx`; full value in tooltip; click copies + snackbar.
export function truncateId(value, head = 8, tail = 4) {
  const str = String(value || '');
  if (str.length <= head + tail + 1) { return str; }
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

export function MonoCopyValue({ value, prefix, head = 8, tail = 4, sx = {} }) {
  if (!value) { return null; }
  return (
    <Tooltip title={String(value)} placement="top" arrow>
      <Box
        component="span"
        className="pf-mono"
        onClick={function() { copyWithToast(value); }}
        sx={{ color: 'var(--pf-ink-dim)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.5, ...sx }}
      >
        {prefix ? `${prefix} ` : ''}{truncateId(value, head, tail)}
        <ContentCopyIcon sx={{ fontSize: 11 }} />
      </Box>
    </Tooltip>
  );
}

// ── AddRow: dashed one-line "add" affordance, expands in place ───────────
export function AddRow({ icon, label, rightText, disabled = false, children, id, onClick, sx = {} }) {
  const [expanded, setExpanded] = useState(false);
  const expandable = Boolean(children);

  function handleClick() {
    if (disabled) { return; }
    if (onClick) { onClick(); return; }
    if (expandable) { setExpanded(!expanded); }
  }

  return (
    <Box id={id} sx={sx}>
      <Box
        className={`pf-add-row${disabled ? ' pf-add-row--disabled' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
        sx={{ p: '10px 14px', display: 'flex', alignItems: 'center', gap: 1, fontSize: 13 }}
      >
        {icon ? React.cloneElement(icon, { sx: { fontSize: 16, color: disabled ? 'var(--pf-ink-faint)' : 'var(--pf-ink-dim)' } }) : null}
        <Box component="span" sx={{ flex: 1 }}>{label}</Box>
        {rightText ? (
          <Box component="span" sx={{ fontSize: 12, color: disabled ? 'var(--pf-ink-faint)' : 'var(--pf-accent)' }}>
            {rightText}
          </Box>
        ) : null}
      </Box>
      {expandable ? (
        <Collapse in={expanded} timeout={160}>
          <Box sx={{ pt: 1 }}>{children}</Box>
        </Collapse>
      ) : null}
    </Box>
  );
}

// ── ConfirmDialog: shared confirm pattern (UNLINK / Revoke / Regenerate) ─
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', destructive = false, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 16 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="outlined"
          color={destructive ? 'error' : 'primary'}
          onClick={function() { onConfirm(); onClose(); }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// imports/ui/profile/ProfileRails.jsx
//
// The sticky side rails: profile-strength ring + next steps + jump-nav
// (left), layout toggle + quick actions + sessions line (right). The jump-nav
// highlights the section ≥40% visible (IntersectionObserver) and scrolls the
// page container with scrollTo (not scrollIntoView, per the handoff).

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningIcon from '@mui/icons-material/Warning';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import GridViewIcon from '@mui/icons-material/GridView';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyIcon from '@mui/icons-material/Key';
import PrintIcon from '@mui/icons-material/Print';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DownloadIcon from '@mui/icons-material/Download';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

import { copyWithToast } from './ProfileBarcode.jsx';
import { Kicker, FadingRule } from './ProfilePrimitives.jsx';
import { ensureProfilePatientSelected } from './selectProfilePatient.js';

// Lazy Package check (never module scope — sibling workflows register into
// Package after this module loads).
function packageInstalled(name) {
  const registry = (typeof Package !== 'undefined' && Package)
    || (typeof globalThis !== 'undefined' ? globalThis.Package : null);
  return Boolean(registry && registry[name]);
}

export const PROFILE_LAYOUT_KEY = 'profileLayout';

// ── Strength ring ────────────────────────────────────────────────────────
export function StrengthRing({ score, size = 72, fontSize = 15 }) {
  return (
    <Box
      className="pf-ring"
      sx={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        '--pf-ring-pct': `${Math.max(0, Math.min(100, score))}%`,
        background: 'conic-gradient(var(--pf-accent) var(--pf-ring-pct), var(--pf-track) 0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <Box sx={{
        width: size - 10, height: size - 10, borderRadius: '50%',
        bgcolor: 'var(--pf-canvas)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fontSize, fontWeight: 500, color: 'var(--pf-ink)'
      }}>
        {Math.round(score)}%
      </Box>
    </Box>
  );
}

// ── Jump-nav ─────────────────────────────────────────────────────────────
export function JumpNav({ sections }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(function() {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) { setActiveId(entry.target.id); }
      });
    }, { threshold: 0.4 });

    sections.forEach(function(section) {
      const el = document.getElementById(section.id);
      if (el) { observer.observe(el); }
    });
    return function() { observer.disconnect(); };
  }, [sections.map(function(s) { return s.id; }).join(',')]);

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) { return; }
    const container = el.closest('.profile-page');
    if (container) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 20;
      container.scrollTo({ top: top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
    }
  }

  return (
    <Box>
      <Kicker sx={{ display: 'block', mb: 0.5 }}>On this page</Kicker>
      {sections.map(function(section) {
        const isActive = activeId === section.id;
        return (
          <Box
            key={section.id}
            onClick={function() { scrollToSection(section.id); }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              py: '4px', cursor: 'pointer',
              fontSize: 12.5,
              mt: section.danger ? '6px' : 0,
              color: section.danger
                ? 'var(--pf-ink-dim)'
                : isActive ? 'var(--pf-accent)' : 'var(--pf-ink-mid)',
              '&:hover': { color: 'var(--pf-accent)' }
            }}
          >
            {section.danger ? (
              <WarningIcon sx={{ fontSize: 12, flexShrink: 0 }} />
            ) : (
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                bgcolor: section.hasData ? 'var(--pf-accent)' : 'transparent',
                border: section.hasData ? 'none' : '1px solid var(--pf-ink-faint)'
              }} />
            )}
            <Box component="span" sx={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {section.label}
            </Box>
            {typeof section.count === 'number' && section.count > 0 && (
              <Box component="span" className="pf-mono" sx={{ color: 'var(--pf-ink-faint)' }}>
                {section.count}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ── Left rail ────────────────────────────────────────────────────────────
export function LeftRail({ completion, sections }) {
  const undone = completion.steps.filter(function(s) { return !s.done; }).length;
  return (
    <Box className="pf-rail pf-rail--left" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <StrengthRing score={completion.score} />
        <Box sx={{ minWidth: 0 }}>
          <Kicker sx={{ display: 'block' }}>Profile strength</Kicker>
          <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-mid)' }}>
            {undone === 0 ? 'Complete' : `${undone} step${undone === 1 ? '' : 's'} to complete`}
          </Typography>
        </Box>
      </Box>

      {completion.nextSteps.length > 0 && (
        <Box>
          {completion.nextSteps.map(function(step) {
            return (
              <Box key={step.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: '3px', fontSize: 12.5, color: 'var(--pf-ink-mid)' }}>
                <ArrowForwardIcon sx={{ fontSize: 14, color: 'var(--pf-accent)' }} />
                {step.label}
              </Box>
            );
          })}
        </Box>
      )}

      <FadingRule />

      <JumpNav sections={sections} />
    </Box>
  );
}

// ── Layout toggle ────────────────────────────────────────────────────────
export function LayoutToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup
      className="pf-layout-toggle"
      exclusive
      value={value}
      onChange={function(e, next) { if (next) { onChange(next); } }}
      sx={{
        '& .MuiToggleButton-root': {
          fontSize: 13,
          p: '7px 12px',
          textTransform: 'none',
          color: 'var(--pf-ink-mid)',
          border: '1px solid var(--pf-line)',
          borderRadius: '8px',
          gap: 0.75,
          '&:hover': { bgcolor: 'color-mix(in srgb, var(--pf-ink) 7%, transparent)' },
          '&.Mui-selected': {
            color: 'var(--pf-accent)',
            bgcolor: 'transparent',
            boxShadow: 'inset 0 0 0 1px var(--pf-accent)',
            '&:hover': { bgcolor: 'var(--pf-accent-tint)' }
          }
        }
      }}
    >
      <ToggleButton value="scroll" id="layoutToggleScroll">
        <ViewAgendaIcon sx={{ fontSize: 15 }} /> Scroll
      </ToggleButton>
      <ToggleButton value="grid" id="layoutToggleGrid">
        <GridViewIcon sx={{ fontSize: 15 }} /> Grid
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

// ── Quick actions ────────────────────────────────────────────────────────
export function QuickActions({ patientId, token, onPrintIdCard, onShowQr, onExport }) {
  const navigate = useNavigate();
  const actions = [
    patientId && { icon: <DescriptionIcon />, label: 'View chart', onClick: function() { navigate('/patient-chart'); } },
    packageInstalled('@orbital/chronicle') && { icon: <CloudSyncIcon />, label: 'Complete my record', onClick: function() { navigate('/chronicle-etl'); } },
    patientId && { icon: <ContentCopyIcon />, label: 'Copy patient ID', onClick: function() { copyWithToast(patientId, 'Patient ID'); } },
    token && { icon: <KeyIcon />, label: 'Copy API key', onClick: function() { copyWithToast(token, 'API key'); } },
    patientId && onPrintIdCard && { icon: <PrintIcon />, label: 'Print ID card', onClick: onPrintIdCard },
    patientId && onShowQr && { icon: <QrCode2Icon />, label: 'Show QR for intake', onClick: onShowQr },
    patientId && onExport && { icon: <DownloadIcon />, label: 'Export my record', onClick: onExport }
  ].filter(Boolean);

  if (!actions.length) { return null; }

  // Every quick action operates on the profile owner's record — make it the
  // app-wide selected patient before the action runs (no-op if already so).
  function handleActionClick(action) {
    ensureProfilePatientSelected(patientId);
    action.onClick();
  }

  return (
    <Box>
      <Kicker sx={{ display: 'block', mb: 0.5 }}>Quick actions</Kicker>
      {actions.map(function(action) {
        return (
          <Box
            key={action.label}
            onClick={function() { handleActionClick(action); }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              py: '5px', cursor: 'pointer',
              fontSize: 12.5, color: 'var(--pf-ink-mid)',
              '&:hover': { color: 'var(--pf-accent)' }
            }}
          >
            {React.cloneElement(action.icon, { sx: { fontSize: 14, color: 'var(--pf-accent)' } })}
            {action.label}
          </Box>
        );
      })}
    </Box>
  );
}

// ── Right rail ───────────────────────────────────────────────────────────
// (The Scroll/Grid toggle lives on the page-title row, not in the rail.)
export function RightRail({ patientId, token, onPrintIdCard, onShowQr, onExport }) {
  return (
    <Box className="pf-rail pf-rail--right" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <QuickActions
        patientId={patientId}
        token={token}
        onPrintIdCard={onPrintIdCard}
        onShowQr={onShowQr}
        onExport={onExport}
      />
      <FadingRule />
      <Box>
        <Kicker sx={{ display: 'block', mb: 0.5 }}>Sessions</Kicker>
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
          1 device signed in · this device
        </Typography>
      </Box>
    </Box>
  );
}

// ── 1g checklist rail ────────────────────────────────────────────────────
export function ChecklistRail({ completion }) {
  const firstUndoneId = (completion.steps.find(function(s) { return !s.done; }) || {}).id;
  return (
    <Box className="pf-rail pf-rail--right" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <StrengthRing score={completion.score} size={56} fontSize={12} />
        <Box>
          <Kicker sx={{ display: 'block' }}>Profile strength</Kicker>
          <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-mid)' }}>Start with a record</Typography>
        </Box>
      </Box>
      <Box>
        {completion.steps.map(function(step) {
          const isCurrent = step.id === firstUndoneId;
          return (
            <Box key={step.id} sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
              py: '3px', fontSize: 12.5,
              color: step.done ? 'var(--pf-ink-faint)' : isCurrent ? 'var(--pf-ink)' : 'var(--pf-ink-mid)',
              textDecoration: step.done ? 'line-through' : 'none'
            }}>
              {step.done
                ? <CheckCircleIcon sx={{ fontSize: 14, color: 'var(--pf-accent)' }} />
                : isCurrent
                  ? <ArrowForwardIcon sx={{ fontSize: 14, color: 'var(--pf-accent)' }} />
                  : <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'var(--pf-ink-mid)' }} />}
              {step.label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

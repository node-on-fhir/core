// npmPackages/implantable-devices/client/add-a-device/LeftRail.jsx
//
// Persistent left rail of /add-a-device: the three mutually-exclusive source
// cards, the live "Will be saved as" summary card, and the auto-detection
// footnote. (The page headline lives in AddADevicePage's header block so both
// grid columns start flush at the cards line.)

import React from 'react';
import { Box, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

import { Tag, statusTagVariant } from './FlowPrimitives.jsx';

const SOURCE_CARDS = [
  {
    id: 'app',
    icon: <PhoneIphoneIcon />,
    title: 'App or data export',
    sub: 'Apple Health, Fitbit, Dexcom, Withings…'
  },
  {
    id: 'device',
    icon: <Inventory2OutlinedIcon />,
    title: 'Device in hand',
    sub: 'Scan the UDI barcode label, or type it in'
  },
  {
    id: 'paper',
    icon: <DescriptionOutlinedIcon />,
    title: 'Brochure or name only',
    sub: 'Search the registry, or enter it manually'
  }
];

export function WillBeSavedAsCard({ summary, patientDisplay }) {
  return (
    <Box className="adv-card" id="advSummaryCard" sx={{ mt: 1 }}>
      <Typography className="pf-kicker" sx={{ color: 'var(--pf-accent) !important', mb: 1 }}>
        Will be saved as
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Box className={'adv-icon-circle' + (summary.live ? ' adv-pulse' : '')} sx={{ width: 36, height: 36 }}>
          <MonitorHeartIcon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
            {summary.name || '—'}
          </Typography>
          {summary.sub && (
            <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
              {summary.sub}
            </Typography>
          )}
        </Box>
      </Box>
      <Box className="adv-kv">
        <span className="adv-kv-label">Patient</span>
        <span className="adv-kv-value">{patientDisplay || '—'}</span>
        <span className="adv-kv-label">UDI</span>
        <span className="adv-kv-value pf-mono">{summary.udiShort || '—'}</span>
        <span className="adv-kv-label">Status</span>
        <span className="adv-kv-value">
          <Tag label={summary.status} variant={statusTagVariant(summary.status)} />
        </span>
      </Box>
    </Box>
  );
}

function LeftRail({ src, onSelectSrc, summary, patientDisplay }) {
  return (
    <Box className="adv-rail">
      {SOURCE_CARDS.map(function(card) {
        const selected = src === card.id;
        return (
          <Box
            component="button"
            type="button"
            key={card.id}
            id={'advSource-' + card.id}
            className={'adv-source-card' + (selected ? ' adv-source-card--selected' : '')}
            onClick={function() { onSelectSrc(card.id); }}
          >
            <Box className="adv-icon-circle">{card.icon}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>{card.title}</Typography>
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>{card.sub}</Typography>
            </Box>
            <ChevronRightIcon sx={{ color: selected ? 'var(--pf-accent)' : 'var(--pf-ink-faint)', fontSize: 20 }} />
          </Box>
        );
      })}

      <WillBeSavedAsCard summary={summary} patientDisplay={patientDisplay} />

      <Typography className="adv-footnote" sx={{ mt: 1 }}>
        Devices are also detected automatically when you import records — anything
        found during an import shows up in Known devices on its own.
      </Typography>
    </Box>
  );
}

export default LeftRail;

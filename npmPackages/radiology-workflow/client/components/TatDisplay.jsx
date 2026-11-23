// npmPackages/radiology-workflow/client/components/TatDisplay.jsx

import React, { useState, useEffect } from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import moment from 'moment';

// =============================================================================
// TAT DISPLAY - Real-time turnaround time chip with color coding
// =============================================================================
//
// Displays elapsed time from a start timestamp, updating every second.
// Color thresholds: green <1h, yellow 1-4h, red >4h
// Day-scale elapsed times (historical records) read as "63d 13h" rather
// than a wall of hours.
// `disabled` renders a neutral chip — no urgency colors (historical review,
// screenshots, terminal-status orders).
// =============================================================================

function formatElapsed(ms) {
  if (!ms || ms < 0) return '--:--';
  const duration = moment.duration(ms);
  const days = Math.floor(duration.asDays());

  if (days >= 1) {
    return `${days}d ${duration.hours()}h`;
  }
  if (duration.hours() >= 1) {
    return `${duration.hours()}h ${String(duration.minutes()).padStart(2, '0')}m`;
  }
  return `${duration.minutes()}m ${String(duration.seconds()).padStart(2, '0')}s`;
}

function getThresholdColor(ms, theme) {
  if (!ms || ms < 0) return 'default';
  const hours = ms / 3600000;
  if (hours < 1) return 'success';
  if (hours < 4) return 'warning';
  return 'error';
}

function TatDisplay({ startTime, size = 'small', disabled = false }) {
  const theme = useTheme();
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    if (!startTime) return;

    const startMs = new Date(startTime).getTime();
    if (isNaN(startMs)) return;

    function tick() {
      setElapsed(Date.now() - startMs);
    }

    tick();
    const interval = setInterval(tick, 1000);

    return function() {
      clearInterval(interval);
    };
  }, [startTime]);

  if (!startTime || elapsed === null) {
    return (
      <Chip
        icon={<AccessTimeIcon />}
        label="--:--"
        size={size}
        variant="outlined"
        color="default"
      />
    );
  }

  const color = disabled ? 'default' : getThresholdColor(elapsed, theme);

  return (
    <Chip
      icon={<AccessTimeIcon />}
      label={formatElapsed(elapsed)}
      size={size}
      color={color}
      variant={(!disabled && color === 'error') ? 'filled' : 'outlined'}
      sx={{
        fontFamily: 'monospace',
        fontWeight: 600,
        minWidth: 90,
        ...(disabled && { opacity: 0.6 })
      }}
    />
  );
}

export default TatDisplay;

// imports/ui/components/LinkedPatientBadge.jsx
//
// Small, reusable "this Patient is one of N linked records" signal (design v2
// §C). Composition: an MUI <Badge> whose badgeContent is the set size, wrapping
// a <PersonIcon/> with a <LinkIcon/> overlay to read as "linked identity".
// Follows the established <Badge>-wrapping-icon precedent in
// AppLayoutWithAuth.jsx (Notifications badge).
//
// Renders NOTHING when setSize <= 1 — a lone Patient is not a "set", so there
// is no signal to show. This lets callers mount it unconditionally.
//
// Props:
//   setSize   number  — member count of the resolved linked set
//   onClick   func?   — optional; when present the badge becomes a button
//                       (e.g. open the PatientLinkPanel / navigate to profile)

import React from 'react';

import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';

export function LinkedPatientBadge({ setSize, onClick }) {
  const size = Number.isFinite(setSize) ? setSize : 0;

  // A lone record (or none) is not a linked set — show nothing.
  if (size <= 1) {
    return null;
  }

  const tooltipText = 'This record is one of ' + size + ' linked records';

  const badge = (
    <Badge
      badgeContent={size}
      color="primary"
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {/* Person with a small chain overlay to read as "linked identity". */}
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <PersonIcon />
        <LinkIcon
          fontSize="small"
          sx={{
            position: 'absolute',
            bottom: -2,
            left: -6,
            fontSize: '0.85rem',
            color: 'text.secondary'
          }}
        />
      </Box>
    </Badge>
  );

  if (typeof onClick === 'function') {
    return (
      <Tooltip title={tooltipText}>
        <IconButton
          id="linkedPatientBadgeButton"
          color="inherit"
          onClick={onClick}
          aria-label={tooltipText}
          size="small"
        >
          {badge}
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText}>
      <Box
        component="span"
        aria-label={tooltipText}
        sx={{ display: 'inline-flex', alignItems: 'center', color: 'inherit' }}
      >
        {badge}
      </Box>
    </Tooltip>
  );
}

export default LinkedPatientBadge;

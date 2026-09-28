// npmPackages/implantable-devices/client/add-a-device/UdiParseStrip.jsx
//
// Four-cell GS1 application-identifier strip: DI (01) / expiry (17) /
// lot (10) / serial (21), filled live as the UDI is typed or scanned.

import React from 'react';
import { Box } from '@mui/material';

import { formatExpiry } from '../../lib/udi.js';

const CELLS = [
  { key: 'di', label: '(01) Device identifier' },
  { key: 'expirationDate', label: '(17) Expiry', format: formatExpiry },
  { key: 'lotNumber', label: '(10) Lot' },
  { key: 'serialNumber', label: '(21) Serial', accent: true }
];

function UdiParseStrip({ parsed }) {
  return (
    <Box className="adv-parse-strip" id="advParseStrip">
      {CELLS.map(function(cell) {
        const raw = (parsed && parsed[cell.key]) || '';
        const value = raw && cell.format ? (cell.format(raw) || raw) : raw;
        return (
          <Box className="adv-parse-cell" key={cell.key}>
            <Box className="adv-parse-label">{cell.label}</Box>
            <Box className={'adv-parse-value' + (cell.accent && value ? ' adv-parse-value--accent' : '')}>
              {value || '—'}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export default UdiParseStrip;

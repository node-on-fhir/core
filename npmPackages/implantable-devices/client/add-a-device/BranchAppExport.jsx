// npmPackages/implantable-devices/client/add-a-device/BranchAppExport.jsx
//
// Branch B: register a consumer device via its app/service. Service tile grid
// → device name + in-use-since + streams → two exit cards ("I have the export
// file" → link & go to Data Import; "Not yet" → register as awaiting data).

import React from 'react';
import { Box, TextField, Typography, Button, CircularProgress } from '@mui/material';
import WatchIcon from '@mui/icons-material/Watch';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { SERVICES } from '../../lib/services.js';
import { StreamChecklist, ConsentRow } from './FlowPrimitives.jsx';
import { FIELD_SX, BTN_PRIMARY_SX, BTN_SECONDARY_SX } from './addDeviceStyles.js';

function BranchAppExport(props) {
  const {
    app, onApp, service,
    deviceName, onDeviceName,
    optional, onOptional,
    availableStreams, selectedStreams, onToggleStream,
    consent, onConsent,
    onLinkAndImport, onLinkOnly, busy
  } = props;

  return (
    <Box className="adv-pane" id="advBranchApp">
      <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-mid)' }}>
        Which app or service holds this device&apos;s data?
      </Typography>

      <Box className="adv-tiles">
        {SERVICES.map(function(entry) {
          const selected = app === entry.id;
          return (
            <Box
              component="button"
              type="button"
              key={entry.id}
              id={'advService-' + entry.id}
              className={'adv-tile' + (selected ? ' adv-tile--selected' : '')}
              onClick={function() { onApp(entry.id); }}
            >
              <Box className="adv-tile-logo"><WatchIcon sx={{ fontSize: 18 }} /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 500, color: 'var(--pf-ink)' }}>
                  {entry.name}
                </Typography>
                <Typography noWrap sx={{ fontSize: 11.5, color: 'var(--pf-ink-dim)' }}>
                  {entry.sub}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {service && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              label="Device" size="small" sx={FIELD_SX}
              value={deviceName}
              onChange={function(event) { onDeviceName(event.target.value); }}
              placeholder={service.id === 'other' ? 'e.g. Oura Ring' : undefined}
            />
            <TextField
              label="In use since" type="date" size="small" sx={FIELD_SX}
              InputLabelProps={{ shrink: true }}
              value={optional.inUseSince}
              onChange={function(event) { onOptional({ inUseSince: event.target.value }); }}
            />
          </Box>

          <StreamChecklist available={availableStreams} selected={selectedStreams} onToggle={onToggleStream} />

          <ConsentRow
            checked={consent}
            onChange={onConsent}
            label="Allow future imports from this device to update my record"
          />

          <Box className="adv-exit-cards">
            <Box className="adv-exit-card adv-exit-card--primary">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileUploadIcon sx={{ fontSize: 18, color: 'var(--pf-accent)' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
                  I have the export file
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>
                {service.exportHint}
              </Typography>
              <Button
                id="advLinkAndImportButton"
                variant="outlined"
                disabled={busy || !deviceName}
                onClick={onLinkAndImport}
                startIcon={busy ? <CircularProgress size={14} sx={{ color: 'var(--pf-ink-dim)' }} /> : null}
                sx={{ ...BTN_PRIMARY_SX, alignSelf: 'flex-start' }}
              >
                Link &amp; go to Data Import
              </Button>
            </Box>
            <Box className="adv-exit-card">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon sx={{ fontSize: 18, color: 'var(--pf-ink-dim)' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
                  Not yet — just register it
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-mid)' }}>
                The device shows in Known devices tagged &ldquo;awaiting data&rdquo; until
                its first import arrives.
              </Typography>
              <Button
                id="advLinkOnlyButton"
                variant="outlined"
                disabled={busy || !deviceName}
                onClick={onLinkOnly}
                sx={{ ...BTN_SECONDARY_SX, alignSelf: 'flex-start' }}
              >
                Link device only
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

export default BranchAppExport;

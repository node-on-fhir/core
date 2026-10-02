// npmPackages/implantable-devices/client/add-a-device/BranchDeviceInHand.jsx
//
// Branch A: the device (or its packaging) is physically present. Scan|Type
// segmented toggle → UDI capture → live GS1 parse strip → catalog match card
// → optional details → consent → link.

import React from 'react';
import { Box, TextField, Typography, Button } from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';

import ScanPanel from './ScanPanel.jsx';
import UdiParseStrip from './UdiParseStrip.jsx';
import { StreamChecklist, ConsentRow, ActionRow, Tag } from './FlowPrimitives.jsx';
import { FIELD_SX, BTN_GHOST_SX } from './addDeviceStyles.js';

function OptionalDetails({ optional, onOptional }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
      <TextField
        label="Implant date" type="date" size="small" sx={FIELD_SX}
        InputLabelProps={{ shrink: true }}
        value={optional.implantDate}
        onChange={function(event) { onOptional({ implantDate: event.target.value }); }}
      />
      <TextField
        label="Body site" size="small" sx={FIELD_SX} placeholder="e.g. Left upper chest"
        value={optional.bodySite}
        onChange={function(event) { onOptional({ bodySite: event.target.value }); }}
      />
      <TextField
        label="Managing clinic" size="small" sx={FIELD_SX} placeholder="Clinic or clinician"
        value={optional.managingClinic}
        onChange={function(event) { onOptional({ managingClinic: event.target.value }); }}
      />
    </Box>
  );
}

function BranchDeviceInHand(props) {
  const {
    mode, onMode, udi, onUdi, parsed, match,
    optional, onOptional,
    availableStreams, selectedStreams, onToggleStream,
    consent, onConsent,
    onLink, onSaveIncomplete, busy, scanCapable
  } = props;

  const hasUdi = Boolean(udi && udi.trim());

  return (
    <Box className="adv-pane" id="advBranchDevice">
      {/* Scan | Type segmented toggle */}
      <Box className="adv-seg" role="tablist">
        <button
          type="button"
          className={'adv-seg-opt' + (mode === 'scan' ? ' adv-seg-opt--on' : '')}
          onClick={function() { onMode('scan'); }}
        >
          Scan
        </button>
        <button
          type="button"
          className={'adv-seg-opt' + (mode === 'type' ? ' adv-seg-opt--on' : '')}
          onClick={function() { onMode('type'); }}
        >
          Type it in
        </button>
      </Box>

      {mode === 'scan' ? (
        <ScanPanel scanCapable={scanCapable} onScanResult={onUdi} />
      ) : (
        <TextField
          id="advUdiInput"
          label="UDI from the device label"
          placeholder="(01)00844588003288(17)291120(10)7654321D(21)10987654d321"
          fullWidth
          size="small"
          value={udi}
          onChange={function(event) { onUdi(event.target.value); }}
          sx={{ ...FIELD_SX, '& .MuiInputBase-root': { ...FIELD_SX['& .MuiInputBase-root'], fontFamily: 'var(--pf-mono)' } }}
        />
      )}

      {hasUdi && <UdiParseStrip parsed={parsed} />}

      {/* Resolved device card */}
      {hasUdi && (
        match ? (
          <Box className="adv-resolved" id="advResolvedDevice">
            <Box className="adv-icon-circle adv-icon-circle--lg adv-pulse">
              <MemoryIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="pf-kicker" sx={{ color: 'var(--pf-accent) !important' }}>
                {mode === 'scan' ? 'Scanned · matched in catalog' : 'Matched in catalog'}
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 500, color: 'var(--pf-ink)' }}>
                {match.device.name}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: 'var(--pf-ink-dim)' }}>
                {match.device.manufacturer} · {match.device.type} · {match.device.model}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
              <Tag label={'Class ' + match.device.class} variant="accent" />
              <Button size="small" variant="text" sx={{ ...BTN_GHOST_SX, fontSize: 12, p: '2px 6px' }}
                onClick={function() { onUdi(''); }}>
                Not this device
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="adv-card">
            <Typography className="pf-kicker" sx={{ mb: 0.5 }}>No catalog match</Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-mid)' }}>
              The device identifier didn&apos;t match the registry — you can still save it
              as incomplete and fill in the details later, or try the catalog search.
            </Typography>
          </Box>
        )
      )}

      {match && (
        <>
          <OptionalDetails optional={optional} onOptional={onOptional} />
          <StreamChecklist available={availableStreams} selected={selectedStreams} onToggle={onToggleStream} />
        </>
      )}

      <ConsentRow checked={consent} onChange={onConsent} />

      <ActionRow
        onLink={onLink}
        onSaveIncomplete={onSaveIncomplete}
        linkDisabled={!match}
        busy={busy}
        hint={match ? undefined : 'Link enables once the UDI matches a registry device.'}
      />
    </Box>
  );
}

export default BranchDeviceInHand;

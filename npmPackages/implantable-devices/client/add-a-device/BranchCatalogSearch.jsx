// npmPackages/implantable-devices/client/add-a-device/BranchCatalogSearch.jsx
//
// Branch C: only a brochure or a name. Catalog search with selectable result
// rows, or a manual-entry panel (Make*/Model* + kind segmented control) when
// the device isn't listed.

import React from 'react';
import { Box, TextField, Typography, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MemoryIcon from '@mui/icons-material/Memory';

import { StreamChecklist, ConsentRow, ActionRow, Tag } from './FlowPrimitives.jsx';
import { FIELD_SX, BTN_GHOST_SX } from './addDeviceStyles.js';

const MANUAL_KINDS = ['Implanted', 'Wearable', 'Home device', 'Not sure'];

function BranchCatalogSearch(props) {
  const {
    query, onQuery, results, pick, onPick,
    manual, onManual, manualFields, onManualFields,
    optional, onOptional,
    availableStreams, selectedStreams, onToggleStream,
    consent, onConsent,
    onLink, onSaveIncomplete, busy
  } = props;

  const manualReady = Boolean(manualFields.make.trim() && manualFields.model.trim());
  const ready = pick != null || (manual && manualReady);

  return (
    <Box className="adv-pane" id="advBranchPaper">
      {!manual && (
        <>
          <TextField
            id="advCatalogSearch"
            placeholder="Search by name, manufacturer, type, or SKU…"
            fullWidth
            size="small"
            value={query}
            onChange={function(event) { onQuery(event.target.value); }}
            sx={FIELD_SX}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'var(--pf-ink-dim)' }} />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {results.map(function(result) {
              const device = result.device;
              const selected = pick === device.id;
              return (
                <Box
                  component="button"
                  type="button"
                  key={device.id}
                  className={'adv-result-row' + (selected ? ' adv-result-row--selected' : '')}
                  onClick={function() { onPick(selected ? null : device.id); }}
                >
                  <Box className="adv-result-icon"><MemoryIcon sx={{ fontSize: 20 }} /></Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
                      {device.name}
                    </Typography>
                    <Typography noWrap sx={{ fontSize: 12, color: 'var(--pf-ink-dim)' }}>
                      {device.manufacturer} · {device.type} · {device.model}
                    </Typography>
                  </Box>
                  <Tag label={'Class ' + device.class} variant="neutral" />
                  <Typography sx={{ fontSize: 13, color: selected ? 'var(--pf-accent)' : 'var(--pf-ink-mid)' }}>
                    {selected ? 'Selected' : 'Select'}
                  </Typography>
                </Box>
              );
            })}
            {results.length === 0 && (
              <Box sx={{ border: '1px dashed var(--pf-track)', borderRadius: '8px', p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
                  Nothing in the registry matches &ldquo;{query}&rdquo;.
                </Typography>
              </Box>
            )}
          </Box>

          <Typography sx={{ fontSize: 13, color: 'var(--pf-ink-dim)' }}>
            Not listed?{' '}
            <Button variant="text" size="small" sx={{ ...BTN_GHOST_SX, fontSize: 13, p: '0 4px', verticalAlign: 'baseline' }}
              onClick={function() { onManual(true); }}>
              Add it manually
            </Button>
          </Typography>
        </>
      )}

      {manual && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>Manual entry</Typography>
            <Button variant="text" size="small" sx={{ ...BTN_GHOST_SX, fontSize: 12 }}
              onClick={function() { onManual(false); }}>
              Back to search
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              label="Make *" size="small" sx={FIELD_SX} placeholder="e.g. Medtronic"
              value={manualFields.make}
              onChange={function(event) { onManualFields({ make: event.target.value }); }}
            />
            <TextField
              label="Model *" size="small" sx={FIELD_SX} placeholder="e.g. Azure XT DR"
              value={manualFields.model}
              onChange={function(event) { onManualFields({ model: event.target.value }); }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Kind of device
            </Typography>
            <Box className="adv-seg">
              {MANUAL_KINDS.map(function(kind) {
                return (
                  <button
                    type="button"
                    key={kind}
                    className={'adv-seg-opt' + (manualFields.kind === kind ? ' adv-seg-opt--on' : '')}
                    onClick={function() { onManualFields({ kind: kind }); }}
                  >
                    {kind}
                  </button>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              label="Serial number" size="small" sx={FIELD_SX}
              value={optional.serial}
              onChange={function(event) { onOptional({ serial: event.target.value }); }}
            />
            <TextField
              label="Implant / start date" type="date" size="small" sx={FIELD_SX}
              InputLabelProps={{ shrink: true }}
              value={optional.implantDate}
              onChange={function(event) { onOptional({ implantDate: event.target.value }); }}
            />
            <TextField
              label="Body site" size="small" sx={FIELD_SX}
              value={optional.bodySite}
              onChange={function(event) { onOptional({ bodySite: event.target.value }); }}
            />
            <TextField
              label="Managing clinic" size="small" sx={FIELD_SX}
              value={optional.managingClinic}
              onChange={function(event) { onOptional({ managingClinic: event.target.value }); }}
            />
          </Box>
        </>
      )}

      {pick != null && !manual && (
        <StreamChecklist available={availableStreams} selected={selectedStreams} onToggle={onToggleStream} />
      )}

      <ConsentRow checked={consent} onChange={onConsent} />

      <ActionRow
        onLink={onLink}
        onSaveIncomplete={onSaveIncomplete}
        linkDisabled={!ready}
        busy={busy}
        hint={ready ? undefined
          : (manual ? 'Make and Model are required.' : 'Pick a device from the registry, or add it manually.')}
      />
    </Box>
  );
}

export default BranchCatalogSearch;

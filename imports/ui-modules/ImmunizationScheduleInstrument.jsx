// imports/ui-modules/ImmunizationScheduleInstrument.jsx
//
// Inline Instrument card 7 — immunization schedule. A wrapping chip row:
// vaccines group by vaccineCode with dose counts (×N) or a single-dose year,
// and "due" items (from a schedule rule or CarePlan — consumer-supplied via
// the `due` prop) render as dashed accent chips.
//
// Pass `immunizations` (mapped via immunizationsToChips) or pre-built `chips`.

import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { InstrumentCard } from './InstrumentCard';
import { InstrumentChip } from './InstrumentChip';
import { immunizationsToChips } from './instrumentHelpers';

export function ImmunizationScheduleInstrument(props) {
  const { kicker, immunizations, chips, due, meta, dense, sx } = props || {};

  const chipList = useMemo(function () {
    return chips || immunizationsToChips(immunizations, { due: due });
  }, [chips, immunizations, due]);

  const doseCount = (immunizations || []).length;
  const defaultKicker = kicker
    || ('Immunization' + (doseCount > 0 ? ' ×' + doseCount : '') + ' · schedule');

  return (
    <InstrumentCard kicker={defaultKicker} meta={meta} dense={dense !== false} sx={sx}>
      {chipList.length === 0 ? (
        <Box sx={{ fontSize: 12, color: 'text.secondary' }}>No immunizations on file</Box>
      ) : (
        <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {chipList.map(function (chip, index) {
            return (
              <InstrumentChip
                key={chip.label + ':' + index}
                label={chip.label + (chip.countLabel ? ' ' + chip.countLabel : '')}
                suffix={chip.yearLabel}
                variant={chip.variant}
              />
            );
          })}
        </Box>
      )}
    </InstrumentCard>
  );
}

export default ImmunizationScheduleInstrument;

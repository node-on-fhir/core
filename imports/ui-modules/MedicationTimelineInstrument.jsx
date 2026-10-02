// imports/ui-modules/MedicationTimelineInstrument.jsx
//
// Inline Instrument card 3 — medication timeline. Each MedicationRequest
// renders as a name column plus a horizontal lane: active medications run in
// the accent color to the right edge with a bright start tick; stopped ones
// sit as quiet neutral bars. Mono year labels annotate bar ends. Rows marked
// sensitive show their bar but blur the note via <Redact> — WHAT is sensitive
// (jurisdiction lens, consent) is the consumer's call via the lane/_sensitive
// flag. Spans both grid columns by default (span).
//
// Pass `medicationRequests` (mapped via medicationRequestsToLanes) or a
// pre-built `lanes` object.

import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { InstrumentCard, INSTRUMENT_MONO_FONT } from './InstrumentCard';
import { Redact } from './Redact';
import { medicationRequestsToLanes } from './instrumentHelpers';

function LaneBar({ lane }) {
  return (
    <Box sx={{ position: 'relative', height: 16 }}>
      <Box sx={theme => ({
        position: 'absolute',
        left: lane.startPct + '%',
        ...(lane.active ? { right: (100 - lane.endPct) + '%' } : { width: Math.max(1, lane.endPct - lane.startPct) + '%' }),
        top: '5px',
        height: '6px',
        borderRadius: '3px',
        bgcolor: lane.active ? theme.palette.primary.dark : alpha(theme.palette.text.primary, 0.3)
      })} />
      {lane.active && (
        <Box sx={{
          position: 'absolute',
          left: lane.startPct + '%',
          top: '2px',
          width: '2px',
          height: '12px',
          bgcolor: 'primary.light'
        }} />
      )}
      {lane.startLabel && (
        <Box component="span" sx={{
          position: 'absolute',
          left: lane.startPct + '%',
          top: '-11px',
          fontSize: 9,
          fontFamily: INSTRUMENT_MONO_FONT,
          color: 'text.secondary',
          transform: 'translateX(6px)',
          whiteSpace: 'nowrap'
        }}>
          {lane.startLabel}
        </Box>
      )}
      {lane.sensitive ? (
        <Box component="span" sx={{ position: 'absolute', left: Math.min(90, lane.endPct + 1) + '%', top: 0, fontSize: 11, color: 'text.secondary' }}>
          <Redact reason={lane.sensitiveNote || 'hidden · hover to reveal'} />
        </Box>
      ) : (lane.endLabel && (
        <Box component="span" sx={{
          position: 'absolute',
          left: Math.min(92, lane.endPct) + '%',
          top: 0,
          fontSize: 9,
          fontFamily: INSTRUMENT_MONO_FONT,
          color: 'text.secondary',
          transform: 'translateX(6px)',
          whiteSpace: 'nowrap'
        }}>
          {lane.endLabel}
        </Box>
      ))}
    </Box>
  );
}

export function MedicationTimelineInstrument(props) {
  const { kicker, medicationRequests, lanes, meta, action, span, sx } = props || {};

  const laneData = useMemo(function () {
    return lanes || medicationRequestsToLanes(medicationRequests) || { lanes: [] };
  }, [lanes, medicationRequests]);

  const axisLabel = (laneData.axisStartYear && laneData.axisEndYear)
    ? laneData.axisStartYear + ' ─────── ' + laneData.axisEndYear
    : null;

  return (
    <InstrumentCard
      kicker={kicker || 'MedicationRequest · timeline'}
      kickerRight={axisLabel && (
        <Box component="span" sx={{ fontFamily: INSTRUMENT_MONO_FONT }}>{axisLabel}</Box>
      )}
      meta={meta}
      action={action}
      span={span !== false}
      sx={sx}
    >
      {laneData.lanes.length === 0 ? (
        <Box sx={{ fontSize: 12, color: 'text.secondary', py: 1 }}>No medications on file</Box>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '170px 1fr',
          rowGap: 1,
          columnGap: '14px',
          fontSize: 13,
          alignItems: 'center'
        }}>
          {laneData.lanes.map(function (lane, index) {
            return (
              <React.Fragment key={(lane.label || 'lane') + ':' + index}>
                <Box component="span">
                  {lane.label}
                  {lane.detail && <Box component="span" sx={{ fontSize: 11, color: 'text.secondary' }}> {lane.detail}</Box>}
                </Box>
                <LaneBar lane={lane} />
              </React.Fragment>
            );
          })}
        </Box>
      )}
    </InstrumentCard>
  );
}

export default MedicationTimelineInstrument;

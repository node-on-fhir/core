// imports/ui-modules/CbcInstrument.jsx
//
// Inline Instrument card 4 — complete blood count with differential (spans
// both grid columns). Left grid: Analyte · Result · Range · Δ prior, with
// flagged rows (out-of-range) in the accent and a bound label over the
// crossed range edge. Right grid: Differential · % · Range · Abs, closed by a
// ProportionBar of the differential percentages. Title row carries a
// "N flagged" tag and the prior-comparison date; the meta row carries the
// interpretation text and an optional per-analyte trend action
// (onSelectTrend, e.g. "Hgb trend · 4 results since 2019").
//
// Pass FHIR inputs (report, observations, priorObservations → cbcReportToRows)
// or a pre-built `data` object of the same shape.

import React, { useMemo } from 'react';
import get from 'lodash/get.js';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { InstrumentCard, InstrumentColumnHeader, INSTRUMENT_MONO_FONT } from './InstrumentCard';
import { RangeBar } from './RangeBar';
import { ProportionBar } from './ProportionBar';
import { cbcReportToRows } from './instrumentHelpers';

function MonoValue({ value, unit, flagged, align }) {
  return (
    <Box component="span" sx={{
      fontFamily: INSTRUMENT_MONO_FONT,
      color: flagged ? 'primary.light' : 'text.primary',
      textAlign: align
    }}>
      {value === undefined || value === null ? '—' : value}
      {unit && <Box component="span" sx={{ fontSize: 10, color: 'text.secondary' }}> {unit}</Box>}
    </Box>
  );
}

function RowGrid({ headers, children }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '130px 64px 1fr 58px',
      columnGap: '12px',
      rowGap: 1,
      alignItems: 'center',
      fontSize: 13
    }}>
      {headers.map(function (header, index) {
        return (
          <InstrumentColumnHeader key={header} align={index === headers.length - 1 ? 'right' : undefined}>
            {header}
          </InstrumentColumnHeader>
        );
      })}
      {children}
    </Box>
  );
}

export function CbcInstrument(props) {
  const {
    kicker, kickerRight, title, report, observations, priorObservations, data,
    priorDateLabel, interpretation, onSelectTrend, trendActionLabel, span, sx
  } = props || {};

  const cbc = useMemo(function () {
    return data || cbcReportToRows(report, observations, priorObservations);
  }, [data, report, observations, priorObservations]);

  const defaultKicker = kicker
    || ('DiagnosticReport' + (get(report, 'effectiveDateTime') ? ' · ' + String(get(report, 'effectiveDateTime')).replace('T', ' ').slice(0, 16) : ''));

  return (
    <InstrumentCard
      kicker={defaultKicker}
      kickerRight={kickerRight}
      title={title || 'Complete blood count with differential'}
      titleAdornment={
        <>
          {cbc.flaggedCount > 0 && (
            <Box component="span" sx={theme => ({
              fontSize: 11,
              px: 1,
              py: '2px',
              borderRadius: '6px',
              bgcolor: alpha(theme.palette.primary.main, 0.25),
              color: 'primary.light',
              whiteSpace: 'nowrap'
            })}>
              {cbc.flaggedCount} flagged
            </Box>
          )}
          {priorDateLabel && (
            <Box component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>vs prior {priorDateLabel}</Box>
          )}
        </>
      }
      meta={interpretation && <span>{interpretation}</span>}
      action={onSelectTrend && trendActionLabel ? {
        label: trendActionLabel,
        onClick: function () { onSelectTrend(); }
      } : undefined}
      span={span !== false}
      sx={sx}
    >
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        columnGap: '36px',
        rowGap: 1
      }}>
        <RowGrid headers={['Analyte', 'Result', 'Range', 'Δ prior']}>
          {cbc.analyteRows.map(function (row, index) {
            return (
              <React.Fragment key={(row.code || row.analyte) + ':' + index}>
                <Box component="span">{row.analyte}</Box>
                <MonoValue value={row.value} unit={row.unit} flagged={row.flagged} />
                <RangeBar value={row.value} unit={row.unit} low={row.low} high={row.high} boundLabel={row.flagged || undefined} />
                <Box component="span" sx={{
                  fontFamily: INSTRUMENT_MONO_FONT,
                  fontSize: 11,
                  color: row.deltaFlagged ? 'primary.light' : 'text.secondary',
                  textAlign: 'right'
                }}>
                  {row.delta || ''}
                </Box>
              </React.Fragment>
            );
          })}
        </RowGrid>
        <RowGrid headers={['Differential', '%', 'Range', 'Abs']}>
          {cbc.differentialRows.map(function (row, index) {
            return (
              <React.Fragment key={(row.code || row.analyte) + ':' + index}>
                <Box component="span">{row.analyte}</Box>
                <MonoValue value={row.percent} flagged={row.flagged} />
                <RangeBar value={row.percent} unit="%" low={row.low} high={row.high} />
                <Box component="span" sx={{
                  fontFamily: INSTRUMENT_MONO_FONT,
                  fontSize: 11,
                  color: 'text.secondary',
                  textAlign: 'right'
                }}>
                  {row.absolute === undefined || row.absolute === null ? '' : row.absolute}
                </Box>
              </React.Fragment>
            );
          })}
          {cbc.proportionSegments.length > 0 && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <ProportionBar segments={cbc.proportionSegments} />
            </Box>
          )}
        </RowGrid>
      </Box>
    </InstrumentCard>
  );
}

export default CbcInstrument;

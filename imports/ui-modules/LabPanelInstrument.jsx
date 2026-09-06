// imports/ui-modules/LabPanelInstrument.jsx
//
// Inline Instrument card 1 — lab panel (hormone panel archetype). Renders a
// DiagnosticReport's member Observations as `analyte · mono value · RangeBar`
// rows, plus optional derived rows (e.g. an LH:FSH ratio) that show an
// interpretation string in place of the bar.
//
// Two exports:
//   - LabPanelInstrumentView (named): presentational — rows in, JSX out.
//   - LabPanelInstrument (default): thin container — accepts (report,
//     observations, patient) and batch-resolves missing reference ranges via
//     Meteor.rpc('referenceRanges.resolveBatch'), the BloodPanel.jsx pattern.
//     Rows that already carry Observation.referenceRange render immediately.

import React, { useState, useEffect, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import get from 'lodash/get.js';
import { Box } from '@mui/material';
import { InstrumentCard, INSTRUMENT_MONO_FONT } from './InstrumentCard';
import { RangeBar } from './RangeBar';
import { diagnosticReportToPanelRows } from './instrumentHelpers';

// rows: [{ analyte, value, unit, low, high, state, flagged }]
// derivedRows: [{ analyte, value, interpretation }]
export function LabPanelInstrumentView(props) {
  const { kicker, kickerRight, title, rows, derivedRows, meta, action, sx } = props || {};
  const list = rows || [];
  const derived = derivedRows || [];

  return (
    <InstrumentCard kicker={kicker} kickerRight={kickerRight} title={title} meta={meta} action={action} sx={sx}>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '120px 60px 1fr',
        rowGap: '9px',
        columnGap: '14px',
        fontSize: 13,
        alignItems: 'center'
      }}>
        {list.map(function (row, index) {
          return (
            <React.Fragment key={(row.analyte || 'row') + ':' + index}>
              <Box component="span">{row.analyte}</Box>
              <Box component="span" sx={{
                fontFamily: INSTRUMENT_MONO_FONT,
                color: row.flagged ? 'primary.light' : 'text.primary'
              }}>
                {row.value === undefined || row.value === null ? '—' : row.value}
                {row.unit && <Box component="span" sx={{ fontSize: 10, color: 'text.secondary' }}> {row.unit}</Box>}
              </Box>
              <RangeBar value={row.value} unit={row.unit} low={row.low} high={row.high} boundLabel={row.flagged || undefined} />
            </React.Fragment>
          );
        })}
        {derived.map(function (row, index) {
          return (
            <React.Fragment key={(row.analyte || 'derived') + ':' + index}>
              <Box component="span">{row.analyte}</Box>
              <Box component="span" sx={{ fontFamily: INSTRUMENT_MONO_FONT }}>
                {row.value === undefined || row.value === null ? '—' : row.value}
              </Box>
              <Box sx={{ fontSize: 11, color: 'primary.light' }}>{row.interpretation}</Box>
            </React.Fragment>
          );
        })}
      </Box>
    </InstrumentCard>
  );
}

export function LabPanelInstrument(props) {
  const { report, observations, patient, derivedRows, kicker, kickerRight, title, meta, action, sx } = props || {};
  const baseRows = useMemo(function () {
    return diagnosticReportToPanelRows(report, observations);
  }, [report, observations]);
  const [rows, setRows] = useState(baseRows);

  const unresolvedKey = useMemo(function () {
    return baseRows.filter(function (row) {
      return row.low === undefined && row.high === undefined;
    }).map(function (row) { return row.code; }).join('|');
  }, [baseRows]);
  const patientId = get(patient, '_id');

  useEffect(function () {
    setRows(baseRows);
    if (!unresolvedKey || !Meteor.rpc) { return; }

    const items = baseRows.map(function (row) {
      return { loinc: row.code, value: row.value };
    });
    Meteor.rpc('referenceRanges.resolveBatch', { items, patientId }).then(function (results) {
      setRows(baseRows.map(function (row, index) {
        const resolved = get(results, [index, 'resolved']);
        if (!resolved || (row.low !== undefined || row.high !== undefined)) { return row; }
        return Object.assign({}, row, {
          low: get(resolved, 'normal.low.value'),
          high: get(resolved, 'normal.high.value')
        });
      }));
    }).catch(function () {
      // Ranges stay unresolved — the bars degrade to value-only ticks.
    });
  }, [baseRows, unresolvedKey, patientId]);

  const defaultKicker = kicker
    || ('DiagnosticReport' + (get(report, 'effectiveDateTime') ? ' · ' + String(get(report, 'effectiveDateTime')).slice(0, 10) : ''));
  const defaultTitle = title
    || get(report, 'code.text')
    || get(report, 'code.coding.0.display', 'Lab panel');

  return (
    <LabPanelInstrumentView
      kicker={defaultKicker}
      kickerRight={kickerRight}
      title={defaultTitle}
      rows={rows}
      derivedRows={derivedRows}
      meta={meta}
      action={action}
      sx={sx}
    />
  );
}

export default LabPanelInstrument;

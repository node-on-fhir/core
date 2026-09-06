// tests/unit/imports/ui-modules/instrumentHelpers.test.mjs
//
// node --experimental-detect-module --test tests/unit/imports/ui-modules/instrumentHelpers.test.mjs
// Pure-function coverage for the Inline Instruments view-model mappers.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  interpretRange,
  computeRangeAxis,
  resolveReportObservations,
  diagnosticReportToPanelRows,
  observationsToTrendSeries,
  medicationRequestsToLanes,
  cbcReportToRows,
  imagingStudyToTiles,
  immunizationsToChips
} from '../../../../imports/ui-modules/instrumentHelpers.js';

function obs(overrides) {
  return Object.assign({
    resourceType: 'Observation',
    _id: overrides.id || 'obs-1',
    id: overrides.id || 'obs-1'
  }, overrides);
}

function labObs(id, display, code, value, unit, low, high) {
  return obs({
    id: id,
    code: { coding: [{ system: 'http://loinc.org', code: code, display: display }] },
    valueQuantity: { value: value, unit: unit },
    referenceRange: (low !== undefined || high !== undefined) ? [{
      low: low !== undefined ? { value: low } : undefined,
      high: high !== undefined ? { value: high } : undefined
    }] : undefined
  });
}

// --- interpretRange -------------------------------------------------------

test('interpretRange flags below/above range and respects one-sided profiles', function () {
  assert.equal(interpretRange(11.6, 12.0, 16.0), 'low');
  assert.equal(interpretRange(12.4, 1.9, 12.0), 'high');
  assert.equal(interpretRange(5.1, 3.5, 12.5), 'normal');
  assert.equal(interpretRange(undefined, 1, 2), 'unknown');
  // normal-high profile never reports 'low'
  assert.equal(interpretRange(0.5, 1, 4, 'normal-high'), 'normal');
  assert.equal(interpretRange(5, 1, 4, 'normal-high'), 'high');
});

// --- computeRangeAxis -----------------------------------------------------

test('computeRangeAxis pads the range by 60% and positions the value', function () {
  const axis = computeRangeAxis(5, 4, 6);
  // span 2 → axis 2.8..7.2, width 4.4
  assert.ok(Math.abs(axis.min - 2.8) < 1e-9);
  assert.ok(Math.abs(axis.max - 7.2) < 1e-9);
  assert.ok(Math.abs(axis.valuePct - 50) < 1e-9);
  assert.ok(axis.rangeLeftPct > 0 && axis.rangeLeftPct < 50);
  assert.equal(axis.state, 'normal');
});

test('computeRangeAxis clamps the axis to include an out-of-range value', function () {
  const axis = computeRangeAxis(20, 4, 6);
  assert.equal(axis.max, 20);
  assert.equal(axis.valuePct, 100);
  assert.equal(axis.state, 'high');
});

test('computeRangeAxis handles missing inputs without throwing', function () {
  assert.equal(computeRangeAxis(undefined, undefined, undefined), null);
  const valueOnly = computeRangeAxis(7, undefined, undefined);
  assert.equal(valueOnly.rangeLeftPct, null);
  assert.equal(valueOnly.state, 'normal');
  const oneSided = computeRangeAxis(3, undefined, 4);
  assert.ok(oneSided.valuePct >= 0 && oneSided.valuePct <= 100);
});

// --- report resolution + panel rows ---------------------------------------

test('resolveReportObservations follows result[] references, tolerates none', function () {
  const a = labObs('a', 'LH', '10501-5', 12.4, null, 1.9, 12.0);
  const b = labObs('b', 'FSH', '15067-2', 5.1, null, 3.5, 12.5);
  const report = { result: [{ reference: 'Observation/b' }] };
  const resolved = resolveReportObservations(report, [a, b]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, 'b');
  // no references → whole pool
  assert.equal(resolveReportObservations({}, [a, b]).length, 2);
});

test('diagnosticReportToPanelRows builds flagged rows from ranges', function () {
  const rows = diagnosticReportToPanelRows({}, [
    labObs('a', 'LH', '10501-5', 12.4, null, 1.9, 12.0),
    labObs('b', 'FSH', '15067-2', 5.1, null, 3.5, 12.5)
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].analyte, 'LH');
  assert.equal(rows[0].state, 'high');
  assert.equal(rows[0].flagged, true);
  assert.equal(rows[1].state, 'normal');
  assert.equal(rows[1].flagged, false);
});

// --- trend series ---------------------------------------------------------

test('observationsToTrendSeries sorts by date and computes stats', function () {
  const series = observationsToTrendSeries([
    obs({ id: 't2', effectiveDateTime: '2026-08-02', valueQuantity: { value: 134 } }),
    obs({ id: 't1', effectiveDateTime: '2026-08-01', valueQuantity: { value: 118 } }),
    obs({ id: 't3', effectiveDateTime: '2026-08-03', valueQuantity: { value: 110 } })
  ], { low: 90, high: 120 });
  assert.equal(series.count, 3);
  assert.equal(series.points[0].value, 118);
  assert.equal(series.peak, 134);
  assert.equal(series.outOfRangeCount, 1);
  assert.equal(series.firstDate, '2026-08-01');
  assert.equal(series.lastDate, '2026-08-03');
});

test('observationsToTrendSeries selects a component series by code', function () {
  const bp = function (id, date, systolic, diastolic) {
    return obs({
      id: id,
      effectiveDateTime: date,
      component: [
        { code: { coding: [{ code: '8480-6', display: 'Systolic' }] }, valueQuantity: { value: systolic, unit: 'mm[Hg]' } },
        { code: { coding: [{ code: '8462-4', display: 'Diastolic' }] }, valueQuantity: { value: diastolic, unit: 'mm[Hg]' } }
      ]
    });
  };
  const series = observationsToTrendSeries([bp('a', '2026-07-01', 118, 76), bp('b', '2026-07-02', 134, 82)], {
    componentCode: '8462-4'
  });
  assert.equal(series.peak, 82);
});

test('observationsToTrendSeries returns null with nothing plottable', function () {
  assert.equal(observationsToTrendSeries([], {}), null);
  assert.equal(observationsToTrendSeries([obs({ id: 'x', valueString: 'positive' })], {}), null);
});

// --- medication lanes -----------------------------------------------------

test('medicationRequestsToLanes maps active and stopped medications', function () {
  const lanes = medicationRequestsToLanes([
    {
      medicationCodeableConcept: { text: 'Albuterol inhaler' },
      authoredOn: '2008-03-01',
      status: 'active',
      dosageInstruction: [{ asNeededBoolean: true }]
    },
    {
      medicationCodeableConcept: { text: 'Metformin' },
      authoredOn: '2019-01-01',
      status: 'stopped',
      dispenseRequest: { validityPeriod: { end: '2023-05-01' } },
      dosageInstruction: [{ text: '500 mg' }]
    }
  ], { nowYear: 2026 });

  assert.equal(lanes.axisStartYear, 2008);
  assert.equal(lanes.axisEndYear, 2026);
  assert.equal(lanes.lanes[0].active, true);
  assert.equal(lanes.lanes[0].endPct, 100);
  assert.equal(lanes.lanes[0].detail, 'PRN');
  assert.equal(lanes.lanes[1].active, false);
  assert.equal(lanes.lanes[1].endLabel, 'stopped 2023');
  assert.ok(lanes.lanes[1].endPct < 100);
  assert.equal(medicationRequestsToLanes([], {}), null);
});

// --- CBC ------------------------------------------------------------------

test('cbcReportToRows partitions differential rows and computes deltas', function () {
  const current = [
    labObs('wbc', 'WBC', '6690-2', 7.8, 'K/uL', 4.5, 11.0),
    labObs('hgb', 'Hemoglobin', '718-7', 11.6, 'g/dL', 12.0, 16.0),
    Object.assign(labObs('neut', 'Neutrophils/100 leukocytes', '26511-6', 61, '%', 40, 75), {
      component: [{ code: { coding: [{ code: '751-8', display: 'Neutrophils abs' }] }, valueQuantity: { value: 4.76 } }]
    })
  ];
  const prior = [
    labObs('wbc-prior', 'WBC', '6690-2', 7.4, 'K/uL', 4.5, 11.0),
    labObs('hgb-prior', 'Hemoglobin', '718-7', 12.7, 'g/dL', 12.0, 16.0)
  ];

  const cbc = cbcReportToRows({}, current, prior);
  assert.equal(cbc.analyteRows.length, 2);
  assert.equal(cbc.differentialRows.length, 1);
  assert.equal(cbc.analyteRows[0].delta, '+0.4');
  assert.equal(cbc.analyteRows[1].delta, '−1.1');
  assert.equal(cbc.analyteRows[1].flagged, true);
  assert.equal(cbc.differentialRows[0].analyte, 'Neutrophils');
  assert.equal(cbc.differentialRows[0].absolute, 4.76);
  assert.equal(cbc.proportionSegments[0].value, 61);
  assert.equal(cbc.flaggedCount, 1);
});

// --- imaging tiles --------------------------------------------------------

test('imagingStudyToTiles caps tiles and reports overflow', function () {
  const study = {
    series: [
      { description: 'AX T2', instance: [{ extension: [{ url: 'https://x/gridfsFileId', valueString: 'f1' }] }, {}] },
      { description: 'SAG', instance: [{}] },
      { modality: { code: 'MR' }, instance: [{}, {}, {}] }
    ]
  };
  const tiles = imagingStudyToTiles(study, { max: 3 });
  assert.equal(tiles.tiles.length, 3);
  assert.equal(tiles.tiles[0].seriesLabel, 'AX T2');
  assert.equal(tiles.tiles[0].gridfsFileId, 'f1');
  assert.equal(tiles.seriesCount, 3);
  assert.equal(tiles.totalInstances, 6);
  assert.equal(tiles.overflowCount, 3);
});

// --- immunization chips ---------------------------------------------------

test('immunizationsToChips groups doses and appends due chips', function () {
  const chips = immunizationsToChips([
    { vaccineCode: { text: 'Tdap' }, occurrenceDateTime: '2019-04-01' },
    { vaccineCode: { text: 'MMR' }, occurrenceDateTime: '1995-01-01' },
    { vaccineCode: { text: 'MMR' }, occurrenceDateTime: '1999-01-01' },
    { vaccineCode: { text: 'HepB' } },
    { vaccineCode: { text: 'HepB' } },
    { vaccineCode: { text: 'HepB' } },
    { vaccineCode: { text: 'Flu' }, occurrenceDateTime: '2025-10-01' }
  ], { due: ['COVID booster due'] });

  assert.equal(chips.length, 5);
  assert.deepEqual(chips[0], { label: 'Tdap', countLabel: null, yearLabel: '2019', variant: 'default' });
  assert.equal(chips[1].countLabel, '×2');
  assert.equal(chips[1].yearLabel, null);
  assert.equal(chips[2].countLabel, '×3');
  assert.equal(chips[4].variant, 'due');
});

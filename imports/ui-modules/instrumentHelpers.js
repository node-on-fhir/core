// imports/ui-modules/instrumentHelpers.js
//
// Pure, Meteor-free view-model mappers for the Inline Instruments card family
// (design handoff: workzone/design_handoff_inline_instruments). Each function
// turns FHIR resources into the flat shapes the instrument components render.
// Only dependencies are lodash `get` and biomarkerHelpers (also isomorphic),
// so everything here is unit-testable under plain `node --test`.

import get from 'lodash/get.js';
import {
  getObservationValue,
  getObservationUnit,
  getObservationDate,
  getObservationComponents
} from './biomarkerHelpers.js';

// ---------------------------------------------------------------------------
// Range interpretation + axis math (shared by RangeBar and the lab mappers)
// ---------------------------------------------------------------------------

// Same band-profile semantics as imports/ui-fields/ReferenceRange.jsx interp().
export function interpretRange(value, low, high, bandProfile) {
  var profile = bandProfile || 'low-normal-high';
  if (typeof value !== 'number' || !isFinite(value)) { return 'unknown'; }
  if ((profile === 'low-normal-high' || profile === 'low-normal') && typeof low === 'number' && value < low) { return 'low'; }
  if ((profile === 'low-normal-high' || profile === 'normal-high') && typeof high === 'number' && value > high) { return 'high'; }
  return 'normal';
}

// Axis = min–max of (reference range ± 60% of its span), clamped to include
// the value. Returns percent positions for the RangeBar primitive, or null
// when there is nothing plottable.
export function computeRangeAxis(value, low, high, bandProfile) {
  var hasValue = typeof value === 'number' && isFinite(value);
  var hasLow = typeof low === 'number' && isFinite(low);
  var hasHigh = typeof high === 'number' && isFinite(high);
  if (!hasValue && !hasLow && !hasHigh) { return null; }

  // One-sided ranges borrow the missing bound from the value so a span exists.
  var effLow = hasLow ? low : Math.min.apply(null, [hasValue ? value : high, hasHigh ? high : value]);
  var effHigh = hasHigh ? high : Math.max.apply(null, [hasValue ? value : low, hasLow ? low : value]);
  var span = effHigh - effLow;
  if (!(span > 0)) { span = Math.abs(effHigh) || 1; }

  var min = effLow - span * 0.6;
  var max = effHigh + span * 0.6;
  if (hasValue) {
    if (value < min) { min = value; }
    if (value > max) { max = value; }
  }
  var width = max - min;
  if (!(width > 0)) { width = 1; }

  function pct(x) { return Math.max(0, Math.min(100, ((x - min) / width) * 100)); }

  return {
    min: min,
    max: max,
    valuePct: hasValue ? pct(value) : null,
    rangeLeftPct: (hasLow || hasHigh) ? pct(effLow) : null,
    rangeWidthPct: (hasLow || hasHigh) ? (pct(effHigh) - pct(effLow)) : null,
    lowPct: hasLow ? pct(low) : null,
    highPct: hasHigh ? pct(high) : null,
    state: interpretRange(value, hasLow ? low : undefined, hasHigh ? high : undefined, bandProfile)
  };
}

// ---------------------------------------------------------------------------
// Shared FHIR extraction helpers
// ---------------------------------------------------------------------------

function observationLabel(obs) {
  return get(obs, 'code.text')
    || get(obs, 'code.coding.0.display')
    || get(obs, 'code.coding.0.code', 'Observation');
}

function observationLoinc(obs) {
  return get(obs, 'code.coding.0.code') || null;
}

function referenceBounds(obs) {
  return {
    low: get(obs, 'referenceRange.0.low.value'),
    high: get(obs, 'referenceRange.0.high.value')
  };
}

// True when Observation.interpretation carries an abnormal flag (L/H/LL/HH/A).
function interpretationFlagged(obs) {
  var codings = get(obs, 'interpretation.0.coding', []) || [];
  return codings.some(function (coding) {
    return /^(L|H|LL|HH|A|AA)$/.test(get(coding, 'code', ''));
  });
}

// Resolve DiagnosticReport.result[] references against a pool of Observations.
// Falls back to the whole pool when the report has no result references.
export function resolveReportObservations(report, observations) {
  var pool = observations || [];
  var refs = (get(report, 'result', []) || []).map(function (r) {
    return String(get(r, 'reference', '')).replace(/^Observation\//, '');
  }).filter(Boolean);
  if (refs.length === 0) { return pool; }

  var byId = {};
  pool.forEach(function (obs) {
    if (get(obs, '_id')) { byId[get(obs, '_id')] = obs; }
    if (get(obs, 'id')) { byId[get(obs, 'id')] = obs; }
  });
  return refs.map(function (ref) { return byId[ref]; }).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Card 1 — lab panel (hormone panel archetype)
// ---------------------------------------------------------------------------

// → [{ code, analyte, value, unit, low, high, state, flagged }]
export function diagnosticReportToPanelRows(report, observations) {
  var members = resolveReportObservations(report, observations);
  return members.map(function (obs) {
    var value = getObservationValue(obs);
    var bounds = referenceBounds(obs);
    var state = interpretRange(value, bounds.low, bounds.high);
    return {
      code: observationLoinc(obs),
      analyte: observationLabel(obs),
      value: value,
      unit: getObservationUnit(obs),
      low: bounds.low,
      high: bounds.high,
      state: state,
      flagged: state === 'low' || state === 'high' || interpretationFlagged(obs)
    };
  });
}

// ---------------------------------------------------------------------------
// Card 2 — folded observation trend (blood pressure archetype)
// ---------------------------------------------------------------------------

// observations: a folded group of Observations sharing a code. componentCode
// selects a component series (e.g. systolic) when the observations carry
// component[] values; otherwise the top-level value is charted.
// → { points, count, avg, peak, minValue, outOfRangeCount, low, high,
//     firstDate, lastDate } or null when nothing is plottable.
export function observationsToTrendSeries(observations, options) {
  var opts = options || {};
  var pool = (observations || []).slice();

  var samples = pool.map(function (obs) {
    var value = null;
    if (opts.componentCode) {
      var component = getObservationComponents(obs).find(function (c) {
        return c.key === opts.componentCode || c.label === opts.componentCode;
      });
      value = component ? component.value : null;
    } else {
      value = getObservationValue(obs);
    }
    return { date: getObservationDate(obs), value: value };
  }).filter(function (s) {
    return typeof s.value === 'number' && isFinite(s.value);
  });

  if (samples.length === 0) { return null; }

  samples.sort(function (a, b) {
    return String(a.date || '').localeCompare(String(b.date || ''));
  });

  var values = samples.map(function (s) { return s.value; });
  var low = typeof opts.low === 'number' ? opts.low : referenceBounds(pool[0]).low;
  var high = typeof opts.high === 'number' ? opts.high : referenceBounds(pool[0]).high;

  var sum = values.reduce(function (acc, v) { return acc + v; }, 0);
  var outOfRangeCount = values.filter(function (v) {
    return interpretRange(v, low, high) !== 'normal';
  }).length;

  return {
    points: samples,
    count: samples.length,
    avg: sum / values.length,
    peak: Math.max.apply(null, values),
    minValue: Math.min.apply(null, values),
    outOfRangeCount: outOfRangeCount,
    low: low,
    high: high,
    firstDate: samples[0].date,
    lastDate: samples[samples.length - 1].date
  };
}

// ---------------------------------------------------------------------------
// Card 3 — medication timeline lanes
// ---------------------------------------------------------------------------

function yearOf(dateString) {
  var year = parseInt(String(dateString || '').slice(0, 4), 10);
  return isFinite(year) ? year : null;
}

// → { axisStartYear, axisEndYear, lanes: [{ label, detail, startPct, endPct,
//     active, startLabel, endLabel, sensitive }] } or null with no requests.
export function medicationRequestsToLanes(medicationRequests, options) {
  var opts = options || {};
  var nowYear = typeof opts.nowYear === 'number' ? opts.nowYear : yearOf(opts.now) || new Date().getFullYear();
  var requests = (medicationRequests || []).filter(function (mr) {
    return yearOf(get(mr, 'authoredOn') || get(mr, 'dispenseRequest.validityPeriod.start'));
  });
  if (requests.length === 0) { return null; }

  var startYears = requests.map(function (mr) {
    return yearOf(get(mr, 'authoredOn') || get(mr, 'dispenseRequest.validityPeriod.start'));
  });
  var axisStartYear = Math.min.apply(null, startYears);
  var axisEndYear = nowYear;
  var axisSpan = Math.max(1, axisEndYear - axisStartYear);

  function pct(year) {
    return Math.max(0, Math.min(100, ((year - axisStartYear) / axisSpan) * 100));
  }

  var lanes = requests.map(function (mr) {
    var startYear = yearOf(get(mr, 'authoredOn') || get(mr, 'dispenseRequest.validityPeriod.start'));
    var status = get(mr, 'status', 'unknown');
    var endDate = get(mr, 'dispenseRequest.validityPeriod.end');
    var endYear = yearOf(endDate);
    var active = status === 'active' && !endYear;
    if (!active && !endYear) { endYear = startYear; }

    var dosage = get(mr, 'dosageInstruction.0.text')
      || (get(mr, 'dosageInstruction.0.asNeededBoolean') ? 'PRN' : null);

    return {
      label: get(mr, 'medicationCodeableConcept.text')
        || get(mr, 'medicationCodeableConcept.coding.0.display')
        || get(mr, 'medicationReference.display', 'Medication'),
      detail: dosage,
      startPct: pct(startYear),
      endPct: active ? 100 : pct(endYear),
      active: active,
      startLabel: String(startYear),
      endLabel: active ? null : ('stopped ' + endYear),
      sensitive: !!get(mr, '_sensitive'),
      sensitiveNote: get(mr, '_sensitiveNote', null)
    };
  });

  return { axisStartYear: axisStartYear, axisEndYear: axisEndYear, lanes: lanes };
}

// ---------------------------------------------------------------------------
// Card 4 — CBC with differential
// ---------------------------------------------------------------------------

var DIFFERENTIAL_PATTERN = /neutrophil|lymphocyte|monocyte|eosinophil|basophil/i;

function formatDelta(current, prior) {
  if (typeof current !== 'number' || typeof prior !== 'number') { return null; }
  var delta = current - prior;
  var rounded = Math.round(delta * 100) / 100;
  return (rounded > 0 ? '+' : (rounded < 0 ? '−' : '')) + Math.abs(rounded);
}

// Partitions a CBC panel (LOINC 58410-2 archetype) into analyte rows and
// differential-percentage rows, computes Δ vs the most recent prior
// observation with the same code, and builds the proportion-bar segments.
// → { analyteRows, differentialRows, proportionSegments, flaggedCount }
export function cbcReportToRows(report, observations, priorObservations) {
  var members = resolveReportObservations(report, observations);
  var priors = priorObservations || [];

  function priorFor(obs) {
    var code = observationLoinc(obs);
    var label = observationLabel(obs);
    var match = priors.find(function (p) {
      return (code && observationLoinc(p) === code)
        || (!code && observationLabel(p) === label);
    });
    return match ? getObservationValue(match) : null;
  }

  var analyteRows = [];
  var differentialRows = [];

  members.forEach(function (obs) {
    var label = observationLabel(obs);
    var unit = getObservationUnit(obs);
    var value = getObservationValue(obs);
    var bounds = referenceBounds(obs);
    var state = interpretRange(value, bounds.low, bounds.high);
    var flagged = state === 'low' || state === 'high' || interpretationFlagged(obs);
    var isDifferential = DIFFERENTIAL_PATTERN.test(label) && unit === '%';

    if (isDifferential) {
      // The paired absolute count rides along as the first numeric component
      // (or a valueQuantity on a sibling observation the consumer merged in).
      differentialRows.push({
        code: observationLoinc(obs),
        analyte: label.replace(/\s*\/100 leukocytes.*$/i, ''),
        percent: value,
        low: bounds.low,
        high: bounds.high,
        state: state,
        flagged: flagged,
        absolute: get(getObservationComponents(obs), '0.value', null)
      });
    } else {
      var prior = priorFor(obs);
      analyteRows.push({
        code: observationLoinc(obs),
        analyte: label,
        value: value,
        unit: unit,
        low: bounds.low,
        high: bounds.high,
        state: state,
        flagged: flagged,
        delta: formatDelta(value, prior),
        deltaFlagged: flagged
      });
    }
  });

  var proportionSegments = differentialRows
    .filter(function (row) { return typeof row.percent === 'number'; })
    .map(function (row) { return { label: row.analyte, value: row.percent }; });

  var flaggedCount = analyteRows.concat(differentialRows).filter(function (row) {
    return row.flagged;
  }).length;

  return {
    analyteRows: analyteRows,
    differentialRows: differentialRows,
    proportionSegments: proportionSegments,
    flaggedCount: flaggedCount
  };
}

// ---------------------------------------------------------------------------
// Card 5 — imaging key-image tiles
// ---------------------------------------------------------------------------

function findGridfsFileId(instance) {
  var extensions = get(instance, 'extension', []) || [];
  var match = extensions.find(function (ext) {
    return String(get(ext, 'url', '')).indexOf('gridfsFileId') !== -1;
  });
  return match ? (get(match, 'valueString') || get(match, 'valueUrl') || get(match, 'valueId') || null) : null;
}

// → { tiles: [{ seriesLabel, gridfsFileId }], overflowCount, seriesCount,
//     totalInstances }
export function imagingStudyToTiles(imagingStudy, options) {
  var max = get(options, 'max', 3);
  var series = get(imagingStudy, 'series', []) || [];
  var tiles = [];
  var totalInstances = 0;

  series.forEach(function (s) {
    var label = get(s, 'description')
      || get(s, 'modality.code')
      || get(s, 'modality.coding.0.code', '');
    var instances = get(s, 'instance', []) || [];
    totalInstances += instances.length || Number(get(s, 'numberOfInstances', 0)) || 0;
    instances.forEach(function (instance) {
      tiles.push({ seriesLabel: label, gridfsFileId: findGridfsFileId(instance) });
    });
    if (instances.length === 0) {
      tiles.push({ seriesLabel: label, gridfsFileId: null });
    }
  });

  var shown = tiles.slice(0, max);
  var overflowCount = Math.max(0, (totalInstances || tiles.length) - shown.length);

  return {
    tiles: shown,
    overflowCount: overflowCount,
    seriesCount: series.length,
    totalInstances: totalInstances || tiles.length
  };
}

// ---------------------------------------------------------------------------
// Card 7 — immunization schedule chips
// ---------------------------------------------------------------------------

// → [{ label, yearLabel, countLabel, variant }] — grouped by vaccine, plus a
// dashed "due" chip per options.due entry.
export function immunizationsToChips(immunizations, options) {
  var due = get(options, 'due', []) || [];
  var groups = {};
  var order = [];

  (immunizations || []).forEach(function (immunization) {
    var label = get(immunization, 'vaccineCode.text')
      || get(immunization, 'vaccineCode.coding.0.display')
      || get(immunization, 'vaccineCode.coding.0.code', 'Vaccine');
    if (!groups[label]) {
      groups[label] = { count: 0, latestYear: null };
      order.push(label);
    }
    groups[label].count += 1;
    var year = yearOf(get(immunization, 'occurrenceDateTime') || get(immunization, 'occurrenceString'));
    if (year && (!groups[label].latestYear || year > groups[label].latestYear)) {
      groups[label].latestYear = year;
    }
  });

  var chips = order.map(function (label) {
    var group = groups[label];
    return {
      label: label,
      countLabel: group.count > 1 ? ('×' + group.count) : null,
      yearLabel: group.count === 1 && group.latestYear ? String(group.latestYear) : null,
      variant: 'default'
    };
  });

  due.forEach(function (dueLabel) {
    chips.push({ label: dueLabel, countLabel: null, yearLabel: null, variant: 'due' });
  });

  return chips;
}

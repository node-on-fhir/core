// imports/lib/trendDetection.js
//
// Trend detection for time-series observations — the "Trend Detection"
// algorithm researched for the Personal Health Records IG (see
// docs/PHR-ALGORITHMS-PLAN.md). Ordinary least-squares regression over
// (time, value) points with:
//
//   - window filtering (last N days)
//   - 3σ outlier removal
//   - slope (units/day), intercept, R²
//   - two-sided p-value for H₀: slope = 0, via the exact t-distribution
//     (regularized incomplete beta — no stats dependency)
//   - clinical-significance gate: p < 0.05 AND |slope| > threshold AND R² > 0.5
//
// A trend is only flagged `significant` when it clears all three bars, so a
// statistically-real-but-clinically-trivial drift stays quiet.
//
// Authored as dependency-free CommonJS (importRunTags.js precedent): the CI
// lib-unit-tests job runs `node --test` off a bare checkout with no npm
// install, and plain node classifies .js as CJS here. ESM import sites
// (rspack bundle, chart components) interop fine via the default export.

var MS_PER_DAY = 86400000;

// Clinical per-day slope thresholds, converted from the guideline framing
// ("concerning trend") researched for the PHR IG. Keyed by LOINC code; the
// display name and original framing are kept for UI copy.
var CLINICAL_THRESHOLDS = [
  { code: '29463-7', display: 'Body weight',      perDay: 2 / 7,   framing: '>2 kg/week',      unit: 'kg' },
  { code: '8480-6',  display: 'Systolic BP',      perDay: 10 / 30, framing: '>10 mmHg/month',  unit: 'mmHg' },
  { code: '8867-4',  display: 'Heart rate',       perDay: 10 / 30, framing: '>10 bpm/month',   unit: 'bpm' },
  { code: '1558-6',  display: 'Fasting glucose',  perDay: 20 / 30, framing: '>20 mg/dL/month', unit: 'mg/dL' }
];

/**
 * Per-day clinical slope threshold for a LOINC code, or 0 (no clinical gate)
 * when the code has no entry.
 * @param {string} loincCode
 * @returns {number}
 */
function thresholdForCode(loincCode) {
  for (var i = 0; i < CLINICAL_THRESHOLDS.length; i++) {
    if (CLINICAL_THRESHOLDS[i].code === loincCode) {
      return CLINICAL_THRESHOLDS[i].perDay;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// t-distribution p-value (regularized incomplete beta)
// ---------------------------------------------------------------------------

// Lanczos approximation of ln Γ(x), x > 0.
function logGamma(x) {
  var g = 7;
  var coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    // Reflection formula
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  var a = coefficients[0];
  var t = x + g + 0.5;
  for (var i = 1; i < g + 2; i++) {
    a += coefficients[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// Continued fraction for the incomplete beta function (Lentz's method).
function betaContinuedFraction(a, b, x) {
  var MAX_ITERATIONS = 200;
  var EPSILON = 3e-12;
  var TINY = 1e-30;

  var qab = a + b;
  var qap = a + 1;
  var qam = a - 1;
  var c = 1;
  var d = 1 - qab * x / qap;
  if (Math.abs(d) < TINY) { d = TINY; }
  d = 1 / d;
  var h = d;

  for (var m = 1; m <= MAX_ITERATIONS; m++) {
    var m2 = 2 * m;
    var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) { d = TINY; }
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) { c = TINY; }
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < TINY) { d = TINY; }
    c = 1 + aa / c;
    if (Math.abs(c) < TINY) { c = TINY; }
    d = 1 / d;
    var del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPSILON) { break; }
  }
  return h;
}

// Regularized incomplete beta I_x(a, b).
function regularizedIncompleteBeta(a, b, x) {
  if (x <= 0) { return 0; }
  if (x >= 1) { return 1; }
  var lnBeta = logGamma(a + b) - logGamma(a) - logGamma(b)
    + a * Math.log(x) + b * Math.log(1 - x);
  var front = Math.exp(lnBeta);
  if (x < (a + 1) / (a + b + 2)) {
    return front * betaContinuedFraction(a, b, x) / a;
  }
  return 1 - front * betaContinuedFraction(b, a, 1 - x) / b;
}

/**
 * Two-sided p-value for a t statistic with df degrees of freedom:
 * P(|T| ≥ |t|) = I_{df/(df+t²)}(df/2, 1/2).
 * @param {number} t
 * @param {number} df
 * @returns {number} p in [0, 1]
 */
function twoSidedPValue(t, df) {
  if (!isFinite(t)) { return 0; }
  if (df <= 0) { return 1; }
  return regularizedIncompleteBeta(df / 2, 0.5, df / (df + t * t));
}

// ---------------------------------------------------------------------------
// Regression
// ---------------------------------------------------------------------------

/**
 * Ordinary least-squares fit of y = intercept + slope·x.
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {Object} { n, slope, intercept, rSquared, seSlope, tStat, pValue }
 *   or { n, degenerate: true, reason } when a fit is impossible.
 */
function linearRegression(xs, ys) {
  var n = Math.min(xs.length, ys.length);
  if (n < 3) {
    return { n: n, degenerate: true, reason: 'insufficient-points' };
  }

  var xMean = 0;
  var yMean = 0;
  var i;
  for (i = 0; i < n; i++) { xMean += xs[i]; yMean += ys[i]; }
  xMean /= n;
  yMean /= n;

  var sumXY = 0;
  var sumX2 = 0;
  for (i = 0; i < n; i++) {
    sumXY += (xs[i] - xMean) * (ys[i] - yMean);
    sumX2 += (xs[i] - xMean) * (xs[i] - xMean);
  }
  if (sumX2 === 0) {
    return { n: n, degenerate: true, reason: 'zero-time-variance' };
  }

  var slope = sumXY / sumX2;
  var intercept = yMean - slope * xMean;

  var ssr = 0; // regression sum of squares
  var sst = 0; // total sum of squares
  var sse = 0; // residual sum of squares
  for (i = 0; i < n; i++) {
    var predicted = intercept + slope * xs[i];
    ssr += (predicted - yMean) * (predicted - yMean);
    sst += (ys[i] - yMean) * (ys[i] - yMean);
    sse += (ys[i] - predicted) * (ys[i] - predicted);
  }

  // All values identical → flat line, perfectly fit, nothing trending.
  if (sst === 0) {
    return { n: n, slope: 0, intercept: yMean, rSquared: 0, seSlope: 0, tStat: 0, pValue: 1 };
  }

  var rSquared = ssr / sst;
  var df = n - 2;
  var seSlope = Math.sqrt(sse / (df * sumX2));
  var tStat = seSlope === 0 ? Infinity : slope / seSlope;
  var pValue = seSlope === 0 ? 0 : twoSidedPValue(tStat, df);

  return { n: n, slope: slope, intercept: intercept, rSquared: rSquared, seSlope: seSlope, tStat: tStat, pValue: pValue };
}

// ---------------------------------------------------------------------------
// Point preparation
// ---------------------------------------------------------------------------

function toMillis(time) {
  if (typeof time === 'number') { return isFinite(time) ? time : null; }
  if (time instanceof Date) { var ms = time.getTime(); return isNaN(ms) ? null : ms; }
  if (typeof time === 'string') { var parsed = Date.parse(time); return isNaN(parsed) ? null : parsed; }
  return null;
}

/**
 * Map FHIR Observations to { time, value } points. Tolerant: entries missing
 * a parseable effective time or a numeric valueQuantity.value are skipped.
 * @param {Array} observations
 * @returns {Array} [{ time: ms, value: number }]
 */
function pointsFromObservations(observations) {
  var points = [];
  (observations || []).forEach(function(observation) {
    if (!observation) { return; }
    var time = toMillis(observation.effectiveDateTime || observation.issued
      || (observation.effectivePeriod && observation.effectivePeriod.start));
    var value = observation.valueQuantity ? observation.valueQuantity.value : undefined;
    if (time !== null && typeof value === 'number' && isFinite(value)) {
      points.push({ time: time, value: value });
    } else {
      // Skipped silently by design: charts feed mixed panels through here and
      // non-numeric components (e.g. text results) are simply not trendable.
    }
  });
  return points;
}

/**
 * Remove points whose value lies more than `sigma` standard deviations from
 * the mean. No-op when σ = 0 or fewer than 4 points (σ estimates are too
 * unstable to justify discarding data below that).
 * @param {Array} points [{ time, value }]
 * @param {number} sigma
 * @returns {Array}
 */
function removeOutliers(points, sigma) {
  if (points.length < 4) { return points.slice(); }
  var mean = 0;
  points.forEach(function(p) { mean += p.value; });
  mean /= points.length;
  var variance = 0;
  points.forEach(function(p) { variance += (p.value - mean) * (p.value - mean); });
  variance /= points.length;
  var stdDev = Math.sqrt(variance);
  if (stdDev === 0) { return points.slice(); }
  return points.filter(function(p) {
    return Math.abs(p.value - mean) <= sigma * stdDev;
  });
}

// ---------------------------------------------------------------------------
// Public entry
// ---------------------------------------------------------------------------

/**
 * Detect a clinically significant linear trend in a time series.
 *
 * @param {Array} points - [{ time: ms|ISO|Date, value: number }]
 * @param {Object} [options]
 * @param {number} [options.windowDays] - Only points within the last N days
 *   (relative to options.now) are considered. Omit for no window.
 * @param {number} [options.now] - Reference "now" in ms (defaults to Date.now();
 *   pass explicitly in tests).
 * @param {number} [options.clinicalThreshold=0] - Minimum |slope| in
 *   units/day for clinical significance (see thresholdForCode). 0 means any
 *   statistically significant slope qualifies.
 * @param {number} [options.outlierSigma=3] - σ multiple for outlier removal.
 * @param {number} [options.minPoints=3] - Fewer usable points → insufficientData.
 * @returns {Object} {
 *   significant, direction: 'increasing'|'decreasing'|'flat',
 *   slope (units/day), intercept, rSquared, pValue, n,
 *   outliersRemoved, insufficientData?, reason?
 * }
 */
function detectTrend(points, options) {
  options = options || {};
  var outlierSigma = typeof options.outlierSigma === 'number' ? options.outlierSigma : 3;
  var minPoints = typeof options.minPoints === 'number' ? options.minPoints : 3;
  var clinicalThreshold = typeof options.clinicalThreshold === 'number' ? options.clinicalThreshold : 0;

  var usable = [];
  (points || []).forEach(function(p) {
    if (!p) { return; }
    var time = toMillis(p.time);
    if (time !== null && typeof p.value === 'number' && isFinite(p.value)) {
      usable.push({ time: time, value: p.value });
    }
  });

  if (typeof options.windowDays === 'number' && options.windowDays > 0) {
    var now = typeof options.now === 'number' ? options.now : Date.now();
    var cutoff = now - options.windowDays * MS_PER_DAY;
    usable = usable.filter(function(p) { return p.time >= cutoff; });
  }

  usable.sort(function(a, b) { return a.time - b.time; });

  var cleaned = removeOutliers(usable, outlierSigma);
  var outliersRemoved = usable.length - cleaned.length;

  if (cleaned.length < minPoints) {
    return {
      significant: false, direction: 'flat', slope: 0, intercept: 0,
      rSquared: 0, pValue: 1, n: cleaned.length,
      outliersRemoved: outliersRemoved,
      insufficientData: true, reason: 'insufficient-points'
    };
  }

  var baseTime = cleaned[0].time;
  var xs = cleaned.map(function(p) { return (p.time - baseTime) / MS_PER_DAY; });
  var ys = cleaned.map(function(p) { return p.value; });

  var fit = linearRegression(xs, ys);
  if (fit.degenerate) {
    return {
      significant: false, direction: 'flat', slope: 0, intercept: 0,
      rSquared: 0, pValue: 1, n: fit.n,
      outliersRemoved: outliersRemoved,
      insufficientData: true, reason: fit.reason
    };
  }

  var direction = fit.slope > 0 ? 'increasing' : (fit.slope < 0 ? 'decreasing' : 'flat');
  var significant = fit.pValue < 0.05
    && Math.abs(fit.slope) > clinicalThreshold
    && fit.rSquared > 0.5;

  return {
    significant: significant,
    direction: direction,
    slope: fit.slope,
    intercept: fit.intercept,
    rSquared: fit.rSquared,
    pValue: fit.pValue,
    n: fit.n,
    outliersRemoved: outliersRemoved
  };
}

var TrendDetection = {
  MS_PER_DAY: MS_PER_DAY,
  CLINICAL_THRESHOLDS: CLINICAL_THRESHOLDS,
  thresholdForCode: thresholdForCode,
  twoSidedPValue: twoSidedPValue,
  linearRegression: linearRegression,
  pointsFromObservations: pointsFromObservations,
  removeOutliers: removeOutliers,
  detectTrend: detectTrend
};

module.exports = TrendDetection;

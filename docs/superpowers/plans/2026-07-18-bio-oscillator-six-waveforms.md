# BioModels Six-Waveforms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ECG, capnograph, and two-process alertness biomodels to the `/biomodels` page (keeping the existing three), unify the Daily Log Sleep-tab alertness curve with the new model, and give the controls a two-level category/signal selector with an aligned control band.

**Architecture:** Three new signal generators plug into the existing `rk4Step` / `integrateAndSample` RK4 harness and `MODEL_PRESETS` table in `client/lib/waveformGenerators.js`; the alertness two-process math lives in a standalone pure module `client/lib/alertness.js` exported for cross-extension reuse. The controls become a two-level `ToggleButtonGroup` (category → signal). Rust/WASM parity is a deferred follow-up — JS is the live path.

**Tech Stack:** ES modules (browser via Meteor/Rspack; Node 25 auto-reparses for tests), React 18 + MUI 5, `node --test` with `.mjs` harnesses, FHIR R4 `valueSampledData`.

## Global Constraints

- Work in `extensions/bio-oscillator-wasm/` (route `/biomodels`, scope `@orbital/bio-oscillator-wasm`) — NOT the `npmPackages/biomodels-wasm` fork referenced in some doc paths.
- Preserve the existing three models' output byte-for-byte (regression guard).
- New models land in **JS only** this pass; Rust/`rust/src/waveforms/mod.rs` + WASM rebuild is a separate follow-up. Do not claim WASM parity for new models.
- Test runner: from `extensions/bio-oscillator-wasm/`, `node --test test/<file>.test.mjs`. A `MODULE_TYPELESS_PACKAGE_JSON` perf warning is expected and harmless.
- Function syntax `function(){}` (not arrows) for consistency with the file; `var` declarations to match the existing style.
- Physiological units: ECG `mV`, capnograph `mm[Hg]`, alertness `%`.
- Do not hardcode secrets; no theme regressions (page is dark-mode; use MUI tokens as the existing components do).
- Commits go to the **nested** git repo inside `extensions/bio-oscillator-wasm/` (and `extensions/orbital/` for Task 6); the spec/plan docs live in the honeycomb monorepo. Only commit when the operator has asked you to commit.

---

### Task 1: Alertness two-process module

**Files:**
- Create: `extensions/bio-oscillator-wasm/client/lib/alertness.js`
- Test: `extensions/bio-oscillator-wasm/test/alertness.test.mjs`

**Interfaces:**
- Produces: `computeAlertnessCurve({ bedtime, sleepDuration }) -> Array<{x:number,y:number}>` (24 hourly points, `y` in 0–100); `generateAlertness(overrides) -> { time:Float64Array, values:Float64Array, metadata:Object }`.

- [ ] **Step 1: Write the failing test**

```js
// extensions/bio-oscillator-wasm/test/alertness.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { computeAlertnessCurve, generateAlertness } from '../client/lib/alertness.js';

function argmaxIn(pts, lo, hi) {
  var best = -Infinity, at = -1;
  for (var i = 0; i < pts.length; i++) {
    if (pts[i].x >= lo && pts[i].x <= hi && pts[i].y > best) { best = pts[i].y; at = pts[i].x; }
  }
  return { at: at, y: best };
}
function minIn(pts, lo, hi) {
  var best = Infinity, at = -1;
  for (var i = 0; i < pts.length; i++) {
    if (pts[i].x >= lo && pts[i].x <= hi && pts[i].y < best) { best = pts[i].y; at = pts[i].x; }
  }
  return { at: at, y: best };
}

test('alertness curve is bimodal with a morning peak, afternoon dip, evening peak, night trough', function() {
  var pts = computeAlertnessCurve({ bedtime: 22, sleepDuration: 8 });
  assert.equal(pts.length, 24);
  var morning = argmaxIn(pts, 8, 11);
  var dip = minIn(pts, 13, 16);
  var evening = argmaxIn(pts, 17, 20);
  var night = minIn(pts, 2, 6);
  // Two daytime peaks straddling a lower midday dip:
  assert.ok(morning.y > dip.y + 5, 'morning peak above afternoon dip');
  assert.ok(evening.y > dip.y + 5, 'evening peak above afternoon dip');
  // Night is the global low:
  assert.ok(night.y < dip.y, 'night trough below afternoon dip');
  // Physiological range:
  for (var i = 0; i < pts.length; i++) { assert.ok(pts[i].y >= 0 && pts[i].y <= 100); }
});

test('alertness time-series has the right shape and length', function() {
  var r = generateAlertness({ duration: 172800, sampleRate: 0.01 });
  assert.equal(r.metadata.model, 'alertness');
  assert.equal(r.values.length, Math.floor(172800 * 0.01) + 1);
  var lo = Infinity, hi = -Infinity;
  for (var i = 0; i < r.values.length; i++) { if (r.values[i] < lo) lo = r.values[i]; if (r.values[i] > hi) hi = r.values[i]; }
  assert.ok(hi - lo > 30, 'meaningful circadian swing');
  assert.ok(lo >= 0 && hi <= 100);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/bio-oscillator-wasm && node --test test/alertness.test.mjs`
Expected: FAIL — `Cannot find module '../client/lib/alertness.js'`.

- [ ] **Step 3: Write minimal implementation**

```js
// extensions/bio-oscillator-wasm/client/lib/alertness.js
//
// Two-process model of circadian alertness (Borbély/Achermann + Åkerstedt-style
// harmonic circadian process). Pure, isomorphic, Meteor-free — the single source
// of truth for both the /biomodels "Alertness" model and the Daily Log Sleep-tab
// circadian curve. Output is an alertness index in 0–100 %.

var DEFAULT_SCHEDULE = { bedtime: 22, sleepDuration: 8 };

// Process C — circadian alertness rhythm. Fundamental + 12 h + 8 h harmonics
// create the morning peak, post-lunch dip, and evening peak a single sine cannot.
function processC(h) {
  var w = 2 * Math.PI / 24;
  return Math.cos(w * (h - 16.8))
       + 0.42 * Math.cos(2 * w * (h - 9.5))
       + 0.12 * Math.cos(3 * w * (h - 8.5));
}

function isAsleep(h, schedule) {
  var wake = (schedule.bedtime + schedule.sleepDuration) % 24;
  if (wake > schedule.bedtime) return h >= schedule.bedtime && h < wake;
  return h >= schedule.bedtime || h < wake;
}

// Process S — homeostatic sleep pressure, converged over several days for a fixed
// schedule. Rises toward 1 during wake (tau ~18 h), decays toward 0 during sleep
// (tau ~4 h). Returned as 24 hourly samples.
function homeostaticS(schedule) {
  var tauW = 18.2, tauS = 4.2, dt = 0.25, S = 0.5, day, h;
  for (day = 0; day < 6; day++) {
    for (h = 0; h < 24; h += dt) {
      if (isAsleep(h, schedule)) S += dt * (-(S) / tauS);
      else S += dt * ((1 - S) / tauW);
    }
  }
  var out = new Array(24);
  for (h = 0; h < 24; h += dt) {
    if (isAsleep(h, schedule)) S += dt * (-(S) / tauS);
    else S += dt * ((1 - S) / tauW);
    if (Math.abs(h - Math.round(h)) < 1e-9) out[Math.round(h) % 24] = S;
  }
  return out;
}

function alertnessAt(h, S, gain) {
  var k = 55, base = 52, cGain = 22;
  var a = base + gain * cGain * processC(h) - k * S;
  if (a < 0) a = 0;
  if (a > 100) a = 100;
  return a;
}

export function computeAlertnessCurve(opts) {
  var o = opts || {};
  var schedule = {
    bedtime: (o.bedtime != null) ? o.bedtime : DEFAULT_SCHEDULE.bedtime,
    sleepDuration: (o.sleepDuration != null) ? o.sleepDuration : DEFAULT_SCHEDULE.sleepDuration
  };
  var S = homeostaticS(schedule);
  var pts = [], h;
  for (h = 0; h < 24; h++) pts.push({ x: h, y: alertnessAt(h, S[h], 1) });
  return pts;
}

export function generateAlertness(overrides) {
  var o = overrides || {};
  var amplitude = (o.amplitude != null) ? o.amplitude : 1.0;
  var duration = o.duration || 172800;
  var sampleRate = o.sampleRate || 0.01;
  var schedule = {
    bedtime: (o.bedtime != null) ? o.bedtime : DEFAULT_SCHEDULE.bedtime,
    sleepDuration: (o.sleepDuration != null) ? o.sleepDuration : DEFAULT_SCHEDULE.sleepDuration
  };
  var S = homeostaticS(schedule);
  var n = Math.floor(duration * sampleRate) + 1;
  var time = new Float64Array(n);
  var values = new Float64Array(n);
  for (var i = 0; i < n; i++) {
    var ts = i / sampleRate;
    time[i] = ts;
    var h = (ts / 3600) % 24;
    var h0 = Math.floor(h) % 24, h1 = (h0 + 1) % 24, f = h - Math.floor(h);
    var Sh = S[h0] * (1 - f) + S[h1] * f;
    values[i] = alertnessAt(h, Sh, amplitude);
  }
  return {
    time: time,
    values: values,
    metadata: {
      duration: duration, sampleRate: sampleRate, numSamples: n,
      engine: 'javascript', model: 'alertness',
      frequency: o.frequency || 1.157e-5, amplitude: amplitude
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/bio-oscillator-wasm && node --test test/alertness.test.mjs`
Expected: PASS (2 tests). If a shape assertion fails, tune the `processC` phase offsets/weights and `alertnessAt` constants (`base`, `cGain`, `k`) until the morning/evening peaks straddle the afternoon dip and night is the global low — the physiology to preserve is bimodal-daytime + single night trough.

- [ ] **Step 5: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add client/lib/alertness.js test/alertness.test.mjs && git commit -m "feat(biomodels): two-process circadian alertness model"
```

---

### Task 2: ECG (McSharry) generator

**Files:**
- Modify: `extensions/bio-oscillator-wasm/client/lib/waveformGenerators.js` (add `ecg` preset to `MODEL_PRESETS`; add `ecgDeriv` + `generateEcg`; add dispatch case)
- Test: `extensions/bio-oscillator-wasm/test/ecg.test.mjs`

**Interfaces:**
- Consumes: `integrateAndSample` (existing, same file).
- Produces: `generateEcg(overrides) -> { time, values, metadata }`; `generateWaveform('ecg', params)` returns the same; `MODEL_PRESETS.ecg`.

- [ ] **Step 1: Write the failing test**

```js
// extensions/bio-oscillator-wasm/test/ecg.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { generateEcg, generateWaveform, MODEL_PRESETS } from '../client/lib/waveformGenerators.js';

test('ecg preset exists with mV unit', function() {
  assert.ok(MODEL_PRESETS.ecg);
  assert.equal(MODEL_PRESETS.ecg.unit, 'mV');
});

test('ecg has a dominant R peak near +1 mV and a smaller upright T wave', function() {
  var r = generateEcg({ frequency: 1.0, amplitude: 1.0, duration: 4, sampleRate: 250 });
  assert.equal(r.metadata.model, 'ecg');
  var vals = r.values, i, peak = -Infinity, trough = Infinity;
  for (i = 0; i < vals.length; i++) { if (vals[i] > peak) peak = vals[i]; if (vals[i] < trough) trough = vals[i]; }
  assert.ok(peak >= 0.8 && peak <= 1.6, 'R peak ~1 mV, got ' + peak);
  assert.ok(trough < -0.05, 'S/Q negative deflection present, got ' + trough);
  assert.ok(Math.abs(peak) > Math.abs(trough), 'R dominates the trace');
});

test('ecg dispatch matches direct generator', function() {
  var a = generateEcg({ frequency: 1.2, amplitude: 1, duration: 2, sampleRate: 250 });
  var b = generateWaveform('ecg', { frequency: 1.2, amplitude: 1, duration: 2, sampleRate: 250 });
  assert.equal(a.values.length, b.values.length);
  assert.equal(a.values[100], b.values[100]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/bio-oscillator-wasm && node --test test/ecg.test.mjs`
Expected: FAIL — `generateEcg` is not exported / `MODEL_PRESETS.ecg` undefined.

- [ ] **Step 3: Write minimal implementation**

Add to `MODEL_PRESETS` (after the `breathing` entry, before the closing `}`):

```js
  ,ecg: {
    id: 'ecg',
    name: 'ECG (Lead II)',
    oscillator: 'ecg',
    frequency: 1.0,             // 1 Hz = 60 bpm
    amplitude: 1.0,             // scales R-wave height (mV)
    duration: 10,
    sampleRate: 250,
    unit: 'mV',
    readout: 'ECG potential',
    loincSystem: 'urn:iso:std:iso:11073:10101',
    loincCode: 'MDC_ECG_ELEC_POTL',
    loincDisplay: 'ECG electrical potential',
    paramLabels: { frequency: 'Heart rate (Hz)', amplitude: 'R-wave (x)' }
  }
```

Add the generator (after `generateBreathing`, before the CUSTOM section):

```js
// =============================================================================
// MODEL 4 — ECG: McSharry-Clifford dynamical ECG model (3-state limit cycle)
// =============================================================================
// (x, y) trace the unit circle at angular velocity w = 2*pi*HR; theta = atan2(y,x).
// The ECG trace z is pushed by five Gaussian "events" P,Q,R,S,T placed at fixed
// angles, and relaxes toward the isoelectric baseline. Yields true PQRST
// morphology. Reference: McSharry et al. (2003), IEEE TBME.

var ECG_EVENTS = [
  // [theta(rad), a, b]  — P, Q, R, S, T
  [-70 * Math.PI / 180,  1.2, 0.25],
  [-15 * Math.PI / 180, -5.0, 0.10],
  [  0 * Math.PI / 180, 30.0, 0.10],
  [ 15 * Math.PI / 180, -7.5, 0.10],
  [100 * Math.PI / 180,  0.75, 0.40]
];

function ecgDeriv(hr) {
  var w = 2 * Math.PI * hr;
  return function(t, y) {
    var x = y[0], yy = y[1], z = y[2];
    var alpha = 1 - Math.sqrt(x * x + yy * yy);
    var theta = Math.atan2(yy, x);
    var dz = -(z - 0);
    for (var i = 0; i < ECG_EVENTS.length; i++) {
      var dth = theta - ECG_EVENTS[i][0];
      dth = Math.atan2(Math.sin(dth), Math.cos(dth)); // wrap to [-pi, pi]
      var b = ECG_EVENTS[i][2];
      dz -= ECG_EVENTS[i][1] * dth * Math.exp(-(dth * dth) / (2 * b * b));
    }
    return [alpha * x - w * yy, alpha * yy + w * x, dz];
  };
}

export function generateEcg(overrides) {
  var p = MODEL_PRESETS.ecg;
  var o = overrides || {};
  var amplitude = (o.amplitude != null) ? o.amplitude : p.amplitude;
  var duration = o.duration || p.duration;
  var sampleRate = o.sampleRate || p.sampleRate;
  var hr = (o.frequency && o.frequency > 0) ? o.frequency : p.frequency;

  var result = integrateAndSample({
    deriv: ecgDeriv(hr),
    y0: [-1.0, 0.0, 0.0],       // start on the cycle at the P-region
    duration: duration,
    sampleRate: sampleRate,
    modelMaxDt: 0.001,          // 1 ms — resolve the narrow QRS
    timeScale: 1,
    warmup: (1 / hr) * 3,       // settle a few beats
    readoutRaw: function(t, y) { return y[2]; },
    scale: function(v) { return v; }
  });

  // Normalise so the R peak equals amplitude * 1.0 mV; baseline stays at 0.
  var vals = result.values, i, peak = 0;
  for (i = 0; i < vals.length; i++) { if (vals[i] > peak) peak = vals[i]; }
  var g = (peak > 0) ? (amplitude * 1.0 / peak) : 1;
  for (i = 0; i < vals.length; i++) { vals[i] *= g; }

  result.metadata.frequency = hr;
  result.metadata.amplitude = amplitude;
  result.metadata.model = 'ecg';
  result.metadata.heartRateBpm = hr * 60.0;
  return result;
}
```

Add the dispatch case in `generateWaveform` (before `default:`):

```js
    case 'ecg':
      return generateEcg(params);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/bio-oscillator-wasm && node --test test/ecg.test.mjs`
Expected: PASS (3 tests). If the R peak is out of range, the post-normalisation forces it to `amplitude * 1.0`, so a failure there means the trace never goes positive — check event signs. If no negative trough, widen the Q/S window or check the angle wrapping.

- [ ] **Step 5: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add client/lib/waveformGenerators.js test/ecg.test.mjs && git commit -m "feat(biomodels): McSharry dynamical ECG model (PQRST)"
```

---

### Task 3: Capnograph generator

**Files:**
- Modify: `extensions/bio-oscillator-wasm/client/lib/waveformGenerators.js` (add `capnograph` preset; add `capnoTarget` + `capnoDeriv` + `generateCapnograph`; add dispatch case)
- Test: `extensions/bio-oscillator-wasm/test/capnograph.test.mjs`

**Interfaces:**
- Consumes: `integrateAndSample`.
- Produces: `generateCapnograph(overrides) -> { time, values, metadata }`; `generateWaveform('capnograph', params)`; `MODEL_PRESETS.capnograph`.

- [ ] **Step 1: Write the failing test**

```js
// extensions/bio-oscillator-wasm/test/capnograph.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { generateCapnograph, generateWaveform, MODEL_PRESETS } from '../client/lib/waveformGenerators.js';

test('capnograph preset exists with mm[Hg] unit', function() {
  assert.ok(MODEL_PRESETS.capnograph);
  assert.equal(MODEL_PRESETS.capnograph.unit, 'mm[Hg]');
});

test('capnograph reaches an ~38 mmHg alveolar plateau and returns to baseline each breath', function() {
  var r = generateCapnograph({ frequency: 0.25, amplitude: 1.0, duration: 30, sampleRate: 50 });
  assert.equal(r.metadata.model, 'capnograph');
  var vals = r.values, i, peak = -Infinity, trough = Infinity;
  for (i = 0; i < vals.length; i++) { if (vals[i] > peak) peak = vals[i]; if (vals[i] < trough) trough = vals[i]; }
  assert.ok(peak >= 34 && peak <= 42, 'etCO2 plateau ~38 mmHg, got ' + peak);
  assert.ok(trough <= 3, 'inspiratory baseline near 0, got ' + trough);

  // Phase III plateau: a sustained run of samples within 10% of etCO2.
  var nearPlateau = 0;
  for (i = 0; i < vals.length; i++) { if (vals[i] > 0.9 * peak) nearPlateau++; }
  assert.ok(nearPlateau > vals.length * 0.15, 'a sustained alveolar plateau exists');
});

test('capnograph dispatch matches direct generator', function() {
  var a = generateCapnograph({ frequency: 0.25, amplitude: 1, duration: 8, sampleRate: 50 });
  var b = generateWaveform('capnograph', { frequency: 0.25, amplitude: 1, duration: 8, sampleRate: 50 });
  assert.equal(a.values[200], b.values[200]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/bio-oscillator-wasm && node --test test/capnograph.test.mjs`
Expected: FAIL — `generateCapnograph` undefined.

- [ ] **Step 3: Write minimal implementation**

Add to `MODEL_PRESETS` (after the `ecg` entry):

```js
  ,capnograph: {
    id: 'capnograph',
    name: 'Capnograph',
    oscillator: 'capnograph',
    frequency: 0.25,            // 0.25 Hz = 15 breaths/min
    amplitude: 1.0,             // scales etCO2
    duration: 30,
    sampleRate: 50,
    unit: 'mm[Hg]',
    readout: 'Expired CO2 (etCO2)',
    etco2: 38,                  // end-tidal CO2 target (mmHg) at amplitude 1
    expFraction: 0.65,          // expiratory fraction of the breath
    plateauSlope: 0.06,         // phase III upslope (fraction of etCO2)
    tauUp: 0.04,                // expiratory-upstroke time constant (s)
    tauDown: 0.04,              // inspiratory-downstroke time constant (s)
    loincSystem: 'urn:iso:std:iso:11073:10101',
    loincCode: 'MDC_AWAY_CO2_ET',
    loincDisplay: 'Airway end-tidal CO2',
    paramLabels: { frequency: 'Resp. rate (Hz)', amplitude: 'etCO2 (x)' }
  }
```

Add the generator (after `generateEcg`):

```js
// =============================================================================
// MODEL 5 — CAPNOGRAPH: 4-phase expired-CO2 morphology
// =============================================================================
// A first-order tracker dC/dt = (target(phase) - C)/tau produces the four
// textbook capnogram phases: I inspiratory baseline (~0), II expiratory upstroke
// (fast rise), III alveolar plateau (slow upslope to etCO2), 0 inspiratory
// downstroke (fast fall). State [C] (mmHg), time in seconds.

function capnoTarget(period, expFraction, etco2, plateauSlope) {
  var tExp = expFraction * period;
  return function(t) {
    var phi = t % period;
    if (phi < 0) phi += period;
    if (phi < tExp) {
      var frac = phi / tExp;                    // 0..1 across expiration
      return etco2 * (1 + plateauSlope * frac); // slight phase-III upslope
    }
    return 0.0;                                  // inspiration: fresh gas
  };
}

function capnoDeriv(period, expFraction, etco2, plateauSlope, tauUp, tauDown) {
  var target = capnoTarget(period, expFraction, etco2, plateauSlope);
  var tExp = expFraction * period;
  return function(t, y) {
    var c = y[0];
    var phi = t % period;
    if (phi < 0) phi += period;
    var tau = (phi < tExp) ? tauUp : tauDown;
    return [(target(t) - c) / tau];
  };
}

export function generateCapnograph(overrides) {
  var p = MODEL_PRESETS.capnograph;
  var o = overrides || {};
  var amplitude = (o.amplitude != null) ? o.amplitude : p.amplitude;
  var duration = o.duration || p.duration;
  var sampleRate = o.sampleRate || p.sampleRate;
  var rr = (o.frequency && o.frequency > 0) ? o.frequency : p.frequency;
  var period = 1.0 / rr;
  var etco2 = p.etco2 * amplitude;

  var result = integrateAndSample({
    deriv: capnoDeriv(period, p.expFraction, etco2, p.plateauSlope, p.tauUp, p.tauDown),
    y0: [0.0],
    duration: duration,
    sampleRate: sampleRate,
    modelMaxDt: 0.002,
    timeScale: 1,
    warmup: period * 4,
    readoutRaw: function(t, y) { return y[0]; },
    scale: function(v) { return v; }
  });

  result.metadata.frequency = rr;
  result.metadata.amplitude = amplitude;
  result.metadata.model = 'capnograph';
  result.metadata.respRateBpm = rr * 60.0;
  return result;
}
```

Add the dispatch case in `generateWaveform` (before `default:`):

```js
    case 'capnograph':
      return generateCapnograph(params);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/bio-oscillator-wasm && node --test test/capnograph.test.mjs`
Expected: PASS (3 tests). If the plateau overshoots, reduce `plateauSlope`; if the upstroke/downstroke look too rounded, reduce `tauUp`/`tauDown`.

- [ ] **Step 5: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add client/lib/waveformGenerators.js test/capnograph.test.mjs && git commit -m "feat(biomodels): 4-phase capnograph (etCO2) model"
```

---

### Task 4: Alertness dispatch + FHIR mapping + server model list

**Files:**
- Modify: `extensions/bio-oscillator-wasm/client/lib/waveformGenerators.js` (import `generateAlertness` from `./alertness.js`; add `alertness` preset; add dispatch case)
- Modify: `extensions/bio-oscillator-wasm/client/lib/fhirMapper.js` (use `preset.loincSystem`; add `describeModel` cases)
- Modify: `extensions/bio-oscillator-wasm/server/methods.js` (add three models to `biomodels.getModels` return — locate the array and append)
- Test: `extensions/bio-oscillator-wasm/test/presets.test.mjs`

**Interfaces:**
- Consumes: `generateAlertness` (Task 1), `MODEL_PRESETS.ecg`/`.capnograph` (Tasks 2–3).
- Produces: `generateWaveform('alertness', params)`; `MODEL_PRESETS.alertness`; `waveformToObservation` emitting correct `system`/`unit` for all six models.

- [ ] **Step 1: Write the failing test**

```js
// extensions/bio-oscillator-wasm/test/presets.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { generateWaveform, MODEL_PRESETS } from '../client/lib/waveformGenerators.js';
import { waveformToObservation } from '../client/lib/fhirMapper.js';

test('all six model keys are present', function() {
  ['circadian', 'alertness', 'heartbeat', 'ecg', 'breathing', 'capnograph'].forEach(function(k) {
    assert.ok(MODEL_PRESETS[k], 'missing preset ' + k);
  });
});

test('alertness dispatches and maps to a % observation', function() {
  var r = generateWaveform('alertness', { duration: 86400, sampleRate: 0.01 });
  assert.equal(r.metadata.model, 'alertness');
  var obs = waveformToObservation(r, 'alertness');
  assert.equal(obs.valueSampledData.origin.unit, '%');
});

test('ecg observation uses the MDC system and mV unit', function() {
  var r = generateWaveform('ecg', { duration: 2, sampleRate: 250 });
  var obs = waveformToObservation(r, 'ecg');
  assert.equal(obs.code.coding[0].system, 'urn:iso:std:iso:11073:10101');
  assert.equal(obs.valueSampledData.origin.unit, 'mV');
});

test('existing circadian model still maps to LOINC body temperature', function() {
  var r = generateWaveform('circadian', { duration: 86400, sampleRate: 0.01 });
  var obs = waveformToObservation(r, 'circadian');
  assert.equal(obs.code.coding[0].system, 'http://loinc.org');
  assert.equal(obs.code.coding[0].code, '8310-5');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/bio-oscillator-wasm && node --test test/presets.test.mjs`
Expected: FAIL — `MODEL_PRESETS.alertness` undefined and/or ecg system is `http://loinc.org`.

- [ ] **Step 3: Write minimal implementation**

In `waveformGenerators.js`, add the import at the top (after the header comment, before `MODEL_PRESETS`):

```js
import { generateAlertness } from './alertness.js';
```

Add to `MODEL_PRESETS` (after `capnograph`):

```js
  ,alertness: {
    id: 'alertness',
    name: 'Circadian Alertness',
    oscillator: 'alertness',
    frequency: 1.157e-5,        // ~1 cycle / 24 h
    amplitude: 1.0,
    duration: 172800,
    sampleRate: 0.01,
    unit: '%',
    readout: 'Alertness index',
    loincSystem: 'https://orbital.health/biomodels',
    loincCode: 'alertness-index',
    loincDisplay: 'Circadian alertness index',
    paramLabels: { frequency: 'Cycle rate (Hz)', amplitude: 'Alertness swing (x)' }
  }
```

Add the dispatch case in `generateWaveform` (before `default:`):

```js
    case 'alertness':
      return generateAlertness(params);
```

In `fhirMapper.js`, extend `describeModel`:

```js
    case 'ecg':
      return 'McSharry dynamical ECG model (PQRST limit cycle)';
    case 'capnograph':
      return 'first-order 4-phase expired-CO2 (capnogram) model';
    case 'alertness':
      return 'two-process circadian alertness model';
```

In `fhirMapper.js`, change the coding `system` to honour `preset.loincSystem` (replace the hardcoded system line in the `coding` object):

```js
      coding: [{
        system: preset.loincSystem || 'http://loinc.org',
        code: preset.loincCode,
        display: preset.loincDisplay
      }],
```

In `server/methods.js`, locate the array returned by `biomodels.getModels` and append entries mirroring the new presets (keep whatever field shape the existing entries use; typical form):

```js
      { id: 'ecg', name: 'ECG (Lead II)', unit: 'mV' },
      { id: 'capnograph', name: 'Capnograph', unit: 'mm[Hg]' },
      { id: 'alertness', name: 'Circadian Alertness', unit: '%' }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/bio-oscillator-wasm && node --test test/presets.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Run the whole suite (regression guard)**

Run: `cd extensions/bio-oscillator-wasm && node --test test/`
Expected: all `.test.mjs` pass; the existing three models are exercised through `presets.test.mjs`/`ecg`/`capnograph` dispatch checks. (If `node --test test/` does not discover files on this Node build, run each file explicitly.)

- [ ] **Step 6: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add client/lib/waveformGenerators.js client/lib/fhirMapper.js server/methods.js test/presets.test.mjs && git commit -m "feat(biomodels): wire alertness dispatch + FHIR mapping for all six models"
```

---

### Task 5: Two-level model selector + control-band alignment

**Files:**
- Modify: `extensions/bio-oscillator-wasm/client/lib/waveformGenerators.js` (export `MODEL_CATEGORIES`)
- Modify: `extensions/bio-oscillator-wasm/client/components/WaveformControls.jsx` (full controls-row rewrite)
- Modify: `extensions/bio-oscillator-wasm/client/BiomodelsPage.jsx` (default model + info-alert copy)
- Test: `extensions/bio-oscillator-wasm/test/categories.test.mjs`

**Interfaces:**
- Consumes: `MODEL_PRESETS` (keys), preset `paramLabels`/`readout`/`unit`.
- Produces: `MODEL_CATEGORIES: Array<{ id, label, signals: Array<{ key, label }> }>`.

- [ ] **Step 1: Write the failing test**

```js
// extensions/bio-oscillator-wasm/test/categories.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';
import { MODEL_CATEGORIES, MODEL_PRESETS } from '../client/lib/waveformGenerators.js';

test('three categories, each with two signals, all keys valid presets', function() {
  assert.equal(MODEL_CATEGORIES.length, 3);
  var seen = [];
  MODEL_CATEGORIES.forEach(function(cat) {
    assert.equal(cat.signals.length, 2, cat.id + ' should have 2 signals');
    cat.signals.forEach(function(s) {
      assert.ok(MODEL_PRESETS[s.key], 'signal key ' + s.key + ' has no preset');
      seen.push(s.key);
    });
  });
  ['circadian', 'alertness', 'heartbeat', 'ecg', 'breathing', 'capnograph'].forEach(function(k) {
    assert.ok(seen.indexOf(k) !== -1, 'category map missing ' + k);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd extensions/bio-oscillator-wasm && node --test test/categories.test.mjs`
Expected: FAIL — `MODEL_CATEGORIES` undefined.

- [ ] **Step 3: Add `MODEL_CATEGORIES`**

At the end of `waveformGenerators.js` (after `MODEL_PRESETS`, anywhere top-level), add:

```js
// Category → signal grouping for the two-level selector.
export const MODEL_CATEGORIES = [
  { id: 'circadian', label: 'Circadian', signals: [
    { key: 'circadian', label: 'Core temp' },
    { key: 'alertness', label: 'Alertness' }
  ] },
  { id: 'cardiac', label: 'Cardiac', signals: [
    { key: 'heartbeat', label: 'Arterial pressure' },
    { key: 'ecg', label: 'ECG' }
  ] },
  { id: 'respiratory', label: 'Respiratory', signals: [
    { key: 'breathing', label: 'Lung volume' },
    { key: 'capnograph', label: 'Capnograph' }
  ] }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd extensions/bio-oscillator-wasm && node --test test/categories.test.mjs`
Expected: PASS.

- [ ] **Step 5: Rewrite the controls row (two-level + alignment)**

Replace the body of `WaveformControls.jsx` from the `import` list through the component with the following. It (a) derives the active category from `selectedModel`, (b) renders a category toggle + a signal toggle, (c) lays out captions / controls / readouts on three fixed bands so the toggles, fields, Engine group and GENERATE share one aligned control band.

```jsx
// bio-oscillator-wasm/client/components/WaveformControls.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent,
  Box, Button, TextField, Tooltip,
  ToggleButton, ToggleButtonGroup,
  Typography
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { MODEL_PRESETS, MODEL_CATEGORIES } from '../lib/waveformGenerators.js';

// Column wrapper: caption band (fixed) / control band (aligned) / readout band (fixed).
function ControlColumn(props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" color="text.secondary" sx={{ height: 18, lineHeight: '18px', display: 'block' }}>
        {props.caption || ' '}
      </Typography>
      <Box sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
        {props.children}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ height: 18, lineHeight: '18px', display: 'block' }}>
        {props.readout || ' '}
      </Typography>
    </Box>
  );
}

function categoryOfModel(modelKey) {
  for (var i = 0; i < MODEL_CATEGORIES.length; i++) {
    var cat = MODEL_CATEGORIES[i];
    for (var j = 0; j < cat.signals.length; j++) {
      if (cat.signals[j].key === modelKey) return cat;
    }
  }
  return MODEL_CATEGORIES[0];
}

function WaveformControls(props) {
  var selectedModel = props.selectedModel;
  var onModelChange = props.onModelChange;
  var duration = props.duration;
  var onDurationChange = props.onDurationChange;
  var sampleRate = props.sampleRate;
  var onSampleRateChange = props.onSampleRateChange;
  var frequency = props.frequency;
  var onFrequencyChange = props.onFrequencyChange;
  var amplitude = props.amplitude;
  var onAmplitudeChange = props.onAmplitudeChange;
  var engine = props.engine;
  var onEngineChange = props.onEngineChange;
  var wasmAvailable = props.wasmAvailable;
  var onGenerate = props.onGenerate;
  var generationTime = props.generationTime;

  var activePreset = MODEL_PRESETS[selectedModel] || {};
  var paramLabels = activePreset.paramLabels || {};
  var frequencyLabel = paramLabels.frequency || 'Frequency (Hz)';
  var amplitudeLabel = paramLabels.amplitude || 'Amplitude';

  var activeCategory = categoryOfModel(selectedModel);

  function applyPreset(key) {
    var preset = MODEL_PRESETS[key];
    if (preset) {
      onDurationChange(preset.duration);
      onSampleRateChange(preset.sampleRate);
      onFrequencyChange(preset.frequency);
      onAmplitudeChange(preset.amplitude);
    }
  }

  function handleCategoryChange(event, newCatId) {
    if (newCatId !== null) {
      var cat = MODEL_CATEGORIES.filter(function(c) { return c.id === newCatId; })[0];
      if (cat) {
        var firstKey = cat.signals[0].key;
        onModelChange(firstKey);
        applyPreset(firstKey);
      }
    }
  }

  function handleSignalChange(event, newKey) {
    if (newKey !== null) {
      onModelChange(newKey);
      applyPreset(newKey);
    }
  }

  function handleEngineChange(event, newEngine) {
    if (newEngine !== null) onEngineChange(newEngine);
  }

  return (
    <Card sx={{ bgcolor: 'background.paper', mb: 2 }}>
      <CardHeader title="Waveform Controls" titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Category */}
          <ControlColumn caption="Category">
            <ToggleButtonGroup value={activeCategory.id} exclusive onChange={handleCategoryChange} size="small">
              {MODEL_CATEGORIES.map(function(cat) {
                return <ToggleButton key={cat.id} value={cat.id}>{cat.label}</ToggleButton>;
              })}
            </ToggleButtonGroup>
          </ControlColumn>

          {/* Signal within category */}
          <ControlColumn caption="Signal" readout={activePreset.readout ? activePreset.readout + ' (' + activePreset.unit + ')' : ''}>
            <ToggleButtonGroup value={selectedModel} exclusive onChange={handleSignalChange} size="small">
              {activeCategory.signals.map(function(s) {
                return <ToggleButton key={s.key} value={s.key}>{s.label}</ToggleButton>;
              })}
            </ToggleButtonGroup>
          </ControlColumn>

          {/* Duration */}
          <ControlColumn caption="Duration (s)">
            <TextField type="number" size="small" value={duration}
              onChange={function(e) { onDurationChange(parseFloat(e.target.value) || 0); }}
              sx={{ width: 120 }} />
          </ControlColumn>

          {/* Sample Rate */}
          <ControlColumn caption="Sample Rate (Hz)">
            <TextField type="number" size="small" value={sampleRate}
              onChange={function(e) { onSampleRateChange(parseFloat(e.target.value) || 1); }}
              sx={{ width: 140 }} />
          </ControlColumn>

          {/* Rate knob */}
          <ControlColumn caption={frequencyLabel}>
            <TextField type="number" size="small" value={frequency}
              onChange={function(e) { onFrequencyChange(parseFloat(e.target.value) || 0); }}
              inputProps={{ step: 'any' }} sx={{ width: 150 }} />
          </ControlColumn>

          {/* Amplitude */}
          <ControlColumn caption={amplitudeLabel}>
            <TextField type="number" size="small" value={amplitude}
              onChange={function(e) { onAmplitudeChange(parseFloat(e.target.value) || 0); }}
              inputProps={{ step: 'any' }} sx={{ width: 140 }} />
          </ControlColumn>

          {/* Engine */}
          <ControlColumn caption="Engine">
            <ToggleButtonGroup value={engine} exclusive onChange={handleEngineChange} size="small">
              <ToggleButton value="javascript">JavaScript</ToggleButton>
              <Tooltip title={wasmAvailable ? 'WASM engine loaded' : 'WASM not available (pre-built artifacts required)'}>
                <span><ToggleButton value="wasm" disabled={!wasmAvailable}>WASM</ToggleButton></span>
              </Tooltip>
            </ToggleButtonGroup>
          </ControlColumn>

          {/* Generate */}
          <ControlColumn caption="" readout={generationTime !== null ? 'Generated in ' + generationTime + 'ms (' + engine + ')' : ''}>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={onGenerate} sx={{ height: 40 }}>
              Generate
            </Button>
          </ControlColumn>

        </Box>
      </CardContent>
    </Card>
  );
}

export default WaveformControls;
```

- [ ] **Step 6: Update the page default + info copy**

In `BiomodelsPage.jsx`, the info `Alert` copy (lines ~104–110) still describes only three models. Replace its text with a version that mentions all six pairs, e.g.:

```jsx
        Biological signal simulation engine for space health. Six limit-cycle / kinetic
        biomodels in three pairs: Circadian (Kronauer–Jewett core-temperature pacemaker +
        two-process alertness), Cardiac (3-element Windkessel arterial pressure + McSharry
        PQRST ECG), and Respiratory (single-compartment lung volume + 4-phase capnograph).
        Compare @nivo/line, Chart.js, and Canvas 2D rendering. WASM parity for the ECG,
        capnograph, and alertness models is pending; those run on the JavaScript engine.
```

(The default `selectedModel` may stay `'heartbeat'`; the two-level selector will show it under the Cardiac category automatically.)

- [ ] **Step 7: Manual verification**

Run the app with the workflow enabled and load `/biomodels`:

```bash
EXTRA_WORKFLOWS=@orbital/bio-oscillator-wasm meteor run --settings settings/settings.honeycomb.localhost.json
```

Confirm: (a) Category toggle shows Circadian / Cardiac / Respiratory; switching category swaps the Signal toggle to that pair and applies preset defaults; (b) Category toggle, Signal toggle, all numeric fields, Engine toggle, and GENERATE sit on one aligned row (captions above, readout/timing below — no vertical offset); (c) each of the six signals generates and renders in all three charts; (d) ECG shows P/QRS/T, capnograph shows the four phases, alertness is bimodal.

- [ ] **Step 8: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add client/lib/waveformGenerators.js client/components/WaveformControls.jsx client/BiomodelsPage.jsx test/categories.test.mjs && git commit -m "feat(biomodels): two-level category/signal selector + aligned control band"
```

---

### Task 6: Unify the Daily Log Sleep-tab curve with the alertness model

**Files:**
- Modify: `extensions/bio-oscillator-wasm/package.json` (add `./alertness` export)
- Modify: `extensions/orbital/client/daily-log/SleepTabContent.jsx` (source the curve from `computeAlertnessCurve` via graceful require; fall back to the static table)

**Interfaces:**
- Consumes: `computeAlertnessCurve` (Task 1) via subpath `@orbital/bio-oscillator-wasm/alertness`.

- [ ] **Step 1: Add the package export**

In `extensions/bio-oscillator-wasm/package.json`, add to the `exports` map:

```json
    "./alertness": "./client/lib/alertness.js",
```

- [ ] **Step 2: Source the curve gracefully in SleepTabContent**

In `SleepTabContent.jsx`, add a graceful require near the top (after imports), mirroring orbital's existing `lunar-maps` try/catch pattern:

```jsx
// Prefer the shared two-process alertness model; fall back to the static table
// if the @orbital/bio-oscillator-wasm extension isn't installed.
var computeAlertnessCurve = null;
try {
  computeAlertnessCurve = require('@orbital/bio-oscillator-wasm/alertness').computeAlertnessCurve;
} catch (e) {
  console.log('[SleepTabContent] alertness model unavailable, using static curve');
}
```

Then change `buildCircadianChartData(sleepDuration)` to prefer the model. Replace the `alertnessLine` construction (lines ~62–67) with:

```jsx
  var curve;
  if (computeAlertnessCurve) {
    var durNum = parseFloat(sleepDuration);
    curve = computeAlertnessCurve({
      bedtime: 22,
      sleepDuration: (durNum > 0 && durNum <= 24) ? durNum : 8
    });
  } else {
    curve = CIRCADIAN_DATA;
  }
  var alertnessLine = {
    id: 'Alertness',
    data: curve.map(function(pt) { return { x: pt.x, y: pt.y }; })
  };
```

(Keep the existing `CIRCADIAN_DATA` table as the fallback and the sleep-window shading logic unchanged.)

- [ ] **Step 3: Manual verification**

With `EXTRA_WORKFLOWS=@orbital/bio-oscillator-wasm,@node-on-fhir/orbital` and the app running, open `/daily-log?tab=sleep`. Confirm the Circadian Alertness Curve still renders (bimodal), and that changing "Sleep duration (hours)" shifts the curve (the homeostatic component responds). Temporarily rename the export to confirm the fallback path logs and still renders the static curve, then restore it.

- [ ] **Step 4: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add package.json && git commit -m "feat(biomodels): export ./alertness for cross-extension reuse"
cd ../orbital && git add client/daily-log/SleepTabContent.jsx && git commit -m "feat(daily-log): drive Sleep alertness curve from the shared two-process model"
```

---

### Task 7: Documentation

**Files:**
- Modify: `extensions/bio-oscillator-wasm/CLAUDE.md`

- [ ] **Step 1: Update the model table**

Replace the three-row BioModels table with six rows in three categories (Circadian: Core temp `circadian` + Alertness `alertness`; Cardiac: Arterial pressure `heartbeat` + ECG `ecg`; Respiratory: Lung volume `breathing` + Capnograph `capnograph`), each with its dynamical system, state, readout/unit, rate knob, defaults, and LOINC/MDC/local code.

- [ ] **Step 2: Update the roadmap**

In Phase C, check off **ECG waveform — McSharry dynamical model** and add **Capnograph — 4-phase expired CO₂** as done. Note that Rust/WASM parity for the three new models is the outstanding follow-up (Phase B/parity).

- [ ] **Step 3: Document the new architecture**

Add short subsections: (a) the two-level category/signal selector and `MODEL_CATEGORIES`; (b) `client/lib/alertness.js` as the standalone two-process module and single source of truth, exported via `./alertness`; (c) the Daily Log Sleep-tab unification through a graceful require with static fallback; (d) the JS test harnesses under `test/*.test.mjs` run with `node --test`.

- [ ] **Step 4: Commit** (only if the operator asked to commit)

```bash
cd extensions/bio-oscillator-wasm && git add CLAUDE.md && git commit -m "docs(biomodels): document six-model roster, selector, alertness module, tests"
```

---

## Follow-up (out of scope, track separately)

- Port `alertness` / `ecg` / `capnograph` to `rust/src/waveforms/mod.rs` + `lib.rs` dispatch, rebuild WASM via `scripts/build-wasm.sh`, and extend the JS↔WASM parity harness to the three new models. Re-enable the WASM toggle for them and remove the "JS only" note.

## Notes / open items resolved here

- **LOINC/MDC codes:** ECG → IEEE 11073 `MDC_ECG_ELEC_POTL`; capnograph → `MDC_AWAY_CO2_ET`; alertness → local `https://orbital.health/biomodels|alertness-index` (no standard vital LOINC for a derived alertness score). These are honest, real nomenclature terms; swap to organisation-preferred codes if desired.
- **Alertness/old-table equivalence:** the Sleep tab now *derives* from the model, so there is no fixed target table to match; tests assert bimodal shape + physiological range instead.
- **"Both outputs" for circadian** is realised as the two signals under the Circadian category (Core temp `circadian` + Alertness `alertness`) in the two-level selector — not as a dual-axis overlay on one chart (cleaner: temp is Cel, alertness is %, different scales).
- **Core-temperature refinement deferred (optional):** the spec floated lightly sharpening the CBT trough with a 2nd harmonic. Deferred — the existing Kronauer–Jewett `x^7` term already makes the trough non-sinusoidal, and touching the limit-cycle risks destabilising it. Revisit only if the temp curve still reads as a plain sine after the alertness work lands.
- **WASM scope:** this plan **defers** the Rust/WASM port (per the approved design). If lockstep JS+Rust+WASM is actually wanted, the Follow-up section becomes in-scope and each generator task doubles (mirror in `rust/src/waveforms/mod.rs`, rebuild, parity-test).

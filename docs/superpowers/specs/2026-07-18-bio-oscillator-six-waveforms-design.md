# BioModels: six waveforms in three physiological pairs

**Date:** 2026-07-18
**Package:** `@orbital/bio-oscillator-wasm` (`extensions/bio-oscillator-wasm/`), route `/biomodels`
**Downstream:** `@node-on-fhir/orbital` Daily Log → Sleep tab

## Problem

The `/biomodels` page ships three limit-cycle biomodels — circadian (core body
temperature), pulse (arterial pressure), breathing (lung volume). Three gaps:

1. **Circadian** looks like a plain sine and is less rich than the Daily Log
   Sleep tab's bimodal "alertness" curve. But that curve is a *different signal*:
   alertness is bimodal (two-process), core body temperature is single-cycle. So
   "match it" means adding an alertness channel, not distorting temperature.
2. **Pulse** is arterial pressure (mm[Hg], Windkessel) but the user wants a true
   **ECG** morphology (P wave / QRS complex / T wave, electrical, mV).
3. **Breathing** is lung volume (L); the user wants a **capnograph** (expired
   CO₂, mm[Hg]) with the four textbook phases.

## Decisions (resolved during brainstorming)

- **Add, don't replace.** ECG and capnograph are *new* models; arterial
  pressure and lung volume stay. Pulse's readout label becomes "Arterial
  pressure" to pair cleanly with ECG.
- **Circadian emits both** core body temperature (primary) and a derived
  alertness channel, and the Daily Log Sleep graph is driven from the same
  alertness function (single source of truth).
- **Two-level model selector**: category (Circadian / Cardiac / Respiratory) +
  signal within the category.
- **WASM parity is a deferred follow-up.** All six models land in JS first (the
  live path); the Rust mirror + `wasm-pack` rebuild + JS↔WASM parity check for
  the three new models is a separate pass. The WASM toggle notes that the new
  models are JS-only until then.
- **Document everything in the extension README/CLAUDE.md.**

## Model roster

Six dispatch keys in three categories:

| Category | Signal (key) | Model | Unit | Rate knob |
|---|---|---|---|---|
| Circadian | Core temp (`circadian`, existing) | Kronauer–Jewett van der Pol pacemaker | Cel | cycle rate → τx |
| Circadian | Alertness (`alertness`, **new**) | Two-process: Åkerstedt C-harmonics + homeostatic S | % | cycles/day |
| Cardiac | Arterial pressure (`heartbeat`, relabeled) | 3-element (RCR) Windkessel | mm[Hg] | HR (Hz) |
| Cardiac | ECG (`ecg`, **new**) | McSharry 3-state dynamical model | mV | HR (Hz) |
| Respiratory | Lung volume (`breathing`, existing) | Single-compartment RC lung | L | RR (Hz) |
| Respiratory | Capnograph (`capnograph`, **new**) | 4-phase expired-CO₂ morphology | mm[Hg] | RR (Hz) |

## New model math

All three plug into the existing `rk4Step` / `integrateAndSample` harness and
`MODEL_PRESETS` table; no changes to the numerical core.

### Alertness — two-process model

- **Process C** (circadian): Åkerstedt-style cosine harmonic expansion, phase
  locked to the same 24 h clock as the CBT pacemaker. Fundamental + a few
  harmonics produce the morning peak → post-lunch dip → evening peak that a
  single sine cannot. Parameters: acrophase, harmonic weights.
- **Process S** (homeostatic): sleep pressure rising exponentially toward an
  asymptote during wake (τ ≈ 18–20 h) and decaying during a sleep window
  (τ ≈ 4–5 h), keyed to a bedtime + sleep-duration window.
- **Output:** `A(t) = scale·(C(t) + S(t)) + offset`, clamped to 0–100 %.
- Exposed as a pure function `computeAlertnessCurve({ bedtime, sleepDuration })`
  returning a 24-point (hour-of-day) template, plus a time-series generator
  `generateAlertness(overrides)` for the biomodels chart.

### ECG — McSharry 3-state dynamical model

- State `(x, y, z)` on the unit circle: `α = 1 − √(x²+y²)`, `ω = 2π·HR`,
  `dx/dt = αx − ωy`, `dy/dt = αy + ωx`.
- `θ = atan2(y, x)`; ECG trace:
  `dz/dt = −Σᵢ aᵢ·Δθᵢ·exp(−Δθᵢ²/2bᵢ²) − (z − z₀)` over events
  `i ∈ {P, Q, R, S, T}` at fixed angles θᵢ with amplitudes aᵢ and widths bᵢ.
- Readout `z` scaled to mV; **rate knob = heart rate**, **amplitude = R-wave
  scale**. Defaults ~10 s / 250 Hz.

### Capnograph — 4-phase expired CO₂

Phase-parameterized morphology over each breath period `T = 1/RR`:

- **Phase I** inspiratory baseline (≈ 0 mm[Hg]).
- **Phase II** expiratory upstroke (steep first-order rise).
- **Phase III** alveolar plateau (slow positive slope toward etCO₂ ≈ 38 mm[Hg]).
- **Phase 0** inspiratory downstroke (steep fall to baseline).

Tunable: RR, etCO₂ (amplitude), plateau slope, phase fractions. Defaults
~30 s / 50 Hz, unit mm[Hg].

## Sleep-graph unification

`SleepTabContent.jsx` (in `@node-on-fhir/orbital`) currently hardcodes a 24-point
`CIRCADIAN_DATA` table. Replace it with `computeAlertnessCurve(...)` so both
screens agree by construction, and so the curve responds to logged sleep
duration. To avoid a hard cross-extension dependency, orbital consumes the
function through a graceful try/catch `require('@orbital/bio-oscillator-wasm/...')`,
falling back to the current static table if the package is absent — mirroring the
existing `lunar-maps` graceful-absence pattern in orbital.

## UI

### Two-level selector
Primary `ToggleButtonGroup`: **Circadian / Cardiac / Respiratory**. A second
small `ToggleButtonGroup` lists the two signals in the chosen category. Changing
either applies preset defaults (duration, sample rate, rate, amplitude), as the
single-level selector does today.

### Control-band alignment
Today the controls row uses `alignItems: center`, so the tall Model box (caption
+ toggle + readout) vertically-centers against the shorter Engine box and the
single-line fields — the visible offset. Restructure to a fixed vertical rhythm:

- **Caption band** (fixed height) — labels.
- **Control band** (aligned) — category toggle, signal toggle, numeric fields,
  Engine toggle, and GENERATE all share this band.
- **Readout band** (fixed height) — the model readout `"<readout> (<unit>)"` and
  the "Generated in Xms" text, so neither pushes the control band.

GENERATE aligns to the control band (not `alignSelf: flex-end`).

## FHIR mapping

`fhirMapper.js` gains `describeModel` cases and `MODEL_PRESETS` entries for the
three new signals:

- **ECG** — unit `mV`; LOINC for a rhythm/lead waveform (confirm exact code in
  plan; candidate: MDC/LOINC lead-II).
- **Capnograph** — unit `mm[Hg]`; end-tidal CO₂ LOINC (confirm exact code).
- **Alertness** — derived score, unit `%`; no vital-sign LOINC — emit as a
  derived observation with `text` and a local/derived code (confirm in plan).

`valueSampledData` shape (origin/period/dimensions/data) is unchanged; each new
model is single-dimension.

## Documentation

Update `extensions/bio-oscillator-wasm/CLAUDE.md`:

- Model table → six rows across three categories.
- Roadmap: check off **ECG waveform** and **O₂/CO₂ gas exchange** (capnograph).
- Extension-point checklist: note the two-level selector and the category→signal
  map.
- Document the Sleep-graph unification and the graceful-require contract.

## Testing

Node harness (matching the existing parity-check convention):

- **ECG**: R-peak well above baseline; P, R, T ordering correct; QRS narrow.
- **Capnograph**: plateau reaches ~38 mm[Hg]; returns to ~0 each breath; four
  phases present.
- **Alertness**: bimodal (two local maxima with a mid-day dip); matches the
  Sleep-tab curve within tolerance.
- **Existing three models**: unchanged output (regression guard).

## Out of scope (this pass)

- Rust/WASM port and rebuild of the three new models (deferred follow-up).
- Multi-lead ECG (I/II/III/aVR/…), noise injection, dicrotic-notch upgrade,
  gas-exchange coupling of lung volume — remain on the roadmap.
- Saving generated observations to MongoDB / patient context.

## Open items (resolve in plan, non-blocking)

1. Exact LOINC/MDC codes for ECG, etCO₂, and the alertness score.
2. Exact flex/grid structure for the control-band alignment.
3. `package.json` `exports` subpath so orbital can `require` the alertness
   function.

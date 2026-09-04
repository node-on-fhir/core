# Apple Health Import Enhancements — Design

**Date:** 2026-09-03
**Branch:** 21st-cures-etl
**Status:** Approved

## Goal

Polish the Apple Health import screen (`/import-data`, FileDropTab Apple Health
mode) and introduce a **reusable FHIR de-identification component + library**
(modeled on the proven `DicomDeidentifyControls` pattern) that the PDF, Data,
and Social-Media importers can adopt later.

## 1. Panel rename + layout (right card)

`FileDropTab.jsx` card header changes from "Patient Assignment" to
**"Data Mapping Preview"**. Content order in `AppleHealthPatientPanel`:

1. Apple Health Profile chips (existing, unchanged)
2. Patient Confirmed alert (name parsing fixed — §3)
3. **Action row**: `SELECT` (opens the existing `PatientSearchDialog` — kept
   as-is) and `DE-IDENTIFY` (toggles `FhirDeidentifyControls` open beneath the
   alert), plus the existing `Clear`. The unselected-practitioner state keeps
   its `Select Patient` button.
4. `FhirDeidentifyControls` (collapsed by default)
5. Import summary table + Import button (existing)

## 2. Data Types table (left card)

In `AppleHealthPreview.jsx`, remove the per-row `Chip` around the display
name; render plain `Typography` preceded by an 8px `Box` circle in the
category color (same `getCategoryBadgeColor` mapping). Legend chips at the
top stay. No other columns change.

## 3. Name-parse fix (Patient Confirmed alert)

Symptom: alert shows the last-resort `Patient <long-id>` fallback, meaning
the resolved patient has neither `name[]` nor flattened name fields.

- **Diagnosis first**: trace what shape the patient-fetch flow (and any other
  Session writer) stores in `selectedPatient`; fix at the source so a proper
  FHIR `name[]` is stored.
- **Hardening**: extract the fallback chain into a shared helper
  `resolvePatientDisplayName(patient)` with unit tests over the known shapes:
  raw FHIR, flattened (FhirDehydrator), `display`-only, patient-fetch-shaped.

## 4. Reusable de-identification (Approach A — core-hosted pair)

### `imports/lib/FhirDeidentify.js` — pure, isomorphic, lodash-only

```js
export const DEFAULT_FHIR_DEID_CONTROLS = {
  deidentifyEnabled: false,
  assignAnonymousPatient: false,   // subject → anon Patient reference
  stripDemographics: false,        // drop DOB/sex/bloodType + device/sourceName metadata
  dateHandling: 'none',            // 'none' | 'truncateToDate' | 'shiftRandom'
  dateShiftDays: null              // computed once per import session when 'shiftRandom'
};

export function applyFhirDeidentification(resources, controls, context) { ... }
```

- Permissive-in/strict-out: unknown resource types pass through untouched.
- `assignAnonymousPatient` rewrites `subject`/`patient` references using
  `context.anonymousPatientRef`.
- `stripDemographics` strips `device`, demographic extensions, and
  source-name fields.
- `dateHandling` coarsens (`truncateToDate`) or shifts
  (`shiftRandom`, one random offset per import run — intervals preserved,
  HIPAA-style) `effectiveDateTime`/`issued`/`period`.

### `imports/ui/components/FhirDeidentifyControls.jsx`

Controlled component, same idiom as `DicomDeidentifyControls`: parent owns
one controls bag, switch + `Collapse`, theme tokens, `id`s on every input.
Includes the "runs entirely in your browser" caption.

### Server method `patients.findOrCreateAnonymous`

Finds a Patient with identifier
`{system: 'http://honeycomb.healthcare/anonymous', value: 'anonymous'}`;
creates it once if absent (name "Anonymous Patient"); returns
`{ _id, id, reference }`. Repeated anonymous imports share one record.
Auth-gated like other patient methods.

## 5. Data flow at import time

`AppleHealthPatientPanel` owns the `deidControls` bag → passes it via
`onImport` options → `FileDropTab.handleAppleHealthImport` merges it into
`appleHealthOptions` → `ImportDialog` passes it into
`MedicalRecordImporter`, which applies `applyFhirDeidentification` at the
single point where parsed records become FHIR resources — both the
client-Minimongo and warehouse paths get identical treatment.

When `assignAnonymousPatient` is on, `ImportDialog` awaits
`patients.findOrCreateAnonymous` first and feeds the reference into
`context`. Import-run provenance tags are unaffected — de-id runs before
tagging.

## 6. Error handling & edge cases

- Anon-patient method failure → import blocked with an actionable error
  Alert. Never silently fall through to the real patient (privacy failure).
- De-id enabled but no transforms selected → no-op, import proceeds
  (mirrors DICOM `buildProcessingOptions` returning null).
- Malformed dates under date shifting → value left untouched, `log.warn`.
- Import button caption reflects de-id state
  ("Import N records as Anonymous").

## 7. Testing

- `tests/unit/imports/lib/FhirDeidentify.test.mjs` (node --test): reference
  rewrite, demographic strip, both date modes, passthrough of unknown
  types, idempotence.
- Unit test for `resolvePatientDisplayName` over the four patient shapes.
- Existing Nightwatch import flow untouched (de-id defaults off); no new
  E2E in this pass.

## Out of scope

- Wiring the controls into PDF/Data/Social-Media importers (they consume
  the lib later).
- Sensitive-type filtering presets — the existing type checkboxes already
  cover exclusion; the summary in the Data Mapping Preview panel surfaces it.

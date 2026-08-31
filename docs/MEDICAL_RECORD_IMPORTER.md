# MedicalRecordImporter — copies, canonical version, harmonization plan

Status note, 2026-08-06. There are multiple live copies of
`MedicalRecordImporter` in this repo that have drifted apart. This doc records
which one is current and the intended consolidation direction, so we stop
fixing bugs in one fork at a time.

## Current state (the fork inventory)

| Copy | Lines | Role |
|------|-------|------|
| `npmPackages/data-importer/lib/MedicalRecordImporter.js` | ~2650 | **Latest / canonical.** The full importer behind `/import-data` (NDJSON, Bundle, CSV/XLSX pipelines). Received the 2026-08-06 fixes: correct minimongo `insertAsync(doc)` signature (the old 3-arg Atmosphere call shape invoked an options object as the callback), plus extended-JSON id normalization (`{$oid: ...}` → string) in `importNdjson` and `importBundle`. |
| `imports/lib/MedicalRecordImporter.js` | ~270 | Main-app copy. Imported by `imports/ui/App.jsx` and registered as **`Meteor.MedicalRecordImporter`** (App.jsx:475). Consumed by pacio-core (`FhirFetchPanel.jsx`, `PatientFetchPage.jsx`). Much smaller surface than the data-importer version. |
| `extensions/merkalis/lib/import/MedicalRecordImporter.js` | ~2300 | Older full fork (nested repo). **Still carries the broken 3-arg `insertAsync` call** (~line 1632) that was fixed in data-importer — do not treat as current. |
| `npmPackages/patient-chart-starter/lib/MedicalRecordImporter.js` | ~275 | Small starter-package copy, similar vintage to the main-app one. |
| `deprecated/data-importer/...`, `deprecated/patient-chart-starter/...` | — | Retired Atmosphere-era copies; ignore. |

## Harmonization direction

1. **`Meteor.MedicalRecordImporter` is the intended shared surface.** The host
   app registers it (App.jsx); packages should consume it rather than carrying
   their own forks — the same facade pattern as `Meteor.Logger` /
   `Meteor.FhirUtilities`. Today the *registered* implementation is the small
   `imports/lib` copy while the *most capable* implementation is data-importer's
   — that inversion is the first thing to resolve (either promote the
   data-importer version to the registered implementation, or have
   data-importer consume and extend the registered one).

2. **merkalis should override, not fork.** Replace
   `extensions/merkalis/lib/import/MedicalRecordImporter.js` with a
   `MedicalRecordImporterOverrides.js` that starts from the default
   `Meteor.MedicalRecordImporter` and replaces/extends only the specific
   methods merkalis needs (its merkle-storage import behaviors), instead of
   duplicating the whole ~2300-line object. That makes upstream fixes (like the
   insertAsync one) flow to merkalis automatically.

3. **Bug parity until consolidation happens.** Any fix landed in the
   data-importer copy should be checked against the merkalis fork (nested repo,
   committed separately) and vice versa. Known outstanding: the merkalis fork
   still needs the insertAsync-signature + object-id fixes from 2026-08-06.

## Non-goals

- No big-bang merge of all four copies in one PR — the merkalis work in
  particular touches a nested private repo and its import behaviors need
  hand-testing against merkle storage.
- `patient-chart-starter`'s copy is a starter-template artifact; align it
  opportunistically or drop it when that package is next touched.

## Related

- `npmPackages/data-importer/CLAUDE.md` — importer package details (HTTP shim,
  BundleReferenceResolver, dedup integration)
- `imports/ui/App.jsx` — `Meteor.MedicalRecordImporter` registration
- `.claude/rules/fhir/package-registry.md` — how packages expose/consume shared
  capabilities

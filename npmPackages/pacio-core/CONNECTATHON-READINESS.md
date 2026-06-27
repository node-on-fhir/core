# July 2026 CMS Connectathon — PACIO Track Readiness & Verification Results

**Date:** 2026-06-11 · **Branch:** `pacio-cms-connectathon-2026` · **Packages:** `clinical:pacio-core`, `clinical:quality-measures`

All results below were verified **live** against a running instance
(Connectathon settings, both packages loaded), driving the actual Meteor
method handlers — not unit mocks.

## Scenario coverage

| Track scenario | Status | Where |
|---|---|---|
| **1 — Quality Measures** (I-CARE + CMS1317 ACP eCQM) | ✅ Both measures compute from real patient data; CMS1317 resolved against the **official spec package** | `quality-measures` |
| **2 — PFE Questionnaire POCs** (PROMIS-10 +) | ✅ PROMIS-10 capture with score components; WHODAS/GAD-7/PHQ-9 generate per-item + collection Observations | `pacio-core` |
| **3 — ToC Modeling Changes** (DocumentReference/Bundle profiles, new section LOINCs) | ✅ Profiles stamped; 15 sections verified against IG CI source; BSJ composition fully conformant | `pacio-core` |
| **Breakout — ADI Provenance** (custodian / who queried / who retrieved) | ✅ ADI-Provenance on create/update/revoke; AuditEvents on query + retrieval | `pacio-core` |

## Verification results (2026-06-11, live)

**Sample data** — `pacio.loadConnectathonData`: **505 resources, 0 errors,
0 skipped types** (497 from the `connectathon-july-2026` depot — Betsy
Smith-Johnson, Violet Gartner, Wilma Marina personas — plus 8 curated BSJ
fixtures).

**CMS1317v1** (evaluator engine) — individual calculation, Betsy
Smith-Johnson, MP 2026:

```json
{ "engine": "pacio-evaluator", "ip": true, "numerator": true, "age": 75,
  "acpDocument":   { "met": true,  "faithfulMet": false, "pacioExtension": true },
  "acpDiscussion": { "met": true,  "observations": 1 },
  "dnrZ66":        { "met": true,  "faithfulMet": true, "serviceRequests": 1 } }
```

Population summary: IP=1, denominator=1, exclusions=0, numerator=1, score=1.0.
Non-computable measures (no logic imported) throw honest `not-found` /
`not-computable` errors — counts are never fabricated.

**PACIO-ICARE-v1** — Betsy: **15 of 15** required ToC sections present,
in numerator.

**fqm-execution engine** (MITRE/Tacoma, v1.8.5) — smoke-tested with Tacoma's
own `proportion-boolean` fixture: measure bundle imported (1 Measure, 2
ELM-bearing Libraries, 3 ValueSets), real CQL execution produced
`initial-population=1, denominator=1, numerator=1` — matching Tacoma's
integration-test expectation.

**ADI lifecycle** — creating a POLST stamps the `ADI-DocumentReference`
profile + US Core category; create/revoke each generated an `ADI-Provenance`
(CREATE / NULLIFY, author + custodian agents); viewing a directive recorded
an access `AuditEvent`.

## Headline finding for MITRE / measure stewards

> **A faithful QDM→FHIR translation of CMS1317 under-counts PACIO-conformant
> systems.** Betsy's fully conformant ADI `DocumentReference` satisfies the
> measure's intent but fails the standard datatype mapping
> (`Intervention/Assessment, Performed` → Procedure/Observation):
> `acpDocument.faithfulMet === false` while `met === true` via the PACIO
> reading. The same applies to Z66 recorded as a Condition rather than an
> order. Both readings are implemented side-by-side; the delta is
> quantifiable per patient.

Full mapping discussion + open questions:
`packages/quality-measures/guides/cms1317-fhir-mapping.md`.

## Two calculation engines (by design)

| Engine | Serves | Status |
|---|---|---|
| PACIO evaluators (`quality-measures/server/evaluators/`) | The two draft Connectathon measures (no published FHIR bundles exist — the FHIR mapping IS the experiment) | ✅ verified |
| fqm-execution (MITRE/Tacoma) | Any published eCQM imported as a FHIR measure bundle with ELM (`qualityMeasures.importMeasureBundle`) | ✅ verified |

CMS1317 FHIR/QI-Core CQL is authored in **two variants** (faithful +
PACIO-extended) at `packages/quality-measures/specs/cms1317/fhir/`,
MADiE-compilable; `node scripts/build-cms1317-fhir-bundle.js` assembles the
fqm-execution bundles.

## Authoritative terminology (resolved without VSAC key)

From the official CMS1317-v1.0.000 package (vendored at
`quality-measures/specs/cms1317/qdm/`): all five value set OIDs + direct
codes ICD-10-CM **Z66** and LOINC **75773-2**. Expansion status: Encounter
Inpatient **official** (public); 1170.43/.31/.48 **proxy** (ADI IG
ADIDocumentationTypeVS family); 1170.45 **placeholder**.

## Remaining items

| Item | Action | Owner |
|---|---|---|
| Compile FHIR CQL → ELM | Paste `specs/cms1317/fhir/*.cql` into MADiE (madie.cms.gov, HARP login), export; drop ELM at `specs/cms1317/fhir/elm/` and rerun the bundle builder — or hand the CQL to MITRE at the Thursday call | user / MITRE |
| Differential test (evaluator vs CMS1317-FHIR vs CMS1317-PACIO) | Runs once ELM lands | automated |
| Official 1170.x expansions | `UMLS_API_KEY=<key> node scripts/fetch-vsac-valuesets.js` | user (key) |
| Inferno conformance run | `paciowg/pacio-test-kit` against `http://localhost:3000/baseR4` (config: `pacio-core/certification/inferno.config.json`) | user |
| Raise open mapping questions | Thursday tech call / Zulip (#Post-Acute Care) — see mapping guide §"Known deviations" | user |

## How to run

```bash
# App (Connectathon configuration; API keys via env vars)
EXTRA_WORKFLOWS=@node-on-fhir/timelines,@node-on-fhir/fhir-graph,@node-on-fhir/radiology-workflow \
meteor run --settings packages/pacio-core/configs/settings.pacio-core.2026.json \
  --extra-packages "clinical:pacio-core, clinical:quality-measures, clinical:structured-data-capture, clinical:secure-messaging, clinical:us-core, symptomatic:timelines, clinical:admin-tools, clinical:international-patient-summary, symptomatic:mcp, clinical:data-importer, clinical:data-exporter, clinical:email-list"

# Load personas + fixtures: "Load Connectathon Data" footer button, or
#   Meteor.call('pacio.loadConnectathonData')

# Refresh sample data from the depot          npm run refresh-pacio-sample-data
# Rebuild CMS1317 FHIR bundles                node scripts/build-cms1317-fhir-bundle.js
# Upgrade value sets (needs UMLS key)         node scripts/fetch-vsac-valuesets.js
# Unit tests                                  meteor test-packages ./packages/quality-measures
# E2E                                         tests/nightwatch/pacio-measures.test.js
```

## Artifact index

- Official CMS1317 spec (vendored): `quality-measures/specs/cms1317/qdm/`
- FHIR CQL (faithful + PACIO): `quality-measures/specs/cms1317/fhir/`
- Vendored value sets: `quality-measures/specs/cms1317/valuesets/`
- QDM→FHIR mapping guide: `quality-measures/guides/cms1317-fhir-mapping.md`
- ADI constants/provenance: `pacio-core/lib/constants/AdiConstants.js`, `pacio-core/server/methods/adiProvenance.js`
- ToC section authority: `pacio-core/lib/constants/TocConstants.js` (mirrored in `quality-measures/lib/toc-sections.js`)
- Test fixtures: `pacio-core/data/2026-07-cms-connectathon/`
- Inferno config + kit pointers: `pacio-core/certification/`
- Known deferrals: `pacio-core/README.md` §"Known Deferrals"

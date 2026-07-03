# CMS1317v1 → PACIO FHIR Mapping

**Status:** Authoritative (verified against the official CMS1317-v1.0.000 QDM
spec package, vendored at `specs/cms1317/qdm/` — CQL, compiled ELM, HQMF,
downloaded from ecqi.healthit.gov 2026-06-11).

CMS1317v1 ("Advance Care Planning", modeled on Quality ID #047, 2028
reporting period) is a **QDM-specified** draft eCQM with no published FHIR
measure bundle. The July 2026 CMS Connectathon PACIO track (Scenario 1) tests
whether PACIO IG data elements can support the measure logic. This document
records two readings, both implemented:

- **Faithful**: the standard QDM→FHIR datatype mapping
  (Intervention Performed → Procedure, Assessment Performed → Observation,
  Intervention Order → ServiceRequest, Encounter Performed → Encounter).
- **PACIO extension**: in PACIO systems the advance-directive content *is* a
  `DocumentReference` (ADI IG), and DNR status is frequently recorded as a
  Z66 `Condition`. The evaluator accepts these additionally and flags them
  `pacioExtension` in its details — the delta between the readings is the
  feedback artifact for MITRE / the measure stewards.

Implementations:
- Evaluator (runs both readings): `server/evaluators/adi-acp-evaluator.js`
- FHIR/QI-Core CQL (two variants, MADiE-compilable): `specs/cms1317/fhir/`

## Terminology (authoritative)

| Artifact | OID / code | Expansion status |
|---|---|---|
| Advance Care Planning Documentation VS | `2.16.840.1.113762.1.4.1170.45` | placeholder until VSAC fetch |
| Advance Directive Documentation VS | `2.16.840.1.113762.1.4.1170.43` | proxy (ADI IG ADIDocumentationTypeVS family) |
| Healthcare Agent and Power of Attorney Documentation VS | `2.16.840.1.113762.1.4.1170.31` | proxy |
| Portable Medical Order Documentation VS | `2.16.840.1.113762.1.4.1170.48` | proxy |
| Encounter Inpatient VS | `2.16.840.1.113883.3.666.5.307` | **official** public expansion (SNOMED 183452005, 32485007, 8715000) |
| Direct code: Do not resuscitate | ICD-10-CM `Z66` | authoritative |
| Direct code: Goals, preferences, and priorities for medical treatment | LOINC `75773-2` | authoritative |

Vendored ValueSet resources live in `specs/cms1317/valuesets/`; upgrade
proxies to official VSAC expansions with
`UMLS_API_KEY=<key> node scripts/fetch-vsac-valuesets.js`.

## Population criteria mapping

| QDM (official CQL) | Faithful FHIR mapping | PACIO extension | Mongo path |
|---|---|---|---|
| **IP**: exists `["Encounter, Performed": "Encounter Inpatient"]` where age ≥18 at MP start and relevantPeriod **ends during** MP | `Encounter.type` ∈ Encounter Inpatient VS, `status finished`, `period.end` in MP, `Patient.birthDate` → age ≥18 | also match `Encounter.class` ∈ {IMP, ACUTE} | `getInpatientDischargeEncounters()` |
| **Denominator** = IP; **no exclusions** | identical | — | — |
| **Numerator path 1** — "Advance Care Plan Document Before End Of Encounter": Intervention Performed ∪ Assessment Performed from the 3 document VSs, start/authorDatetime **before end of** hospitalization | `Procedure` / `Observation` with code ∈ document VSs, dated ≤ encounter end | non-revoked `DocumentReference` with ADI type code (42348-3, 81334-5, 89666-0, 89897-1, 75320-2), `date` ≤ encounter end | `getPatientProcedures()` / `getPatientObservations()` / `getPatientDocumentReferences()` |
| **Numerator path 2** — "Discussion Of Advance Care Goals...With Decision During Encounter": Intervention Performed (VS 1170.45) ∪ Assessment Performed (LOINC 75773-2) **during day of** hospitalization | `Procedure` (codes from 1170.45 expansion) ∪ `Observation` (75773-2) during encounter period | — (same) | `getPatientProcedures()` / `getPatientObservations()` |
| **Numerator path 3** — "Has Do Not Resuscitate Order During Encounter": `["Intervention, Order": Z66]`, authorDatetime **during day of** hospitalization | `ServiceRequest` code Z66, `authoredOn` during encounter period | Z66 `Condition` recorded during the hospitalization or linked to the encounter | `getPatientServiceRequests()` / `getPatientConditions()` |

Encounter pairing follows the spec's `with ... such that` semantics: a
numerator event may pair with **any** qualifying encounter, not only the
most recent.

Scoring: proportion. Improvement notation: increase. SDEs (race, ethnicity,
payer, sex) are declared in the spec but not yet emitted by the evaluator.

## Known deviations / open questions for the track

1. **Hospitalization window.** The spec computes the hospitalization as
   `Global."HospitalizationWithObservationAndOutpatientSurgeryService"` —
   extending the window backward through observation/ED/outpatient-surgery
   stays ending ≤1 hour before admission. We use `Encounter.period` directly.
   Impact: documents/discussions recorded during an immediately-prior ED or
   observation stay may be under-counted. Raise whether PAC settings need
   this nuance.
2. **PACIO DocumentReference reading.** The QDM→FHIR standard mapping sends
   "Intervention/Assessment, Performed" to Procedure/Observation — but PACIO
   ADI systems persist directives as DocumentReferences. If the FHIR version
   of this measure doesn't retrieve DocumentReferences, conformant PACIO
   systems will under-report. **This is the headline feedback item.**
3. **Z66 as Condition.** Real-world systems frequently carry DNR status as a
   coded problem/condition (Z66 is an ICD-10-CM status code) rather than an
   order. The faithful ServiceRequest reading misses those.
4. **1170.x expansions** are proxies until fetched from VSAC (UMLS key) or
   provided by the measure steward.
5. **"During day of" semantics**: the spec compares at day precision; we
   compare full timestamps. Edge effects possible at encounter-boundary
   midnight; negligible at Connectathon scale.

## Related

- Official spec (vendored): `specs/cms1317/qdm/`
- Evaluator: `server/evaluators/adi-acp-evaluator.js` (`evaluateCMS1317`)
- Measure definition: `lib/pacio-measures.js` (`CMS1317v1`)
- FHIR CQL (faithful + PACIO variants): `specs/cms1317/fhir/`
- Bundle assembly: `scripts/build-cms1317-fhir-bundle.js`
- Test fixtures: `packages/pacio-core/data/2026-07-cms-connectathon/`
  (`bsj-inpatient-encounter`, `bsj-adi-documentreference`,
  `bsj-z66-condition`, `bsj-dnr-servicerequest`,
  `bsj-acp-discussion-observation`)
- eCQM source: https://ecqi.healthit.gov/ecqm/hosp-inpt/2028/cms1317v1

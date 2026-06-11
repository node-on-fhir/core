# CMS1317v1 → PACIO FHIR Mapping

**Status:** Exploratory (July 2026 CMS Connectathon, PACIO track, Scenario 1)

CMS1317v1 ("Advance Care Planning", modeled on Quality ID #047, 2028 reporting
period) is a **QDM-specified** draft eCQM. There is no published FHIR measure
bundle. The PACIO track tests whether PACIO IG data elements (ADI IG, ToC IG)
can support the measure logic — this document records the mapping our
evaluator (`server/evaluators/adi-acp-evaluator.js`) implements. Code lists
are parameterized in the measure's `_pacio` metadata
(`lib/pacio-measures.js`) so they can be swapped without code changes.

## Population criteria mapping

| eCQM (QDM) | FHIR mapping (this implementation) | Mongo query |
|---|---|---|
| **Initial Population**: 18+ at measurement period start, inpatient discharge from acute/critical access hospital during period | Patient.birthDate → age ≥ 18 at `periodStart`; Encounter with `class.code ∈ {IMP, ACUTE}`, `status ∈ {finished, completed, discharged}`, `period.end` within period | `getInpatientDischargeEncounters()` |
| **Denominator**: = IP, no exclusions | identical | — |
| **Numerator path 1**: ACP document (healthcare agent designation, advance directive, portable medical order) before encounter end | DocumentReference with `type.coding.code ∈ ADI type codes` (42348-3, 81334-5, 89666-0, 89897-1, 75320-2), `status ∈ {current, completed, active}` (revoked = entered-in-error excluded), `date ≤ encounter.period.end` | `getPatientDocumentReferences()` |
| **Numerator path 2**: ICD-10-CM Z66 (DNR status) during hospitalization | Condition with `code.coding.code = Z66`, `recordedDate`/`onsetDateTime` within the encounter period OR `encounter.reference` to the qualifying encounter | `getPatientConditions()` |
| **Numerator path 3**: documented ACP discussion with documented decision during encounter | Procedure with `code.coding.code ∈ {99497, 99498 (CPT), 713603004 (SNOMED)}` performed during the encounter period | `getPatientProcedures()` |

Scoring: proportion; improvement notation: increase.

## Known deviations / open questions

1. **Value sets unconfirmed.** The exact VSAC value sets CMS publishes for
   CMS1317v1 (healthcare agent designation, portable medical orders, "ACP
   discussion with documented decision") were not retrievable offline. The
   code lists above are defensible placeholders. **Reconcile against the
   CMS1317-v1.0.000 value-set appendix (ecqi.healthit.gov) before the
   Connectathon.**
2. **Facility type.** "Acute or critical access hospital" is approximated by
   encounter class (IMP/ACUTE); we do not check
   `Encounter.serviceProvider`/`Location` type. Implementable once
   Organization/Location fixtures carry facility-type codings.
3. **"Documented decision" (path 3).** Presence of the coded ACP-discussion
   Procedure during the encounter satisfies the path. A stricter reading
   (Procedure + linked outcome/DocumentReference) is possible — raise at the
   track.
4. **Latest-encounter semantics.** When a patient has multiple qualifying
   discharges, the numerator is evaluated against the most recent one.
   QDM episode-of-care semantics would evaluate per-encounter; our
   patient-level approximation matches proportion scoring at Connectathon
   scale.

## Related

- Evaluator: `server/evaluators/adi-acp-evaluator.js` (`evaluateCMS1317`)
- Measure definition: `lib/pacio-measures.js` (`CMS1317v1`)
- ADI document handling: `packages/pacio-core` (ADI-DocumentReference
  profile stamping + ADI-Provenance generation)
- Test fixtures: `packages/pacio-core/data/2026-07-cms-connectathon/`
  (`bsj-inpatient-encounter.json`, `bsj-z66-condition.json`,
  `bsj-adi-documentreference.json`)
- eCQM source: https://ecqi.healthit.gov/ecqm/hosp-inpt/2028/cms1317v1

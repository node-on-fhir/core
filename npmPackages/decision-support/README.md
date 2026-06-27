# @node-on-fhir/decision-support

Decision Support Interventions (DSI) workflow module for Honeycomb EHR.

Implements ONC Health IT Certification criterion **§ 170.315(b)(11) — Decision
support interventions** (evidence-based DSIs). Guide:
[`guides/decision-support-interventions.pdf`](./guides/decision-support-interventions.pdf).

## What it does

- **Intervention catalog** — evidence-based DSIs modeled as FHIR **PlanDefinition**
  (`eca-rule`): trigger + JSON criteria in `action.condition`, plain-language
  **source attributes** (bibliographic citation, developer, funding, release/revision
  dates), and which USCDI / demographic-SDOH categories each intervention uses.
- **Selection / activation** — identified users **activate** interventions
  (`status: active`); role-gated via `settings.private.decisionSupport.allowedUserIds`.
- **Fire seam** — a synchronous `decisionSupport.evaluate(context)` for an interruptive
  pre-submit alert (`<DsiAlert>` / `useDecisionSupport`), **plus** a `ServiceRequest`
  after-insert hook that records each firing as **GuidanceResponse** + **DetectedIssue**.
  Re-evaluates on ToC/referral-incorporated Conditions/Allergies/Medications (§ (ii)(B)).
- **Feedback loop** — capture action taken + feedback and **export computable** rows
  (intervention, action taken, feedback, user, date, location) — § (ii)(C).
- **Source-attribute usage policy** — a Server Configuration tab toggles which
  demographic/SDOH categories DSIs may use (region-dependent), backed by
  `settings.private.decisionSupport.sourceAttributes.*`. Interventions that use a
  disallowed category are suppressed.

## Opt-in (not every catalog wants DSI)

Data-driven + non-invasive to order-catalog:
1. A DSI applies only where an **active PlanDefinition** targets the order's code/category.
2. `settings.private.decisionSupport.enabledCategories` allow-lists which order
   categories the after-insert hook evaluates (default `["imaging","laboratory"]`).
3. Interruptive pre-submit alerts are opt-in: an order screen renders `<DsiAlert
   context={{ serviceRequest, patientId }} />`.

## Quick Start

```bash
EXTRA_WORKFLOWS=@node-on-fhir/decision-support \
  meteor run --settings settings/settings.honeycomb.localhost.json
```
Open `/decision-support`, click **Seed samples**, activate an intervention, then place
a matching order. Source-attribute policy lives under **Server Configuration → Decision Support**.

## Meteor Methods

| Method | Description |
|--------|-------------|
| `decisionSupport.evaluate(context)` | Synchronous evaluation → matched interventions (pre-submit alert). |
| `decisionSupport.upsertIntervention(input)` | Author/update a DSI (role-gated). |
| `decisionSupport.setInterventionStatus(id, status)` | Activate / retire a DSI. |
| `decisionSupport.seedSampleInterventions()` | Insert the bundled sample DSIs. |
| `decisionSupport.recordFeedback(payload)` | Capture feedback (§ (ii)(C)). |
| `decisionSupport.exportFeedback(filter)` | Computable export (rows + NDJSON). |
| `decisionSupport.getSourceAttributePolicy()` / `setSourceAttributeUsage(key, allowed)` | Read/flip the usage policy. |

## Settings

```json
{
  "private": {
    "decisionSupport": {
      "allowedUserIds": [],
      "enabledCategories": ["imaging", "laboratory"],
      "sourceAttributes": { "race": false, "ethnicity": false, "dateOfBirth": true }
    }
  },
  "public": { "modules": { "decisionSupport": { "enabled": true } } }
}
```

## New global FHIR collections

This package's installation adds three previously-missing collections (registered in
`server/main.js`, `imports/startup/client/collections.js`,
`server/publications/autopublish.js`): **DetectedIssue**, **Citation**, **EvidenceVariable**.

## License

MIT

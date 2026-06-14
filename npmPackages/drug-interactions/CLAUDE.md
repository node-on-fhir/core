# CLAUDE.md — @node-on-fhir/drug-interactions

Migrated from Atmosphere `clinical:drug-interactions` (2026-06-13). ONC
170.315(a)(4) — drug-drug + drug-allergy interaction checking. Settings-gated
(`drugInteractions.enabled` / `.showInWorkflows`).

## Notes

- **3 routes**, two of which render `<DrugInteractionCheckerPage defaultMode=…/>`
  (drug-drug, drug-allergy). workflow.json encodes the variants as distinct
  component keys (`DrugInteractionCheckerPage_DrugDrug` / `_DrugAllergy`) that
  client.js maps to elements with the right prop.
- `ClinicianWorkflows` → sidebarItems; `medication`→`Medication`, `alert`→`Warning`,
  `allergies`→`MedicalInformation`. Inline `FooterButtons` (Check Interactions)
  and the `ModuleConfig` export preserved.
- `lib/InteractionDatabase.js` carried (isomorphic data). methods-only server.
- Small `guide/` IG dir NOT carried. Monorepo-tracked → fresh `git init`.

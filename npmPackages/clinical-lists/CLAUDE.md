# CLAUDE.md — @node-on-fhir/clinical-lists

Migrated from Atmosphere `clinical:clinical-lists` (2026-06-13). ONC
170.315(a)(6-8) — problem list, medication-allergy list, medication list.

## Notes

- 3 distinct routes (`/problem-list`, `/medication-allergy-list`,
  `/medication-list`). `SidebarElements` (collectionName badges Conditions /
  AllergyIntolerances / MedicationStatements) → sidebarItems. Icons:
  `problem`→`Assignment`, `allergy`→`MedicalInformation`, `medication`→`Medication`.
- server = methods + publications. `moment` peer (present). No Assets.
  Monorepo-tracked → fresh `git init`. `serverEntry: ./server`.

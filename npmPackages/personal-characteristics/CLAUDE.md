# CLAUDE.md — @node-on-fhir/personal-characteristics

Migrated from Atmosphere `clinical:personal-characteristics` (2026-06-13).
Phenotype domains + dermatome visualizations. Single route
`/patient-characteristics`, **settings-gated** (default off).

## Notes

- **Client-only** — the Atmosphere original declared no server files. `server.js`
  is a minimal no-op so `serverEntry: ./server` resolves (avoids the
  default-`./server/methods` gotcha).
- Was an **orphan** (no source repo, not monorepo-tracked) → fresh `git init`.
- 8 dermatome PNGs flow through the parser's `public/workflows/personal-characteristics/`
  pipeline; `PatientCharacteristicsPage.jsx` builds `/workflows/personal-characteristics/Dermatomes_*.png`
  (was the Atmosphere `/packages/clinical_patient-characteristics/assets/` path).
- iconName `user` → `Person` (PascalCase MUI).
- `design/` (PDFs, screenshots, mockups — pure design artifacts, not runtime)
  was NOT carried over; it remains with the original in `deprecated/`. `data/`
  (FHIR phenotype terminology FSH/NDJSON/CSV) was carried but is reference-only
  (not code-imported).

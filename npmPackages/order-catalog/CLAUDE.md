# CLAUDE.md — @node-on-fhir/order-catalog

Migrated from Atmosphere `clinical:order-catalog` (2026-06-13). ONC 170.315(a)(1-3) CPOE. 4 routes (3 defaultType variants); ClinicianWorkflows → sidebarItems (orders→Assignment, medication→Medication, laboratory→Science, imaging→Scanner); inline footer + ModuleConfig; settings-gated. Kept existing server/index.js (imports methods + startup). Monorepo-tracked → fresh git init.

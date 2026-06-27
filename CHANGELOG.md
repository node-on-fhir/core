# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — CMS Connectathon 2026

Work prepared for the July 2026 CMS / PACIO Connectathon: new clinical workflow
packages, ONC 170.315 certification criteria, inpatient workflow support, and a
reorganization of the connectathon example data.

### Added

- **Real-Time Prescription Benefit (RTPB)** — `prescription-benefit` package for
  ONC 170.315(b)(4): benefit/alternatives lookup, a provider page, and
  inventory/responder libraries with example inventory data.
- **Decision Support Interventions (DSI)** — `decision-support` package for ONC
  170.315(b)(11), including a DSI initialization component.
- **`allergy-testing`** — new guided allergy-testing workflow package (route
  `/allergy-testing`).
- **Structured Data Capture** — standalone survey page, Likert-scale question
  type, a question-renderer registry, and reusable widget components.
- **PACIO inpatient workflow** — inpatient mode, admit/discharge, bed management,
  and manual RelatedPerson entry in `pacio-core` (new `BedsCollection`,
  publications, and server methods).
- **Patient share modal** — `imports/api/share` plus `ShareModalDialog` and its
  resolver, opened through the shared main-app dialog.
- **Server versioning card** — `ServerVersioningCard` surfaced on the vault-server
  configuration page.
- **Implantable devices** — device assets/library and the `DeviceUseStatements`
  SimpleSchema.
- **Deduplication** — `Deduplicator` library in `patient-matching` and a
  `useDeduplicator` hook + import-params panel in `data-importer`.
- **Print auditing** — `print-auditor` agent and `/audit-print` command for
  catching dark-on-paper / screen-chrome print hazards.

### Changed

- **PACIO example data reorganized** into per-patient folders
  (BetsySmithJohnson, VioletGartner, WilmaMarina) plus Organizations,
  Practitioners, and Questionnaires groupings, and a new
  `2026-07-cms-connectathon` FHIR set.
- Connectathon polish across `order-catalog`, `secure-messaging`,
  `quality-measures`, and `admin-tools`.
- Registered the new workflow packages in `workflows.json` / workspaces, wired
  collections in `server/main.js`, and added settings gating
  (`decisionSupport.seedSamples`, `survey`/PROMIS-10, `inpatientMode`).
- App chrome, theming, hotkeys, and documentation refreshed.
- `prescription-benefit` route normalized to the singular `/prescription-benefit`.

### Removed

- Per-package `FooterButtons` from `prescription-benefit` and
  `international-patient-summary` in favor of the shared footer.
- `personal-characteristics` relocated out of the tracked `npmPackages` tree into
  a private `extensions/` repo.

### Merged from `main`

- Access control migrated from `role-acl` to `@casl/ability`
  (`server/lib/CaslAccessControl.js`, `PermissionModel.js`, parity test +
  `test:acl` script).
- Dependency security overrides and bumps (axios, lodash, meteor-node-stubs,
  node-forge, ws; overrides for qs, hono, dompurify, protobufjs, and others).

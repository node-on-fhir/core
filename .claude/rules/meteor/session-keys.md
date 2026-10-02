# Session-Key Contracts

## Why this exists

Honeycomb's cross-package integration rides on `Session` keys — plain strings
shared between packages and verified by nothing. `Session.get('simulatorMissionId')`
in one package only works because three other packages spell it identically; a
typo fails silently (FABLE-ANALYSIS.md §3). This is the single canonical table
of the **load-bearing** keys; the executable source of truth is
[`imports/lib/SessionKeys.js`](../../../imports/lib/SessionKeys.js).

> Scope: the keys that cross package boundaries or are otherwise load-bearing —
> NOT all ~685 Session keys in the codebase. Local single-file UI state (tab
> indices, form buffers, dialog scratch) stays inline and is not a contract.

## Use the constants, not literals

```javascript
import { SELECTED_PATIENT_ID, SIMULATOR_MISSION_ID, SELECTED_ID } from '/imports/lib/SessionKeys.js';

Session.get(SELECTED_PATIENT_ID);          // typo → ReferenceError (caught)
Session.get('selectedPatientId');          // typo → silent undefined

Session.get(SELECTED_ID('Observation'));   // → 'selectedObservationId'
```

Adopt in new code; migrate existing literals opportunistically when you touch a
file (not as a campaign).

## Contract table

### Patient / clinician context (the #1 contract)

| Key | Constant | Set by | Read by | Meaning |
|-----|----------|--------|---------|---------|
| `selectedPatient` | `SELECTED_PATIENT` | PatientSidebar, test setup | every patient-scoped page | full FHIR Patient object |
| `selectedPatientId` | `SELECTED_PATIENT_ID` | PatientSidebar, test setup | subscriptions, queries, footer buttons | FHIR id string |
| `selectedPatientMongoId` | `SELECTED_PATIENT_MONGO_ID` | lookup sites | record lookups | MongoDB `_id` (see id-lookup rule) |
| `currentUser` | `CURRENT_USER` | accounts/login | headers, auth gates | logged-in user object |

Lifecycle: set **both** `selectedPatient` (object) and `selectedPatientId` (id)
together; clear both on deselection/logout. See
[`anti-patterns/patient-context.md`](../anti-patterns/patient-context.md).

### Main application dialog (cross-package modal) — REMOVED (was a dead contract)

The `mainAppDialog*` / `dialogReturnValue` keys were a shared-modal bus: a
package set `mainAppDialogComponent` to a component *name* and toggled
`mainAppDialogOpen`, and a host at the app root was meant to resolve the name
(via provider-directory's `DialogComponents` registry) and render it, handing
results back through `dialogReturnValue`.

**That host never existed in this repo** (it stayed behind in the upstream
node-on-fhir Meteor-2 app shell during the Meteor 2→3 reseed — `git log --all
-S "Session.get('mainAppDialogOpen')"` finds nothing). So the bus had ~30
writers in core and 144 in provider-directory but **zero readers** — every
"open dialog" through it was a silent no-op.

Removed 2026-07 (branch `feat/session-visibility`): the constants are gone from
`SessionKeys.js`, the core writers were converted to real navigation
(`/login` + `Meteor.logout`) or neutered, and pacio-core's `mainAppDialogJson`
message channel is now a real Snackbar via [`imports/lib/notify.js`](../../../imports/lib/notify.js).
Do **not** reintroduce these keys — open a modal with a local MUI `<Dialog>` +
its own `open` state, or for cross-package modals register through
`WorkflowRegistry`. For toasts use `notify({ title, message, severity })`.

> Residual: provider-directory's footer still carries the dead writes (tracked
> as a follow-up — it's the flagship National Directory package and its picker
> UX needs hand-testing before that surface changes). A handful of preserved
> terminology/geography picker components (`SearchValueSetsDialog`,
> `SearchCodeSystemDialog`, `SearchStatesDialog`,
> `SearchLibraryOfMedicineDialog`, `SearchResourceTypesDialog`) still contain
> the old `dialogReturnValue` return-protocol and would need a real host/prop
> when rewired.

### Endpoint Conformance Spider

| Key | Constant | Set by | Read by | Meaning |
|-----|----------|--------|---------|---------|
| `spiderScanning` | `SPIDER_SCANNING` | @orbital/lantern probe driver (EndpointList) + future sweep worker | provider-directory DirectoryConsole scan-line; any global chrome that adopts it | boolean — a probe/sweep is in flight; drives the traveling sweep-line "spider running" tell |

### Session Inspector (debug dashboard)

| Key | Constant | Notes |
|-----|----------|-------|
| `sessionInspectorOpen` | `SESSION_INSPECTOR_OPEN` | Cmd/Ctrl+Shift+D toggles the live Session-state dashboard ([`imports/ui/SessionInspectorDialog.jsx`](../../../imports/ui/SessionInspectorDialog.jsx)); groups keys by the families in this doc via [`imports/lib/sessionKeyGroups.js`](../../../imports/lib/sessionKeyGroups.js). The observability answer to the "invisible string contracts" problem — use it to see every key the app is carrying. |

### Orbital simulator (shared: orbital ⇄ life-support-systems ⇄ greenhouses ⇄ hexgrid ⇄ voyager-technologies)

| Key | Constant | Set by | Meaning |
|-----|----------|--------|---------|
| `simulatorMissionId` | `SIMULATOR_MISSION_ID` | life-support-systems (fresh-minted via hexgrid `missionTurn.startRun`), hexgrid, voyager-technologies | **Synthetic per-launch RUN id** (hexgrid turn-tracking — `missionTurns.byMission`). Since the Task E1 fresh-run mint (Phase E, 2026-08-08), every mission-portfolio "Run Simulator" launch mints a brand-new id here so relaunching the same mission never adopts a previous play session's leftover `MissionTurns`/board. **Does NOT back a FHIR EpisodeOfCare** — server methods that need the real mission (`orbital.getMissionCrew`, `orbital.provisionMissionSuits`, `resolveKcalTarget`) resolve it via `extensions/orbital/lib/resolveMissionEpisode.js`, which falls back to the run's persisted `MissionTurn.simConfig.configMissionId` on an EpisodeOfCare miss. |
| `simulatorMissionConfigId` | `SIMULATOR_MISSION_CONFIG_ID` | life-support-systems | **Stable EpisodeOfCare id**, kept separate from `simulatorMissionId` for profile/config resolution (`lifesupport.getMissionProfile`, crew Group lookups, mission-config extension reads). Client call sites that need a real EpisodeOfCare id (daily-log/life-support cross-navigation, "Return to Orion") should prefer this over `simulatorMissionId`. |
| `simulatorLaunchDate` | `SIMULATOR_LAUNCH_DATE` | simulator dashboards | MET clock origin |
| `simulatorStartDateTime` | `SIMULATOR_START_DATE_TIME` | LifeSupportDashboard (`handleSetLaunchTime`/`handleClearLaunchTime`) | Full ISO launch date-time input (vs. `simulatorLaunchDate`'s date-only chip value) |
| `simulatorDailyCaloriesPerCrew` | `SIMULATOR_DAILY_CALORIES_PER_CREW` | mission-config rate-override chain | kcal/day override; resolution: mission-config `dailyCaloriesPerCrew` → `settings.public.simulator` → 2500 default (see life-support-systems CLAUDE.md § Per-vehicle configuration) |
| `simulatorVehicle` | `SIMULATOR_VEHICLE` | simulator dashboards | active vehicle |
| `simulatorMissionMode` | `SIMULATOR_MISSION_MODE` | simulator dashboards | `'monitor'` \| `'simulator'` |
| `selectedCrewedVehicle` | `SELECTED_CREWED_VEHICLE` | orbital | selected Device (crewed vehicle) |
| `simulatorStartingBoard` | `SIMULATOR_STARTING_BOARD` | lunar-colony-content `EarthLaunchPage.jsx` (LAUNCH + PRE-LAUNCH) | last-chosen Starting-board mode (`'empty'` \| `'continue'` \| `'join'`); read opportunistically by life-support-systems' `EarthMarsTransitDialog.jsx` to pre-check "re-simulate existing days" when the board was launched empty — not persisted, user-flippable |

**Dual-tagging (Task F3)**: simulator-generated FHIR resources (`lib/simulationTags.js`
`buildSimulationTags()`) can carry **two** mission codings — one for `simulatorMissionId`
(run id) and one for `simulatorMissionConfigId` (config id) — when both are present and
distinct, so a mission-scoped flush (`orbital.colonySimData.clearMission`) finds records
regardless of which id a given producer tagged with.

### Hexgrid board state (hexgrid package)

`hexgridHexSize`, `hexgridCrewId`, `hexgridVehicleId`, `hexgridSelectedHex`,
`hexgridPlacementMode`, `hexgridMapImage`, `hexgridIconColor`,
`hexgridShowCoordinates` — constants `HEXGRID_*`.

### Timeline window (timelines package)

`timelineStart`, `timelineEnd`, `timelineMin`, `timelineMax`,
`activeTimelineResource`, `activeTimelineResourceType` — constants
`TIMELINE_*` / `ACTIVE_TIMELINE_*`.

### App chrome / display toggles

`theme` (`THEME`, `'light'|'dark'`), `displayNavbars`, `appHeight`, `appWidth`,
`viewport`, `showSystemIds`, `showFhirIds`, `showExperimental`.

### Auth / accounts

`currentUser`, `sessionId`, `accountsAccessToken`, `accountsRefreshToken`.

### Faceted search (provider-directory)

`MainSearch.*` — dot-namespaced (`name`, `state`, `city`, `country`,
`postalCode`, `endpointType`, `healthcareService`, `insurancePlan`,
`practitionerSpecialty`); constant group `MAIN_SEARCH`.

### Per-resource selection pattern

Detail pages store the selected record id under `selected{ResourceType}Id`
(e.g. `selectedObservationId`, `selectedConditionId`). Use
`SELECTED_ID(resourceType)` / `SELECTED_RESOURCE(resourceType)` rather than
hand-concatenating.

## Finding stray literals

```bash
# Every distinct Session key + usage count
grep -rhoE "Session\.(get|set)\(['\"][^'\"]+['\"]" imports/ packages/ npmPackages/ \
  | sed -E "s/Session\.(get|set)\(['\"]//; s/['\"]$//" | sort | uniq -c | sort -rn
```

## Related

- Code: [`imports/lib/SessionKeys.js`](../../../imports/lib/SessionKeys.js) — the constants (source of truth)
- Rule: [`anti-patterns/patient-context.md`](../anti-patterns/patient-context.md) — patient-context lifecycle + Session discipline
- Rule: [`anti-patterns/id-lookup.md`](../anti-patterns/id-lookup.md) — why `selectedPatientMongoId` is distinct from `selectedPatientId`
- Sibling contract: `global.Collections` — `scripts/audit-global-collections.js` + `imports/lib/globalCollections.js`
- Backlog: `FABLE-TECH-DEBT-PAYDOWN.md` § P2 string contracts

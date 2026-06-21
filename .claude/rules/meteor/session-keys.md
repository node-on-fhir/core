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

### Main application dialog (cross-package modal)

| Key | Constant | Notes |
|-----|----------|-------|
| `mainAppDialogOpen` | `MAIN_APP_DIALOG_OPEN` | any package opens the shared modal by setting these |
| `mainAppDialogTitle` | `MAIN_APP_DIALOG_TITLE` | |
| `mainAppDialogComponent` | `MAIN_APP_DIALOG_COMPONENT` | component rendered inside the dialog |
| `mainAppDialogMaxWidth` | `MAIN_APP_DIALOG_MAX_WIDTH` | |
| `mainAppDialogJson` | `MAIN_APP_DIALOG_JSON` | JSON payload to display |
| `dialogReturnValue` | `DIALOG_RETURN_VALUE` | result handed back to the opener |

### Orbital simulator (shared: orbital ⇄ life-support-systems ⇄ greenhouses ⇄ hexgrid ⇄ voyager-technologies)

| Key | Constant | Set by | Meaning |
|-----|----------|--------|---------|
| `simulatorMissionId` | `SIMULATOR_MISSION_ID` | life-support-systems, hexgrid, voyager-technologies | active mission EpisodeOfCare id |
| `simulatorLaunchDate` | `SIMULATOR_LAUNCH_DATE` | simulator dashboards | MET clock origin |
| `simulatorVehicle` | `SIMULATOR_VEHICLE` | simulator dashboards | active vehicle |
| `simulatorMissionMode` | `SIMULATOR_MISSION_MODE` | simulator dashboards | `'monitor'` \| `'simulator'` |
| `selectedCrewedVehicle` | `SELECTED_CREWED_VEHICLE` | orbital | selected Device (crewed vehicle) |

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

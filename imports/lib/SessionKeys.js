// imports/lib/SessionKeys.js
//
// Canonical Session-key constants (FABLE-TECH-DEBT-PAYDOWN.md § P2 string
// contracts). Honeycomb's cross-package integration rides on string Session
// keys verified by nothing — a typo in `Session.get('simulatorMissionId')`
// fails silently (FABLE-ANALYSIS.md §3). This module turns the load-bearing,
// cross-package keys into importable constants so a typo becomes a build/lint
// error instead of a silent miss.
//
// SCOPE: the contracts that cross package boundaries or are otherwise
// load-bearing — NOT all ~685 Session keys in the codebase. Local, single-file
// UI state (tab indices, dialog-scratch values, per-form buffers) stays inline.
//
// ADOPTION: use these in NEW code. Migrate existing string literals
// opportunistically when you touch a file — this is not a campaign. Both of
// these are equivalent, but the first is checkable:
//
//   import { SELECTED_PATIENT_ID } from '/imports/lib/SessionKeys.js';
//   Session.get(SELECTED_PATIENT_ID);          // typo -> ReferenceError
//   Session.get('selectedPatientId');          // typo -> silent undefined
//
// Isomorphic and dependency-free: safe to import from client, server, and
// packages (core/*, extensions/*, npmPackages/*).

// ── Patient context (the #1 contract — 700+ call sites) ──────────────────────
export const SELECTED_PATIENT       = 'selectedPatient';        // full FHIR Patient object
export const SELECTED_PATIENT_ID    = 'selectedPatientId';      // FHIR id string
export const SELECTED_PATIENT_MONGO_ID = 'selectedPatientMongoId'; // MongoDB _id (see id-lookup rule)

// ── Practitioner / clinician context ─────────────────────────────────────────
export const SELECTED_PRACTITIONER_ID      = 'selectedPractitionerId';
export const SELECTED_PRACTITIONER_ROLE_ID = 'selectedPractitionerRoleId';

// ── User / auth session ──────────────────────────────────────────────────────
export const CURRENT_USER            = 'currentUser';
export const SESSION_ID              = 'sessionId';
export const ACCOUNTS_ACCESS_TOKEN   = 'accountsAccessToken';
export const ACCOUNTS_REFRESH_TOKEN  = 'accountsRefreshToken';

// ── Main application dialog (cross-package modal contract) ────────────────────
export const MAIN_APP_DIALOG_OPEN      = 'mainAppDialogOpen';
export const MAIN_APP_DIALOG_TITLE     = 'mainAppDialogTitle';
export const MAIN_APP_DIALOG_COMPONENT = 'mainAppDialogComponent';
export const MAIN_APP_DIALOG_MAX_WIDTH = 'mainAppDialogMaxWidth';
export const MAIN_APP_DIALOG_JSON      = 'mainAppDialogJson';
export const DIALOG_RETURN_VALUE       = 'dialogReturnValue';

// ── Endpoint context (cross-package: lantern directory ⇄ share dialog) ───────
// A FHIR Endpoint chosen on /lantern as the destination for sharing/relaying a
// document. ShareModalDialog reads these to override the default fhirRelay
// endpoint. SELECTED_ENDPOINT is the full Endpoint object; *_ID is the MongoDB
// _id used as the selection marker for row highlighting.
export const SELECTED_ENDPOINT     = 'selectedEndpoint';     // full FHIR Endpoint object
export const SELECTED_ENDPOINT_ID  = 'selectedEndpointId';   // Endpoint _id (selection marker)

// ── App chrome / theme ───────────────────────────────────────────────────────
export const THEME           = 'theme';            // 'light' | 'dark'
export const DISPLAY_NAVBARS  = 'displayNavbars';
export const APP_HEIGHT       = 'appHeight';
export const APP_WIDTH        = 'appWidth';
export const VIEWPORT         = 'viewport';

// ── FHIR id / display toggles ────────────────────────────────────────────────
export const SHOW_SYSTEM_IDS    = 'showSystemIds';
export const SHOW_FHIR_IDS      = 'showFhirIds';
export const SHOW_EXPERIMENTAL  = 'showExperimental';

// ── Orbital simulator (cross-package: orbital ⇄ life-support ⇄ greenhouses) ───
export const SIMULATOR_MISSION_ID   = 'simulatorMissionId';
export const SIMULATOR_LAUNCH_DATE  = 'simulatorLaunchDate';
export const SIMULATOR_VEHICLE      = 'simulatorVehicle';
export const SIMULATOR_MISSION_MODE = 'simulatorMissionMode';
export const SELECTED_CREWED_VEHICLE = 'selectedCrewedVehicle';

// ── Hexgrid package (cross-package board state) ──────────────────────────────
export const HEXGRID_HEX_SIZE         = 'hexgridHexSize';
export const HEXGRID_CREW_ID          = 'hexgridCrewId';
export const HEXGRID_VEHICLE_ID       = 'hexgridVehicleId';
export const HEXGRID_SELECTED_HEX     = 'hexgridSelectedHex';
export const HEXGRID_PLACEMENT_MODE   = 'hexgridPlacementMode';
export const HEXGRID_MAP_IMAGE        = 'hexgridMapImage';
export const HEXGRID_ICON_COLOR       = 'hexgridIconColor';
export const HEXGRID_SHOW_COORDINATES = 'hexgridShowCoordinates';

// ── Timeline package (cross-package window/selection) ─────────────────────────
export const TIMELINE_START                  = 'timelineStart';
export const TIMELINE_END                    = 'timelineEnd';
export const TIMELINE_MIN                    = 'timelineMin';
export const TIMELINE_MAX                    = 'timelineMax';
export const ACTIVE_TIMELINE_RESOURCE        = 'activeTimelineResource';
export const ACTIVE_TIMELINE_RESOURCE_TYPE   = 'activeTimelineResourceType';

// ── Grouped namespaces (keys that share a string prefix) ─────────────────────
// MainSearch.* — provider-directory faceted search (dot-namespaced).
export const MAIN_SEARCH = {
  NAME:                  'MainSearch.name',
  STATE:                 'MainSearch.state',
  CITY:                  'MainSearch.city',
  COUNTRY:               'MainSearch.country',
  POSTAL_CODE:           'MainSearch.postalCode',
  ENDPOINT_TYPE:         'MainSearch.endpointType',
  HEALTHCARE_SERVICE:    'MainSearch.healthcareService',
  INSURANCE_PLAN:        'MainSearch.insurancePlan',
  PRACTITIONER_SPECIALTY:'MainSearch.practitionerSpecialty'
};

// ── selectedXId resource pattern ─────────────────────────────────────────────
// Per-resource detail pages store the selected record's FHIR id under
// `selected{ResourceType}Id`. Use SELECTED_ID(resourceType) for new code rather
// than hand-concatenating, so the contract is one expression.
//   Session.get(SELECTED_ID('Observation'))  ->  'selectedObservationId'
export function SELECTED_ID(resourceType) {
  return 'selected' + resourceType + 'Id';
}
export function SELECTED_RESOURCE(resourceType) {
  return 'selected' + resourceType;
}

export default {
  SELECTED_PATIENT, SELECTED_PATIENT_ID, SELECTED_PATIENT_MONGO_ID,
  SELECTED_PRACTITIONER_ID, SELECTED_PRACTITIONER_ROLE_ID,
  CURRENT_USER, SESSION_ID, ACCOUNTS_ACCESS_TOKEN, ACCOUNTS_REFRESH_TOKEN,
  MAIN_APP_DIALOG_OPEN, MAIN_APP_DIALOG_TITLE, MAIN_APP_DIALOG_COMPONENT,
  MAIN_APP_DIALOG_MAX_WIDTH, MAIN_APP_DIALOG_JSON, DIALOG_RETURN_VALUE,
  SELECTED_ENDPOINT, SELECTED_ENDPOINT_ID,
  THEME, DISPLAY_NAVBARS, APP_HEIGHT, APP_WIDTH, VIEWPORT,
  SHOW_SYSTEM_IDS, SHOW_FHIR_IDS, SHOW_EXPERIMENTAL,
  SIMULATOR_MISSION_ID, SIMULATOR_LAUNCH_DATE, SIMULATOR_VEHICLE,
  SIMULATOR_MISSION_MODE, SELECTED_CREWED_VEHICLE,
  HEXGRID_HEX_SIZE, HEXGRID_CREW_ID, HEXGRID_VEHICLE_ID, HEXGRID_SELECTED_HEX,
  HEXGRID_PLACEMENT_MODE, HEXGRID_MAP_IMAGE, HEXGRID_ICON_COLOR,
  HEXGRID_SHOW_COORDINATES,
  TIMELINE_START, TIMELINE_END, TIMELINE_MIN, TIMELINE_MAX,
  ACTIVE_TIMELINE_RESOURCE, ACTIVE_TIMELINE_RESOURCE_TYPE,
  MAIN_SEARCH, SELECTED_ID, SELECTED_RESOURCE
};

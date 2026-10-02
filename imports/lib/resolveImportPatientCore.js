// imports/lib/resolveImportPatientCore.js
//
// Pure, dependency-free core for import-attachment precedence (design v2 §B).
// Given an already-resolved PatientSet (from resolvePatientSetCore), the
// client-selected patient id, and the import payload's own Patient list, it
// applies the v2 attachment precedence and returns { patientId, source,
// display }.
//
// NO Meteor / lodash / global imports: the Meteor wrapper
// (resolveImportPatient.js) fetches the PatientSet and hands it in, so this
// core unit-tests bare via `node --test` (see
// tests/unit/imports/lib/resolveImportPatient.test.mjs). Authored as
// dependency-free CommonJS (patientSetCore.js / importRunTags.js precedent):
// CI's lib-unit-tests job runs `node --test` off a bare checkout with no npm
// install, and plain node classifies a .js under a type:commonjs package as
// CJS. ESM import sites (rspack bundle) interop fine via default import.
//
// ── Attachment precedence (design v2 §B) ──────────────────────────────────
//   1. selected       — clientPatientId ∈ permitted set (patient-role) OR the
//                        caller is a clinician (unrestricted). The selection is
//                        a FOCUS gesture, honored unless a patient-role user is
//                        pointing outside their own set.
//   2. profile-linked — else the account's primaryPatientId (home Patient).
//                        SUPPRESSED when the set is 'stale-link' / primaryExists
//                        is false: the home Patient no longer exists, so the raw
//                        id must never be reported as a healthy profile link.
//   3. payload-created — else the import's own Patient (FHIR bundle Patient,
//                        buildPatientFromDicom stub, Facebook/Apple-derived).
//   4. unlinked        — nothing resolvable and no payload Patient (clinician
//                        warehouse-only path; recoverable via importRuns.flush).
//   5. stale-link      — the account's profile links to a deleted Patient and
//                        there is no in-set selection and no payload Patient.
//                        { patientId: null } — the banner tells the user to fix
//                        the link in My Profile before importing.

// isClinicianRole is duplicated (not imported) so this core stays dependency-
// free and bare-node testable. Kept in sync with patientSetCore.isClinicianRole.
function isClinicianRole(role) {
  return role === 'healthcare practitioner' || role === 'healthcare provider';
}

// Normalize a payload Patient entry down to { patientId, display }. Payload
// Patients are plain objects that already carry _id / id (buildPatientFromDicom
// mints both). We attach downstream by the record's `_id` (dedup source of
// truth per .claude/rules/anti-patterns/id-lookup.md) — fall back to FHIR `id`
// only when `_id` is absent, and NEVER OR the two together in one lookup.
function payloadPatientIdentity(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }
  var mongoId = entry._id !== undefined && entry._id !== null && entry._id !== ''
    ? String(entry._id)
    : null;
  var fhirId = entry.id !== undefined && entry.id !== null && entry.id !== ''
    ? String(entry.id)
    : null;
  var patientId = mongoId !== null ? mongoId : fhirId;
  if (patientId === null) {
    return null;
  }
  return { patientId: patientId, display: displayFor(entry) };
}

// Human display for a Patient-ish object: prefer name[0].text, then a
// given+family join, then any provided display string, else ''.
function displayFor(entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }
  if (typeof entry.display === 'string' && entry.display.length > 0) {
    return entry.display;
  }
  var names = Array.isArray(entry.name) ? entry.name : [];
  if (names.length > 0) {
    var name0 = names[0] || {};
    if (typeof name0.text === 'string' && name0.text.length > 0) {
      return name0.text;
    }
    var given = Array.isArray(name0.given) ? name0.given.join(' ') : '';
    var family = typeof name0.family === 'string' ? name0.family : '';
    var joined = (given + ' ' + family).trim();
    if (joined.length > 0) {
      return joined;
    }
  }
  return '';
}

// True when `clientPatientId` names a member of the permitted set — matching
// against every id shape the set emits (memberPatientIds already carries both
// each member's `_id` and, when distinct, its FHIR `id`).
function selectionInSet(clientPatientId, memberPatientIds) {
  if (clientPatientId === null || clientPatientId === undefined || clientPatientId === '') {
    return false;
  }
  var members = Array.isArray(memberPatientIds) ? memberPatientIds : [];
  var target = String(clientPatientId);
  for (var i = 0; i < members.length; i++) {
    if (String(members[i]) === target) {
      return true;
    }
  }
  return false;
}

// Find the display for a set member id, if the caller supplied a display map.
// setMemberDisplays is an optional { id: display } lookup the wrapper may
// populate from resolved docs; absent it, display is ''.
function displayForSetId(patientId, setMemberDisplays) {
  if (!setMemberDisplays || typeof setMemberDisplays !== 'object') {
    return '';
  }
  var display = setMemberDisplays[String(patientId)];
  return typeof display === 'string' ? display : '';
}

/**
 * Apply import-attachment precedence.
 *
 * @param {Object} args
 * @param {Object} args.patientSet        - resolvePatientSetCore output:
 *   { primaryPatientId, memberPatientIds, source, role }
 * @param {string} [args.clientPatientId] - Session-selected patient id (focus)
 * @param {Array}  [args.payloadPatients] - payload Patient list [{_id,id,display,name?}]
 * @param {Object} [args.setMemberDisplays] - optional { id: display } for set ids
 * @returns {{ patientId: (string|null), source: string, display: string }}
 *   source ∈ 'selected' | 'profile-linked' | 'payload-created' | 'unlinked' | 'stale-link'
 */
function resolveImportPatientCore(args) {
  args = args || {};
  var patientSet = args.patientSet || {};
  var clientPatientId = args.clientPatientId;
  var payloadPatients = Array.isArray(args.payloadPatients) ? args.payloadPatients : [];
  var setMemberDisplays = args.setMemberDisplays || {};

  var role = patientSet.role || 'patient';
  var clinician = isClinicianRole(role);
  var memberPatientIds = Array.isArray(patientSet.memberPatientIds) ? patientSet.memberPatientIds : [];
  var primaryPatientId = patientSet.primaryPatientId || null;

  // A stale profile link: the account declares a home Patient that no longer
  // exists. 'stale-link' source (from patientSetCore) or an explicit
  // primaryExists === false both signal it. The raw primaryPatientId is kept for
  // messaging but must NEVER be emitted as a healthy 'profile-linked' target.
  var primaryIsStale = patientSet.source === 'stale-link' || patientSet.primaryExists === false;

  // 1. Selected — honor the focus selection when a patient-role user selected a
  //    member of their own set, or when the caller is a clinician (unrestricted).
  //    Still valid under a stale link: memberPatientIds carries only REAL
  //    reverse-linked records, so an in-set selection is a live patient.
  var hasSelection = clientPatientId !== null && clientPatientId !== undefined && clientPatientId !== '';
  if (hasSelection && (clinician || selectionInSet(clientPatientId, memberPatientIds))) {
    return {
      patientId: String(clientPatientId),
      source: 'selected',
      display: displayForSetId(clientPatientId, setMemberDisplays)
    };
  }

  // 2. Profile-linked — fall back to the account's home Patient. (A patient-role
  //    user who selected a foreign id lands here — never denied, never leaked;
  //    the diagnostic that they selected outside their set is surfaced by PR5.)
  //    SUPPRESSED for a stale link: the home Patient is gone, so we skip to the
  //    payload / stale-link outcomes rather than report a phantom link.
  if (primaryPatientId && !primaryIsStale) {
    return {
      patientId: String(primaryPatientId),
      source: 'profile-linked',
      display: displayForSetId(primaryPatientId, setMemberDisplays)
    };
  }

  // 3. Payload-created — no selection, no profile link: use the import's own
  //    Patient (first usable payload Patient). Relaxed creation (design v2 §B):
  //    any importer may create a Patient; provenance tags + importRuns make it
  //    recoverable.
  for (var i = 0; i < payloadPatients.length; i++) {
    var identity = payloadPatientIdentity(payloadPatients[i]);
    if (identity) {
      return {
        patientId: identity.patientId,
        source: 'payload-created',
        display: identity.display
      };
    }
  }

  // 4. Stale-link — the profile links to a deleted Patient and nothing else
  //    resolved (no in-set selection, no payload Patient). Distinct from
  //    'unlinked' so the banner can point the user at My Profile to fix the
  //    dangling link rather than offer a warehouse re-attach.
  if (primaryIsStale) {
    return { patientId: null, source: 'stale-link', display: '' };
  }

  // 5. Unlinked — nothing resolvable and no payload Patient.
  return { patientId: null, source: 'unlinked', display: '' };
}

module.exports = {
  isClinicianRole: isClinicianRole,
  payloadPatientIdentity: payloadPatientIdentity,
  displayFor: displayFor,
  selectionInSet: selectionInSet,
  resolveImportPatientCore: resolveImportPatientCore
};

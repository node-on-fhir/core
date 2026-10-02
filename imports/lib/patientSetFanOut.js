// imports/lib/patientSetFanOut.js
//
// Pure, dependency-free decision helper for the link-aware READ fan-out
// (design v2 PR8). It answers ONE question: for an already-authorized request
// against Patient/<target>, should the SEARCH be widened across the requesting
// account's link-resolved PatientSet, and if so, over which patient ids?
//
// ⚠️ COMPLIANCE (ONC (g)(10) / Inferno): the FHIR REST patient compartment,
// $everything, and $ehi-export are certification surfaces. A SMART/OAuth token
// authorized for Patient/X must NEVER be widened to return linked Patient/Y's
// data. So fan-out is gated on THREE conditions, ALL required:
//
//   1. NOT token-authorized — the request is an interactive logged-in Meteor
//      user (resumed login token / session header / dev auto-login), NOT a
//      SMART/OAuth bearer token or OAuth basic-auth client. The caller passes
//      isTokenAuthorized derived from the authorizationContext's
//      isOAuthToken / isOAuthClient flags (see server/lib/FhirAuth.js
//      parseUserAuthorization — only OAuth paths set those flags).
//   2. settingEnabled — settings.private.accessControl.patientSetFanOut is
//      true. Default FALSE (off unless explicitly enabled). When absent/false
//      behavior is byte-for-byte identical to today.
//   3. targetPatientId ∈ memberPatientIds — the account's resolved PatientSet
//      actually contains the target. This never WIDENS authorization (the
//      compartment check already authorized the target); it only expands the
//      search to the sibling records the interactive user legitimately owns.
//
// When any condition fails, fanOut is false and patientIds is [targetPatientId]
// (the single-id path — identical to the pre-PR8 behavior). Fan-out only ever
// ADDS the account's own linked ids; it can never drop the target.
//
// Dependency-free ESM (default export at the bottom, mirroring
// patientSetCore.js) so it bare-node unit-tests via `node --test`
// --experimental-detect-module in the lib-unit-tests tier, and bundles cleanly
// into the server. Consumers default-import and destructure.

// Normalize an id to a comparable string, or null when empty/missing.
function normalizeId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

// shouldFanOut({ isTokenAuthorized, settingEnabled, targetPatientId, memberPatientIds })
//   -> { fanOut: boolean, patientIds: string[] }
//
//   isTokenAuthorized — true for SMART/OAuth bearer tokens and OAuth clients
//                       (certification surfaces). Fan-out is FORBIDDEN for these.
//   settingEnabled    — settings.private.accessControl.patientSetFanOut (default false)
//   targetPatientId   — the Patient/<id> the request targets
//   memberPatientIds  — the requesting account's resolved PatientSet ids
//                       (resolvePatientSet().memberPatientIds), or [] when none.
//
// Returns:
//   fanOut     — true only when all three gate conditions hold
//   patientIds — the ids to search over: the full member set when fanOut,
//                else exactly [targetPatientId] (single-id, unchanged behavior)
function shouldFanOut(options) {
  options = options || {};

  const target = normalizeId(options.targetPatientId);

  // No resolvable target → nothing to fan out; hand back whatever the target
  // normalized to (possibly empty) so the caller's existing single-id path is
  // byte-for-byte preserved.
  const singleId = target !== null ? [target] : [];

  // Gate 1: token-authorized requests are NEVER fanned out (compliance).
  if (options.isTokenAuthorized) {
    return { fanOut: false, patientIds: singleId };
  }

  // Gate 2: the feature must be explicitly enabled (default off).
  if (!options.settingEnabled) {
    return { fanOut: false, patientIds: singleId };
  }

  // Gate 3: the account's PatientSet must actually contain the target.
  const members = Array.isArray(options.memberPatientIds) ? options.memberPatientIds : [];
  const normalizedMembers = [];
  const seen = {};
  let targetInSet = false;
  for (let i = 0; i < members.length; i++) {
    const memberId = normalizeId(members[i]);
    if (memberId === null || Object.prototype.hasOwnProperty.call(seen, memberId)) {
      continue;
    }
    seen[memberId] = true;
    normalizedMembers.push(memberId);
    if (target !== null && memberId === target) {
      targetInSet = true;
    }
  }

  if (target === null || !targetInSet) {
    // Target not in the resolved set — do NOT widen. (Also covers the empty-set
    // case.) Preserve the single-id path.
    return { fanOut: false, patientIds: singleId };
  }

  // All gates pass: fan the search across the full member set. The target is
  // guaranteed present (targetInSet), so no data is dropped.
  return { fanOut: true, patientIds: normalizedMembers };
}

// Derive isTokenAuthorized from an authorizationContext. TRUE when the context
// came from a SMART/OAuth bearer token (isOAuthToken) or an OAuth client
// credential (isOAuthClient) — the certification surfaces fan-out must never
// touch. Interactive Meteor-user contexts (resumed login token, session header,
// dev auto-login) set NEITHER flag, so they return false. Also treats the
// service/system accounts as token-authorized (non-interactive) defensively —
// they are compartment-exempt anyway and should never be widened by a user's
// personal link set.
function isTokenAuthorizedContext(authorizationContext) {
  if (!authorizationContext) {
    return false;
  }
  if (authorizationContext.isOAuthToken || authorizationContext.isOAuthClient) {
    return true;
  }
  if (authorizationContext.isSystemAccount) {
    return true;
  }
  const role = authorizationContext.role;
  if (role === 'SYSTEM' || role === 'system' || role === 'noauth') {
    return true;
  }
  return false;
}

const patientSetFanOut = {
  shouldFanOut: shouldFanOut,
  isTokenAuthorizedContext: isTokenAuthorizedContext
};

export default patientSetFanOut;

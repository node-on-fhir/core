// imports/lib/patientSetCore.js
//
// Pure, dependency-free core for the link-aware patient-set resolver (design
// v2 §A). It computes an account's PatientSet — the set of Patient resources an
// account may act as / read across — by a bounded, bidirectional transitive
// closure over Patient.link. NO Meteor / lodash / global imports: the Meteor
// wrapper (resolvePatientSet.js) injects async collection interfaces so this
// core unit-tests bare via `node --test` (see
// tests/unit/imports/lib/patientSetCore.test.mjs).
//
// Authored as dependency-free ESM (default export at the bottom — see the
// comment there for why NOT CommonJS: the rspack CLIENT bundle rejects
// module.exports). CI's lib-unit-tests job runs the test with
// --experimental-detect-module (established ESM-subject pattern).

// ── Link semantics (design v2 §A "Which link.types traverse") ─────────────
// seealso              — canonical "same person, different record"; both dirs.
// replaces/replaced-by — merge lineage (Deduplicator writes 'replaces'); both.
// refer                — a pointer, often cross-person (mother<->newborn); NOT
//                        an identity assertion. EXCLUDED from the set.
var TRAVERSED_LINK_TYPES = ['seealso', 'replaces', 'replaced-by'];

// Bounds on the fan-out (design v2 §A "Cap depth/breadth"). When a cap trips we
// log a warning (via the injected logger) and return the PARTIAL set rather
// than looping or exploding O(n).
var MAX_MEMBERS = 64;
var MAX_DEPTH = 8;

// A no-op logger so the core never hard-depends on a logger being injected.
var NOOP_LOGGER = { warn: function () {}, debug: function () {}, error: function () {} };

// ── id / reference normalization ──────────────────────────────────────────
//
// A Patient carries a MongoDB `_id` (primary key) AND a FHIR `id`; the two may
// differ. Set membership is TRACKED BY `_id` (the anti-collision source of
// truth — never mix `_id`/`id` in one lookup, per
// .claude/rules/anti-patterns/id-lookup.md). But a link reference written by
// another system may address a member by EITHER its `_id` or its FHIR `id`, in
// any of the usual reference shapes. So:
//   - to DEDUP, we resolve any referenced id back to the owning record's `_id`;
//   - to FILTER downstream (subject.reference / patient.reference), we emit
//     BOTH the `_id` and the FHIR `id` in memberPatientIds when they differ,
//     because different resources may reference a patient by either form.

// Strip a Patient reference down to its bare id: 'Patient/123' -> '123',
// 'urn:uuid:123' -> '123', bare '123' -> '123'.
function bareId(reference) {
  if (typeof reference !== 'string' || reference.length === 0) {
    return null;
  }
  var value = reference;
  if (value.indexOf('urn:uuid:') === 0) {
    value = value.substring('urn:uuid:'.length);
  }
  var slash = value.lastIndexOf('/');
  if (slash !== -1) {
    value = value.substring(slash + 1);
  }
  return value.length > 0 ? value : null;
}

// The reference-shape variants a Patient.link.other.reference might use to name
// a given bare id — for the REVERSE lookup ($in). Covers the three forms in
// patientCompartment.patientRefVariants plus the bare id itself.
function referenceVariants(id) {
  if (id === null || id === undefined || id === '') {
    return [];
  }
  return [String(id), 'Patient/' + id, 'urn:uuid:' + id];
}

// Extract the set of bare ids a Patient doc links to via a TRAVERSED link type
// (outbound edges). Ignores 'refer' and malformed entries.
function outboundLinkedIds(patientDoc) {
  var result = [];
  var links = patientDoc && Array.isArray(patientDoc.link) ? patientDoc.link : [];
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (!link || TRAVERSED_LINK_TYPES.indexOf(link.type) === -1) {
      continue;
    }
    var ref = link.other ? link.other.reference : null;
    var id = bareId(ref);
    if (id !== null) {
      result.push(id);
    }
  }
  return result;
}

// The identity keys a single Patient doc is known by (its `_id` and, when
// distinct, its FHIR `id`). Used both to seed reverse-lookup variants and to
// build memberPatientIds.
function docIdentityKeys(patientDoc) {
  var keys = [];
  if (!patientDoc) {
    return keys;
  }
  if (patientDoc._id !== undefined && patientDoc._id !== null && patientDoc._id !== '') {
    keys.push(String(patientDoc._id));
  }
  var fhirId = patientDoc.id;
  if (fhirId !== undefined && fhirId !== null && fhirId !== '' && String(fhirId) !== String(patientDoc._id)) {
    keys.push(String(fhirId));
  }
  return keys;
}

// ── Collection adapter contract ───────────────────────────────────────────
//
// The injected `patients` interface must expose:
//   findOneByMongoId(mongoId)      -> Promise<doc|null>   (lookup by `_id`)
//   findOneByFhirId(fhirId)        -> Promise<doc|null>   (SEPARATE `{id}` query
//                                                          fallback — never a
//                                                          `_id`||`id` mix)
//   findByLinkReferences(refs, types) -> Promise<doc[]>   (reverse lookup:
//                                        docs whose link.other.reference ∈ refs
//                                        AND link.type ∈ types)
//
// resolvePatientSet.js builds these over a live Mongo.Collection; tests inject
// in-memory fakes.

// Look up a Patient by a bare id: try Mongo `_id` first, then a SEPARATE FHIR
// `{id}` query. Two distinct queries — NEVER a `$or`/`||` between `_id` and
// `id` (id-collision anti-pattern).
async function lookupPatient(patients, id) {
  if (id === null || id === undefined || id === '') {
    return null;
  }
  var byMongo = await patients.findOneByMongoId(id);
  if (byMongo) {
    return byMongo;
  }
  var byFhir = await patients.findOneByFhirId(id);
  return byFhir || null;
}

// Bounded bidirectional BFS transitive closure over Patient.link.
//
//   patients  — injected collection adapter (above)
//   rootIds   — seed bare ids (typically [primaryPatientId])
//   logger    — { warn, debug } (optional)
//
// Returns { memberMongoIds, memberPatientIds, capTripped }:
//   memberMongoIds  — Set of the `_id` of every reached Patient (dedup key)
//   memberPatientIds — deduped array of ids for downstream reference filters:
//                      each member's `_id` AND, when distinct, its FHIR `id`
//   capTripped      — 'members' | 'depth' | null
async function traverseLinkClosure(patients, rootIds, logger) {
  logger = logger || NOOP_LOGGER;

  var memberMongoIds = new Set();   // owning-record `_id` — the dedup identity
  var memberPatientIds = [];        // downstream filter ids (_id + fhir id)
  var emittedFilterIds = new Set(); // guards memberPatientIds dedup
  var capTripped = null;

  // Resolve the seed ids to their owning records first, so reverse-lookup
  // variants can include a member's FHIR id even when seeded by `_id`.
  var frontier = [];
  for (var r = 0; r < rootIds.length; r++) {
    var seedDoc = await lookupPatient(patients, rootIds[r]);
    if (!seedDoc) {
      continue;
    }
    var addedSeed = admitMember(seedDoc);
    if (addedSeed) {
      frontier.push(seedDoc);
    }
    if (capTripped === 'members') {
      break;
    }
  }

  var depth = 0;
  while (frontier.length > 0 && capTripped === null) {
    if (depth >= MAX_DEPTH) {
      capTripped = 'depth';
      logger.warn('resolvePatientSet: link traversal hit max depth', { maxDepth: MAX_DEPTH, members: memberMongoIds.size });
      break;
    }
    depth++;

    var nextFrontier = [];

    // Gather this level's neighbors: outbound edges + reverse edges.
    var neighborIds = [];        // bare ids reached outbound
    var reverseRefVariants = []; // reference variants to reverse-match on

    for (var f = 0; f < frontier.length; f++) {
      var doc = frontier[f];
      var outbound = outboundLinkedIds(doc);
      for (var o = 0; o < outbound.length; o++) {
        neighborIds.push(outbound[o]);
      }
      var keys = docIdentityKeys(doc);
      for (var k = 0; k < keys.length; k++) {
        var variants = referenceVariants(keys[k]);
        for (var v = 0; v < variants.length; v++) {
          reverseRefVariants.push(variants[v]);
        }
      }
    }

    // Reverse lookup: records that point AT a current member (links written on
    // a hospital record won't be mirrored onto ours).
    var reverseDocs = [];
    if (reverseRefVariants.length > 0) {
      reverseDocs = await patients.findByLinkReferences(uniqueArray(reverseRefVariants), TRAVERSED_LINK_TYPES);
    }

    // Admit outbound neighbors (resolve id -> doc).
    for (var n = 0; n < neighborIds.length && capTripped === null; n++) {
      var neighborDoc = await lookupPatient(patients, neighborIds[n]);
      if (!neighborDoc) {
        continue;
      }
      if (admitMember(neighborDoc)) {
        nextFrontier.push(neighborDoc);
      }
    }

    // Admit reverse neighbors.
    for (var rd = 0; rd < reverseDocs.length && capTripped === null; rd++) {
      if (admitMember(reverseDocs[rd])) {
        nextFrontier.push(reverseDocs[rd]);
      }
    }

    frontier = nextFrontier;
  }

  return { memberMongoIds: memberMongoIds, memberPatientIds: memberPatientIds, capTripped: capTripped };

  // Admit a doc into the member set. Returns true if newly added (so it should
  // be traversed), false if already seen (cycle guard) or the cap tripped.
  function admitMember(doc) {
    var mongoId = doc && doc._id !== undefined && doc._id !== null ? String(doc._id) : null;
    // Fall back to FHIR id as the dedup key when a doc has no _id (defensive).
    var dedupKey = mongoId !== null ? mongoId : (doc && doc.id !== undefined && doc.id !== null ? 'fhir:' + String(doc.id) : null);
    if (dedupKey === null) {
      return false;
    }
    if (memberMongoIds.has(dedupKey)) {
      return false; // cycle / already reached
    }
    if (memberMongoIds.size >= MAX_MEMBERS) {
      if (capTripped === null) {
        capTripped = 'members';
        logger.warn('resolvePatientSet: link traversal hit max members', { maxMembers: MAX_MEMBERS });
      }
      return false;
    }
    memberMongoIds.add(dedupKey);
    // Emit BOTH the _id and (when distinct) the FHIR id for downstream filters.
    var filterKeys = docIdentityKeys(doc);
    for (var i = 0; i < filterKeys.length; i++) {
      if (!emittedFilterIds.has(filterKeys[i])) {
        emittedFilterIds.add(filterKeys[i]);
        memberPatientIds.push(filterKeys[i]);
      }
    }
    return true;
  }
}

function uniqueArray(arr) {
  var seen = {};
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(seen, arr[i])) {
      seen[arr[i]] = true;
      out.push(arr[i]);
    }
  }
  return out;
}

// ── Role handling ─────────────────────────────────────────────────────────
//
// Mirrors getAuthorizedRole in server/publications/selectedPatient.js:190-211
// (the same precedence patients.js and FhirAuth.js use). Kept in sync by hand
// — see that source. Duplicated (not imported) so this core stays dependency-
// free and bare-node testable.
function getAuthorizedRole(userRoles) {
  if (!Array.isArray(userRoles)) return 'patient';

  var practitionerVariants = ['healthcare practitioner', 'healthcare-practitioner', 'practitioner'];
  var providerVariants = ['healthcare provider', 'healthcare-provider'];

  for (var i = 0; i < userRoles.length; i++) {
    if (practitionerVariants.indexOf(userRoles[i]) !== -1) {
      return 'healthcare practitioner';
    }
  }
  for (var j = 0; j < userRoles.length; j++) {
    if (providerVariants.indexOf(userRoles[j]) !== -1) {
      return 'healthcare provider';
    }
  }
  if (userRoles.indexOf('patient') !== -1) {
    return 'patient';
  }
  return 'patient';
}

function isClinicianRole(role) {
  return role === 'healthcare practitioner' || role === 'healthcare provider';
}

// ── The core resolver ─────────────────────────────────────────────────────
//
// resolvePatientSetCore(user, patients, logger) -> {
//   primaryPatientId, linkedPatientIds, memberPatientIds, source, role
// }
//
//   user     — the account doc (already fetched): { roles, patientId,
//              profile: { patientId } }
//   patients — injected collection adapter (see contract above)
//   logger   — optional { warn, debug }
//
// source ∈ 'profile+link' | 'profile-only' | 'clinician-full' | 'stale-link' | 'empty':
//   clinician-full — user is a clinician role. The set is STILL computed from
//                    their own user.patientId if any, but callers treat
//                    clinicians as unrestricted (compartment-exempt), so this
//                    value is a signal, not a boundary.
//   profile+link   — patient-role, has a primary, and linking reached >1 member.
//   profile-only   — patient-role, has a primary, no additional linked records.
//   stale-link     — the account declares a primary (user.patientId) but that
//                    Patient record does NOT resolve (deleted / dangling id).
//                    We do NOT synthesize a phantom member from the raw id;
//                    memberPatientIds carries ONLY real records the closure
//                    reached via reverse links (if any). primaryPatientId keeps
//                    the raw stale id for messaging; primaryExists is false.
//   empty          — no resolvable primary patient (and none declared).
//
// primaryExists — boolean: true on every healthy path (the declared primary
//   resolved, or there was no declared primary to resolve for empty/
//   clinician-full); false ONLY for 'stale-link', where the declared primary
//   points at a record that no longer exists.
async function resolvePatientSetCore(user, patients, logger) {
  logger = logger || NOOP_LOGGER;

  if (!user) {
    return emptySet('patient');
  }

  var role = getAuthorizedRole(user.roles);

  // The account's "home" Patient (user.patientId, then profile.patientId).
  var primaryRaw = user.patientId || (user.profile ? user.profile.patientId : null) || null;

  if (!primaryRaw) {
    if (role === 'patient') {
      logger.debug('resolvePatientSet: patient-role user has no patientId', {});
    }
    // Clinicians without a home patient are still 'clinician-full' (unrestricted
    // by role); patient-role users with no primary get the empty set.
    if (isClinicianRole(role)) {
      return {
        primaryPatientId: null,
        linkedPatientIds: [],
        memberPatientIds: [],
        source: 'clinician-full',
        primaryExists: true,
        role: role
      };
    }
    return emptySet(role);
  }

  // Resolve the primary to its owning record so primaryPatientId is expressed
  // as the record's `_id` (dedup identity) when the doc exists.
  var primaryDoc = await lookupPatient(patients, primaryRaw);
  var primaryPatientId = primaryDoc && primaryDoc._id !== undefined && primaryDoc._id !== null
    ? String(primaryDoc._id)
    : String(primaryRaw);

  var closure = await traverseLinkClosure(patients, [primaryRaw], logger);

  // Members other than the primary record are the "linked" ones. Compare by the
  // primary record's identity keys so both _id and fhir id forms are excluded.
  var primaryKeys = primaryDoc ? docIdentityKeys(primaryDoc) : [String(primaryRaw)];
  var primaryKeySet = {};
  for (var p = 0; p < primaryKeys.length; p++) {
    primaryKeySet[primaryKeys[p]] = true;
  }
  var linkedPatientIds = closure.memberPatientIds.filter(function (memberId) {
    return !primaryKeySet[memberId];
  });

  // STALE PROFILE-LINK: the account declares a primary but the record does not
  // resolve (deleted / dangling user.patientId). We must NOT synthesize a
  // phantom single-member set from the raw id — doing so made a deleted profile
  // link look like a healthy 'profile-linked' attachment (operator-reported
  // recurrence). Instead, filter the stale raw id's identity out of any members
  // the closure found and keep ONLY real reverse-linked records.
  if (!primaryDoc) {
    var staleKeys = {};
    var rawVariants = [String(primaryRaw)].concat(referenceVariants(primaryRaw));
    for (var s = 0; s < rawVariants.length; s++) {
      staleKeys[rawVariants[s]] = true;
    }
    var realMembers = closure.memberPatientIds.filter(function (memberId) {
      return !staleKeys[memberId];
    });

    // Any surviving members are genuine reverse-linked records reachable from
    // the (now-deleted) primary. Clinicians remain unrestricted.
    var staleSource = isClinicianRole(role) ? 'clinician-full' : 'stale-link';

    logger.debug('resolvePatientSet: primary Patient record does not resolve (stale link)', {
      primaryRaw: String(primaryRaw),
      realMemberCount: realMembers.length
    });

    return {
      primaryPatientId: String(primaryRaw),
      linkedPatientIds: realMembers,
      memberPatientIds: realMembers,
      source: staleSource,
      primaryExists: false,
      role: role
    };
  }

  // memberPatientIds is primary + linked, already deduped by the closure. The
  // primary doc resolved, so the closure necessarily admitted it as a member.
  var memberPatientIds = closure.memberPatientIds;

  var source;
  if (isClinicianRole(role)) {
    source = 'clinician-full';
  } else if (linkedPatientIds.length > 0) {
    source = 'profile+link';
  } else {
    source = 'profile-only';
  }

  return {
    primaryPatientId: primaryPatientId,
    linkedPatientIds: linkedPatientIds,
    memberPatientIds: memberPatientIds,
    source: source,
    primaryExists: true,
    role: role
  };
}

function emptySet(role) {
  return {
    primaryPatientId: null,
    linkedPatientIds: [],
    memberPatientIds: [],
    source: 'empty',
    // No declared primary to resolve — a healthy (if empty) shape, not stale.
    primaryExists: true,
    role: role || 'patient'
  };
}

// ESM default export (NOT module.exports): this file is bundled into the
// CLIENT via PatientGuard.jsx, and the rspack client pipeline rejects
// module.exports assignments ("ES Modules may not assign module.exports").
// Bare `node --test` runs it via --experimental-detect-module (the
// ESM-subject script pattern — see test:smart-launch et al). All consumers
// default-import and destructure, so the aggregate default keeps every call
// site working.
const patientSetCore = {
  TRAVERSED_LINK_TYPES: TRAVERSED_LINK_TYPES,
  MAX_MEMBERS: MAX_MEMBERS,
  MAX_DEPTH: MAX_DEPTH,
  bareId: bareId,
  referenceVariants: referenceVariants,
  outboundLinkedIds: outboundLinkedIds,
  docIdentityKeys: docIdentityKeys,
  getAuthorizedRole: getAuthorizedRole,
  isClinicianRole: isClinicianRole,
  traverseLinkClosure: traverseLinkClosure,
  resolvePatientSetCore: resolvePatientSetCore
};

export default patientSetCore;

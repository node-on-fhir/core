// imports/lib/patientLinkCore.js
//
// Pure, dependency-free core for reciprocal Patient.link management (design v2
// §C, PR3). It computes the link-array mutations for patients.link /
// patients.unlink; the Meteor method wrapper (imports/api/patientLinks/methods.js)
// resolves the two Patient docs (`_id`-disciplined) and applies these results via
// updateAsync $push/$pull. NO Meteor / lodash / global imports so it unit-tests
// bare via `node --test` (tests/unit/imports/lib/patientLinkCore.test.mjs) — same
// dependency-free-CJS posture as patientSetCore.js / importRunTags.js.

// ── Link-type semantics (design v2 §C) ────────────────────────────────────
// patients.link accepts 'seealso' (default) and 'replaces'. The RECIPROCAL
// (mirror) type written on the other record:
//   seealso  -> seealso     (symmetric "same person, different record")
//   replaces -> replaced-by (A replaces B  =>  B replaced-by A)
// 'refer' and any unknown type are REJECTED (refer is a cross-person pointer,
// reserved for the future Consent/dependent path — see patientSetCore.js).
var MIRROR_TYPE = {
  seealso: 'seealso',
  replaces: 'replaced-by'
};

// The types callers may pass to patients.link. ('replaced-by' is derived as a
// mirror, never requested directly.)
var ALLOWED_LINK_TYPES = ['seealso', 'replaces'];

function isAllowedLinkType(type) {
  return Object.prototype.hasOwnProperty.call(MIRROR_TYPE, type);
}

function mirrorType(type) {
  return MIRROR_TYPE[type] || null;
}

// The canonical outbound reference form a Patient.link entry uses to name a
// target: 'Patient/<id>'. Prefer the target's FHIR `id`, falling back to its
// Mongo `_id` when the record carries no FHIR id (design v2 §C).
function referenceForTarget(targetDoc) {
  if (!targetDoc) {
    return null;
  }
  var fhirId = targetDoc.id;
  if (fhirId !== undefined && fhirId !== null && fhirId !== '') {
    return 'Patient/' + String(fhirId);
  }
  if (targetDoc._id !== undefined && targetDoc._id !== null && targetDoc._id !== '') {
    return 'Patient/' + String(targetDoc._id);
  }
  return null;
}

// Every reference SHAPE that could name a given doc (for matching existing
// entries / removal). Covers both the FHIR-id and _id reference forms, in
// Patient/<id>, urn:uuid:<id>, and bare-id variants.
function referenceShapesForTarget(targetDoc) {
  var shapes = [];
  if (!targetDoc) {
    return shapes;
  }
  var ids = [];
  if (targetDoc.id !== undefined && targetDoc.id !== null && targetDoc.id !== '') {
    ids.push(String(targetDoc.id));
  }
  if (targetDoc._id !== undefined && targetDoc._id !== null && targetDoc._id !== '' && String(targetDoc._id) !== String(targetDoc.id)) {
    ids.push(String(targetDoc._id));
  }
  for (var i = 0; i < ids.length; i++) {
    shapes.push('Patient/' + ids[i]);
    shapes.push('urn:uuid:' + ids[i]);
    shapes.push(ids[i]);
  }
  return shapes;
}

// Does a Patient's existing link array already contain an entry for `reference`
// with `type`? (idempotency guard — match by any reference shape of the target).
function hasLinkEntry(links, referenceShapes, type) {
  var arr = Array.isArray(links) ? links : [];
  var shapeSet = {};
  for (var s = 0; s < referenceShapes.length; s++) {
    shapeSet[referenceShapes[s]] = true;
  }
  for (var i = 0; i < arr.length; i++) {
    var link = arr[i];
    if (!link || link.type !== type) {
      continue;
    }
    var ref = link.other ? link.other.reference : null;
    if (ref !== null && ref !== undefined && shapeSet[ref] === true) {
      return true;
    }
  }
  return false;
}

// ── buildReciprocalEntries ────────────────────────────────────────────────
//
// Compute the two link entries (A->B and B->A mirror) plus per-side idempotency
// flags. Pure: takes the two resolved docs + requested type, returns a plan the
// method applies with $push. Throws-free — validity is reported, not thrown, so
// the method controls the Meteor.Error surface (but a convenience validate()
// helper is exported too).
//
//   docA, docB — resolved Patient docs (must have _id and optionally id)
//   linkType   — requested type on A ('seealso' | 'replaces')
//
// Returns {
//   valid, reason,                     // reason set when !valid ('invalid-link-type' | 'missing-doc' | 'self-link')
//   entryOnA: { other:{reference}, type },   // A -> B (linkType)
//   entryOnB: { other:{reference}, type },   // B -> A (mirror type)
//   alreadyOnA, alreadyOnB              // booleans — entry already present (skip $push)
// }
function buildReciprocalEntries(docA, docB, linkType) {
  var type = linkType || 'seealso';

  if (!isAllowedLinkType(type)) {
    return { valid: false, reason: 'invalid-link-type' };
  }
  if (!docA || !docB) {
    return { valid: false, reason: 'missing-doc' };
  }

  var refToB = referenceForTarget(docB);
  var refToA = referenceForTarget(docA);
  if (refToB === null || refToA === null) {
    return { valid: false, reason: 'missing-doc' };
  }
  if (refToA === refToB || sameDoc(docA, docB)) {
    return { valid: false, reason: 'self-link' };
  }

  var mirror = mirrorType(type);

  var entryOnA = { other: { reference: refToB }, type: type };
  var entryOnB = { other: { reference: refToA }, type: mirror };

  var alreadyOnA = hasLinkEntry(docA.link, referenceShapesForTarget(docB), type);
  var alreadyOnB = hasLinkEntry(docB.link, referenceShapesForTarget(docA), mirror);

  return {
    valid: true,
    reason: null,
    entryOnA: entryOnA,
    entryOnB: entryOnB,
    alreadyOnA: alreadyOnA,
    alreadyOnB: alreadyOnB
  };
}

function sameDoc(docA, docB) {
  if (docA._id !== undefined && docA._id !== null && docB._id !== undefined && docB._id !== null) {
    return String(docA._id) === String(docB._id);
  }
  return false;
}

// ── removeLinkEntries ─────────────────────────────────────────────────────
//
// Compute the surviving link arrays after removing, in BOTH directions, every
// entry referencing the other doc (by any reference shape and any type — unlink
// is type-agnostic). Pure: returns the filtered arrays + whether anything
// changed, so the method can $set only when needed.
//
//   docA, docB — resolved Patient docs
//
// Returns {
//   newLinkA, removedFromA,   // A's link array with entries -> B removed
//   newLinkB, removedFromB
// }
function removeLinkEntries(docA, docB) {
  var shapesForB = referenceShapesForTarget(docB);
  var shapesForA = referenceShapesForTarget(docA);

  var filteredA = filterOutReferences(docA ? docA.link : [], shapesForB);
  var filteredB = filterOutReferences(docB ? docB.link : [], shapesForA);

  return {
    newLinkA: filteredA.kept,
    removedFromA: filteredA.removed,
    newLinkB: filteredB.kept,
    removedFromB: filteredB.removed
  };
}

// Filter a link array, dropping every entry whose other.reference matches one of
// `referenceShapes`. Returns { kept, removed }.
function filterOutReferences(links, referenceShapes) {
  var arr = Array.isArray(links) ? links : [];
  var shapeSet = {};
  for (var s = 0; s < referenceShapes.length; s++) {
    shapeSet[referenceShapes[s]] = true;
  }
  var kept = [];
  var removed = 0;
  for (var i = 0; i < arr.length; i++) {
    var link = arr[i];
    var ref = link && link.other ? link.other.reference : null;
    if (ref !== null && ref !== undefined && shapeSet[ref] === true) {
      removed++;
    } else {
      kept.push(link);
    }
  }
  return { kept: kept, removed: removed };
}

module.exports = {
  MIRROR_TYPE: MIRROR_TYPE,
  ALLOWED_LINK_TYPES: ALLOWED_LINK_TYPES,
  isAllowedLinkType: isAllowedLinkType,
  mirrorType: mirrorType,
  referenceForTarget: referenceForTarget,
  referenceShapesForTarget: referenceShapesForTarget,
  hasLinkEntry: hasLinkEntry,
  buildReciprocalEntries: buildReciprocalEntries,
  removeLinkEntries: removeLinkEntries
};

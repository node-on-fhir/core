// imports/api/patientLinks/methods.js
//
// Patient.link write methods (design v2 §C, PR3) — the write half of the
// link-first PHR. patients.link / patients.unlink give Patient.link a real
// read+write path (it was write-only, only the Deduplicator merge byproduct).
//
// Both methods are `_id`-disciplined: every Patient lookup tries Mongo `_id`
// first, then a SEPARATE `{ id }` FHIR-id query — NEVER a `$or`/`||` mixing
// `_id` and `id` (.claude/rules/anti-patterns/id-lookup.md). The pure
// link-array mutation logic lives in imports/lib/patientLinkCore.js (bare-node
// unit-tested); these method bodies stay thin over that core: resolve docs,
// authorize, apply via updateAsync $push/$pull.
//
// Authorization (design v2 §G) — caller must be authenticated AND one of:
//   (a) clinician role (healthcare practitioner / provider), OR
//   (b) at least one of the two patients ∈ caller's resolvePatientSet
//       memberPatientIds (you may link a record you can already reach), OR
//   (c) settings.private.accessControl.localFamilyMode === true — the explicit,
//       settings-gated "super-family / personal instance" escape.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { resolvePatientSet } from '/imports/lib/resolvePatientSet.js';
import patientSetCore from '/imports/lib/patientSetCore.js';
import patientLinkCore from '/imports/lib/patientLinkCore.js';
import { FhirUtilities } from '/imports/lib/FhirUtilities.js';

const { isClinicianRole } = patientSetCore;
const { buildReciprocalEntries, removeLinkEntries, referenceShapesForTarget } = patientLinkCore;

function getPatientsCollection() {
  return get(global, 'Collections.Patients')
    || get(Meteor, 'Collections.Patients')
    || null;
}

function isLocalFamilyMode() {
  return get(Meteor, 'settings.private.accessControl.localFamilyMode', false) === true;
}

// Resolve a Patient doc by a bare id: Mongo `_id` first, then a SEPARATE `{ id }`
// FHIR-id query. Two distinct queries — never a `_id`||`id` mix.
async function lookupPatientDoc(Patients, id) {
  if (id === null || id === undefined || id === '') {
    return null;
  }
  const byMongo = await Patients.findOneAsync({ _id: id });
  if (byMongo) {
    return byMongo;
  }
  const byFhir = await Patients.findOneAsync({ id: id });
  return byFhir || null;
}

// Authorize a link/unlink between two docs for the calling user. Returns
// { authorized, reason }. Enforces design v2 §G matrix.
async function authorizeLinkOperation(userId, docA, docB, context) {
  if (isLocalFamilyMode()) {
    context.log.debug('patientLinks: authorized via localFamilyMode');
    return { authorized: true, reason: 'localFamilyMode' };
  }

  const set = await resolvePatientSet(userId);

  if (isClinicianRole(set.role)) {
    context.log.debug('patientLinks: authorized via clinician role', { role: set.role });
    return { authorized: true, reason: 'clinician' };
  }

  // Permitted when at least one of the two patients is reachable in the caller's
  // set. Compare against every id/reference shape of each doc so a member listed
  // by _id or FHIR id both match.
  const memberIds = Array.isArray(set.memberPatientIds) ? set.memberPatientIds : [];
  const memberSet = {};
  for (let i = 0; i < memberIds.length; i++) {
    memberSet[String(memberIds[i])] = true;
  }

  if (docIsInSet(docA, memberSet) || docIsInSet(docB, memberSet)) {
    context.log.debug('patientLinks: authorized via patient-set membership');
    return { authorized: true, reason: 'member' };
  }

  return { authorized: false, reason: 'not-in-set' };
}

// True if either the doc's _id or FHIR id is present in the member-id set.
function docIsInSet(doc, memberSet) {
  if (!doc) {
    return false;
  }
  if (doc._id !== undefined && doc._id !== null && memberSet[String(doc._id)] === true) {
    return true;
  }
  if (doc.id !== undefined && doc.id !== null && memberSet[String(doc.id)] === true) {
    return true;
  }
  return false;
}

const NOT_AUTHORIZED_MESSAGE =
  'You may only link Patient records you can already reach through your own patient set, ' +
  'or enable Meteor.settings.private.accessControl.localFamilyMode for local super-family access.';

Meteor.ServerMethods.define('patients.link', {
  description: 'Write reciprocal Patient.link entries between two Patient records (idempotent)',
  phi: true,
  positionalParams: ['patientIdA', 'patientIdB', 'linkType'],
  schemaObject: {
    type: 'object',
    properties: {
      patientIdA: { type: 'string' },
      patientIdB: { type: 'string' },
      linkType: { type: 'string' }
    },
    required: ['patientIdA', 'patientIdB']
  }
}, async function(params, context){
  if (!context.userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to link patient records.');
  }

  const patientIdA = get(params, 'patientIdA');
  const patientIdB = get(params, 'patientIdB');
  const linkType = get(params, 'linkType', 'seealso');

  const Patients = getPatientsCollection();
  if (!Patients) {
    throw new Meteor.Error('collection-unavailable', 'Patients collection is not available.');
  }

  const docA = await lookupPatientDoc(Patients, patientIdA);
  const docB = await lookupPatientDoc(Patients, patientIdB);
  if (!docA || !docB) {
    throw new Meteor.Error('not-found', 'One or both Patient records were not found.');
  }

  // Compute the reciprocal plan (validates link type, self-link, idempotency).
  const plan = buildReciprocalEntries(docA, docB, linkType);
  if (!plan.valid) {
    if (plan.reason === 'invalid-link-type') {
      throw new Meteor.Error('invalid-link-type',
        'linkType must be "seealso" or "replaces" (got "' + String(linkType) + '").');
    }
    if (plan.reason === 'self-link') {
      throw new Meteor.Error('invalid-link', 'Cannot link a Patient record to itself.');
    }
    throw new Meteor.Error('invalid-link', 'Could not build a reciprocal link for these records.');
  }

  // Authorize AFTER resolving both docs so membership checks see real ids.
  const auth = await authorizeLinkOperation(context.userId, docA, docB, context);
  if (!auth.authorized) {
    throw new Meteor.Error('not-authorized', NOT_AUTHORIZED_MESSAGE);
  }

  // Apply reciprocal $push, skipping any side that already has the entry
  // (idempotent — no duplicate same-target+type entries).
  let pushedA = false;
  let pushedB = false;
  if (!plan.alreadyOnA) {
    await Patients.updateAsync({ _id: docA._id }, { $push: { link: plan.entryOnA } });
    pushedA = true;
  }
  if (!plan.alreadyOnB) {
    await Patients.updateAsync({ _id: docB._id }, { $push: { link: plan.entryOnB } });
    pushedB = true;
  }

  context.log.info('Linked patients', {
    a: docA._id, b: docB._id, linkType: linkType, mirror: plan.entryOnB.type,
    pushedA: pushedA, pushedB: pushedB, authReason: auth.reason
  });

  return {
    patientIdA: docA._id,
    patientIdB: docB._id,
    linkType: linkType,
    mirrorType: plan.entryOnB.type,
    pushedA: pushedA,
    pushedB: pushedB
  };
});

Meteor.ServerMethods.define('patients.unlink', {
  description: 'Remove Patient.link entries referencing each other, in both directions',
  phi: true,
  positionalParams: ['patientIdA', 'patientIdB'],
  schemaObject: {
    type: 'object',
    properties: {
      patientIdA: { type: 'string' },
      patientIdB: { type: 'string' }
    },
    required: ['patientIdA', 'patientIdB']
  }
}, async function(params, context){
  if (!context.userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to unlink patient records.');
  }

  const patientIdA = get(params, 'patientIdA');
  const patientIdB = get(params, 'patientIdB');

  const Patients = getPatientsCollection();
  if (!Patients) {
    throw new Meteor.Error('collection-unavailable', 'Patients collection is not available.');
  }

  const docA = await lookupPatientDoc(Patients, patientIdA);
  const docB = await lookupPatientDoc(Patients, patientIdB);
  if (!docA || !docB) {
    throw new Meteor.Error('not-found', 'One or both Patient records were not found.');
  }

  const auth = await authorizeLinkOperation(context.userId, docA, docB, context);
  if (!auth.authorized) {
    throw new Meteor.Error('not-authorized', NOT_AUTHORIZED_MESSAGE);
  }

  // Compute the surviving link arrays (removes entries -> other in both
  // directions, by any reference shape, any type).
  const plan = removeLinkEntries(docA, docB);

  let updatedA = false;
  let updatedB = false;
  if (plan.removedFromA > 0) {
    await Patients.updateAsync({ _id: docA._id }, { $set: { link: plan.newLinkA } });
    updatedA = true;
  }
  if (plan.removedFromB > 0) {
    await Patients.updateAsync({ _id: docB._id }, { $set: { link: plan.newLinkB } });
    updatedB = true;
  }

  context.log.info('Unlinked patients', {
    a: docA._id, b: docB._id,
    removedFromA: plan.removedFromA, removedFromB: plan.removedFromB,
    authReason: auth.reason
  });

  return {
    patientIdA: docA._id,
    patientIdB: docB._id,
    removedFromA: plan.removedFromA,
    removedFromB: plan.removedFromB,
    updatedA: updatedA,
    updatedB: updatedB
  };
});

// ── Read path (design v2 §C, PR7) ───────────────────────────────────────────
//
// patientLinks.getLinkedSet powers both the LinkedPatientBadge and the
// PatientLinkPanel. It answers "which Patient records make up this account's (or
// this patient's) linked set, with display names and the link types that bind
// them?" — the read half that closes the Patient.link write-only gap.

// Build a display label for a Patient doc without leaking a bare id when a name
// is absent. Falls back to the doc's own id keys.
function displayForPatientDoc(doc) {
  if (!doc) {
    return 'Unknown patient';
  }
  const name = FhirUtilities.pluckName(doc);
  if (name && String(name).trim() !== '') {
    return name;
  }
  return 'Patient ' + String(get(doc, '_id', get(doc, 'id', '')));
}

// The traversed link.types (seealso + replaces/replaced-by) a link entry on
// `sourceDoc` uses to point at `targetDoc`. Best-effort: matches by any
// reference shape of the target. Returns a deduped array (may be empty when the
// binding lives only on the far side / reverse edge).
function linkTypesBinding(sourceDoc, targetDoc) {
  const types = {};
  const links = sourceDoc && Array.isArray(sourceDoc.link) ? sourceDoc.link : [];
  const targetShapes = {};
  const shapes = referenceShapesForTarget(targetDoc);
  for (let s = 0; s < shapes.length; s++) {
    targetShapes[String(shapes[s])] = true;
  }
  for (let i = 0; i < links.length; i++) {
    const entry = links[i];
    const ref = get(entry, 'other.reference');
    if (ref !== undefined && ref !== null && targetShapes[String(ref)] === true) {
      const t = get(entry, 'type');
      if (t) {
        types[String(t)] = true;
      }
    }
  }
  return Object.keys(types);
}

Meteor.ServerMethods.define('patientLinks.getLinkedSet', {
  description: 'Resolve the caller\'s (or a given patient\'s) linked Patient set with display names and link types',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' }
    }
  }
}, async function(params, context){
  if (!context.userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to view linked records.');
  }

  const Patients = getPatientsCollection();
  if (!Patients) {
    throw new Meteor.Error('collection-unavailable', 'Patients collection is not available.');
  }

  const requestedPatientId = get(params, 'patientId', null);

  // The caller's own set is the authorization boundary + default view.
  const set = await resolvePatientSet(context.userId);
  const callerMemberIds = Array.isArray(set.memberPatientIds) ? set.memberPatientIds : [];

  let primaryPatientId = set.primaryPatientId || null;
  let memberIds = callerMemberIds;
  let rootDoc = null;

  if (requestedPatientId !== null && requestedPatientId !== undefined && requestedPatientId !== '') {
    // Explicit patient requested: authorize (in caller's set, clinician, or
    // localFamilyMode) then read THAT patient's direct link entries as the set.
    rootDoc = await lookupPatientDoc(Patients, requestedPatientId);
    if (!rootDoc) {
      throw new Meteor.Error('not-found', 'Requested Patient record was not found.');
    }

    const memberSet = {};
    for (let i = 0; i < callerMemberIds.length; i++) {
      memberSet[String(callerMemberIds[i])] = true;
    }
    const authorized = isLocalFamilyMode()
      || isClinicianRole(set.role)
      || docIsInSet(rootDoc, memberSet);
    if (!authorized) {
      throw new Meteor.Error('not-authorized', NOT_AUTHORIZED_MESSAGE);
    }

    primaryPatientId = get(rootDoc, '_id', get(rootDoc, 'id', requestedPatientId));

    // Members = the root plus each traversed link target.
    const memberIdSet = {};
    memberIdSet[String(primaryPatientId)] = true;
    const outbound = Array.isArray(rootDoc.link) ? rootDoc.link : [];
    for (let j = 0; j < outbound.length; j++) {
      const ref = get(outbound[j], 'other.reference');
      const bare = typeof ref === 'string' ? ref.replace(/^urn:uuid:/, '').split('/').pop() : null;
      if (bare) {
        memberIdSet[String(bare)] = true;
      }
    }
    memberIds = Object.keys(memberIdSet);
  }

  // Resolve each member id to a doc + display + linkTypes (relative to root).
  const members = [];
  const rootForBinding = rootDoc; // null when using the caller's own set
  for (let m = 0; m < memberIds.length; m++) {
    const memberId = memberIds[m];
    const doc = await lookupPatientDoc(Patients, memberId);
    if (!doc) {
      context.log.debug('patientLinks.getLinkedSet: member not found', { memberId });
      continue;
    }
    let linkTypes = [];
    if (rootForBinding && String(get(doc, '_id')) !== String(get(rootForBinding, '_id'))) {
      linkTypes = linkTypesBinding(rootForBinding, doc);
    }
    members.push({
      _id: get(doc, '_id', null),
      id: get(doc, 'id', null),
      display: displayForPatientDoc(doc),
      linkTypes: linkTypes
    });
  }

  context.log.debug('patientLinks.getLinkedSet resolved', {
    primaryPatientId: primaryPatientId,
    memberCount: members.length,
    scoped: !!requestedPatientId
  });

  return {
    primaryPatientId: primaryPatientId,
    members: members
  };
});

// patientLinks.searchCandidates — a light name search over local Patients for
// the "Link a record" flow. Excludes any Patient already in the caller's set so
// the picker only surfaces new candidates. Returns lean display rows.
Meteor.ServerMethods.define('patientLinks.searchCandidates', {
  description: 'Search local Patient records by name for the link picker (excludes the caller\'s existing set)',
  phi: true,
  positionalParams: ['searchText', 'limit'],
  schemaObject: {
    type: 'object',
    properties: {
      searchText: { type: 'string' },
      limit: { type: 'number' }
    },
    required: ['searchText']
  }
}, async function(params, context){
  if (!context.userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to search patient records.');
  }

  const Patients = getPatientsCollection();
  if (!Patients) {
    throw new Meteor.Error('collection-unavailable', 'Patients collection is not available.');
  }

  const rawText = get(params, 'searchText', '');
  const searchText = typeof rawText === 'string' ? rawText.trim() : '';
  if (searchText.length < 2) {
    return [];
  }

  const limit = Math.min(Math.max(parseInt(get(params, 'limit', 10), 10) || 10, 1), 25);

  // Build the exclusion set from the caller's existing linked set.
  const set = await resolvePatientSet(context.userId);
  const excluded = {};
  const callerMemberIds = Array.isArray(set.memberPatientIds) ? set.memberPatientIds : [];
  for (let i = 0; i < callerMemberIds.length; i++) {
    excluded[String(callerMemberIds[i])] = true;
  }

  // Case-insensitive name search across the FHIR name sub-fields.
  const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = { $regex: escaped, $options: 'i' };
  const query = {
    $or: [
      { 'name.text': regex },
      { 'name.family': regex },
      { 'name.given': regex }
    ]
  };

  // Fetch a few extra to absorb post-filter exclusions.
  const docs = await Patients.find(query, { limit: limit + callerMemberIds.length + 5 }).fetchAsync();

  const candidates = [];
  for (let d = 0; d < docs.length; d++) {
    const doc = docs[d];
    const idKeys = [String(get(doc, '_id', '')), String(get(doc, 'id', ''))];
    if (excluded[idKeys[0]] === true || excluded[idKeys[1]] === true) {
      continue;
    }
    candidates.push({
      _id: get(doc, '_id', null),
      id: get(doc, 'id', null),
      display: displayForPatientDoc(doc),
      birthDate: get(doc, 'birthDate', null),
      gender: get(doc, 'gender', null)
    });
    if (candidates.length >= limit) {
      break;
    }
  }

  context.log.debug('patientLinks.searchCandidates', { count: candidates.length });
  return candidates;
});

// referenceShapesForTarget re-exported for consumers/tests that need to reason
// about which reference forms a link entry might use.
export { referenceShapesForTarget };

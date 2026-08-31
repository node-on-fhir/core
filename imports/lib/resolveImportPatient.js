// imports/lib/resolveImportPatient.js
//
// Meteor wrapper for import-attachment precedence (design v2 §B). Thin over two
// dependency-free CJS cores:
//   - resolvePatientSet (imports/lib/resolvePatientSet.js) — the account's
//     permitted PatientSet (link closure + role).
//   - resolveImportPatientCore (imports/lib/resolveImportPatientCore.js) —
//     the precedence: selected → profile-linked → payload-created → unlinked.
//
// resolveImportPatient(userId, { clientPatientId, payloadPatients }) ->
//   Promise<{ patientId, source, display }>
//     source ∈ 'selected' | 'profile-linked' | 'payload-created' | 'unlinked'
//
// Consumed server-side by the importAttachment.preview method (side-effect-free,
// PR6 banner) and — as importers adopt it — the warehouse attachment decision.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { resolvePatientSet } from '/imports/lib/resolvePatientSet.js';
import resolveImportPatientCore from '/imports/lib/resolveImportPatientCore.js';

const { resolveImportPatientCore: applyPrecedence } = resolveImportPatientCore;

const log = (Meteor.Logger ? Meteor.Logger.for('resolveImportPatient') : console);

// Build a { setMemberId: display } map from resolved member docs so the banner
// can name the selected / profile-linked patient. Best-effort: a missing doc or
// nameless Patient just yields no display (the core defaults to '').
async function buildSetMemberDisplays(memberPatientIds, PatientsCollection) {
  const displays = {};
  if (!PatientsCollection || !Array.isArray(memberPatientIds)) {
    return displays;
  }
  for (let i = 0; i < memberPatientIds.length; i++) {
    const id = memberPatientIds[i];
    if (id === null || id === undefined || id === '') continue;
    // _id first, then a SEPARATE FHIR {id} query — never a _id||id mix.
    let doc = await PatientsCollection.findOneAsync({ _id: id });
    if (!doc) {
      doc = await PatientsCollection.findOneAsync({ id: id });
    }
    if (doc) {
      displays[String(id)] = displayFromDoc(doc);
    }
  }
  return displays;
}

function displayFromDoc(doc) {
  const text = get(doc, 'name.0.text');
  if (typeof text === 'string' && text.length > 0) {
    return text;
  }
  const given = get(doc, 'name.0.given', []);
  const family = get(doc, 'name.0.family', '');
  const joined = ((Array.isArray(given) ? given.join(' ') : '') + ' ' + family).trim();
  return joined.length > 0 ? joined : '';
}

export async function resolveImportPatient(userId, options) {
  options = options || {};
  const clientPatientId = options.clientPatientId;
  const payloadPatients = Array.isArray(options.payloadPatients) ? options.payloadPatients : [];

  const patientSet = await resolvePatientSet(userId, { collections: options.collections });

  const PatientsCollection = get(options, 'collections.Patients')
    || get(global, 'Collections.Patients')
    || get(Meteor, 'Collections.Patients')
    || null;

  const setMemberDisplays = await buildSetMemberDisplays(patientSet.memberPatientIds, PatientsCollection);

  const result = applyPrecedence({
    patientSet: patientSet,
    clientPatientId: clientPatientId,
    payloadPatients: payloadPatients,
    setMemberDisplays: setMemberDisplays
  });

  log.debug('resolveImportPatient resolved', {
    userId: userId,
    source: result.source,
    hasSelection: !!clientPatientId,
    payloadCount: payloadPatients.length,
    setSource: patientSet.source,
    role: patientSet.role
  });

  return result;
}

export default { resolveImportPatient };

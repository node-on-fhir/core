// imports/lib/resolvePatientSet.js
//
// Meteor wrapper for the link-aware patient-set resolver (design v2 §A). The
// traversal/dedup/role logic lives in the dependency-free CJS core
// (imports/lib/patientSetCore.js) so it unit-tests bare via `node --test`; this
// thin wrapper wires the core to Meteor v3 async collections (global.Collections
// .Patients + Meteor.users) and the structured Logger.
//
// resolvePatientSet(userId, options) -> Promise<{
//   primaryPatientId, linkedPatientIds, memberPatientIds, source, role
// }>
//
//   memberPatientIds = [primary + linked, deduped]
//   source ∈ 'profile+link' | 'profile-only' | 'clinician-full' | 'empty'
//
// options.collections = { Patients, users } lets callers (and bare `node --test`)
// inject in-memory fakes; it defaults to global.Collections.Patients / Meteor.users.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import patientSetCore from '/imports/lib/patientSetCore.js';

const { resolvePatientSetCore, referenceVariants, TRAVERSED_LINK_TYPES } = patientSetCore;

const log = (Meteor.Logger ? Meteor.Logger.for('resolvePatientSet') : console);

// Build the injected `patients` adapter over a live Mongo.Collection. Every
// lookup is Meteor v3 async. The `_id` and FHIR-`id` lookups are TWO SEPARATE
// queries — never a `$or`/`||` between `_id` and `id` (id-collision anti-pattern,
// .claude/rules/anti-patterns/id-lookup.md).
function makePatientsAdapter(PatientsCollection) {
  return {
    async findOneByMongoId(mongoId) {
      if (mongoId === null || mongoId === undefined || mongoId === '') return null;
      return await PatientsCollection.findOneAsync({ _id: mongoId });
    },
    async findOneByFhirId(fhirId) {
      if (fhirId === null || fhirId === undefined || fhirId === '') return null;
      return await PatientsCollection.findOneAsync({ id: fhirId });
    },
    // Reverse lookup: Patient docs whose link.other.reference points at one of
    // `refs` via a traversed link.type. Uses the SAME reference-shape variants
    // the core normalizes on.
    async findByLinkReferences(refs, types) {
      if (!Array.isArray(refs) || refs.length === 0) return [];
      const query = {
        'link.other.reference': { $in: refs },
        'link.type': { $in: types || TRAVERSED_LINK_TYPES }
      };
      return await PatientsCollection.find(query).fetchAsync();
    }
  };
}

export async function resolvePatientSet(userId, options) {
  options = options || {};

  const collections = options.collections || {};
  const PatientsCollection = collections.Patients
    || get(global, 'Collections.Patients')
    || get(Meteor, 'Collections.Patients')
    || null;
  const usersCollection = collections.users || Meteor.users || null;

  if (!userId) {
    log.debug('resolvePatientSet called without userId — empty set');
    return emptyResult();
  }

  if (!PatientsCollection) {
    log.warn('resolvePatientSet: Patients collection unavailable — empty set', { userId });
    return emptyResult();
  }
  if (!usersCollection) {
    log.warn('resolvePatientSet: users collection unavailable — empty set', { userId });
    return emptyResult();
  }

  const user = await usersCollection.findOneAsync({ _id: userId });
  if (!user) {
    log.debug('resolvePatientSet: user not found — empty set', { userId });
    return emptyResult();
  }

  const patientsAdapter = makePatientsAdapter(PatientsCollection);
  const result = await resolvePatientSetCore(user, patientsAdapter, log);

  log.debug('resolvePatientSet resolved', {
    userId,
    source: result.source,
    role: result.role,
    memberCount: result.memberPatientIds.length
  });

  return result;
}

function emptyResult() {
  return {
    primaryPatientId: null,
    linkedPatientIds: [],
    memberPatientIds: [],
    source: 'empty',
    primaryExists: true,
    role: 'patient'
  };
}

// Re-export the reference-variant helper for consumers building filters.
export { referenceVariants };

export default { resolvePatientSet, referenceVariants };

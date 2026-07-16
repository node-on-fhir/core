// npmPackages/pacio-core/server/methods/medicationReconciliation.js
//
// Server methods for medication reconciliation on /medication-management.
//
// Semantics:
//   - discontinue: immediate status change ($set status: 'stopped') so the
//     row reactively moves from the Active tab to the Discontinued tab.
//   - save: the attestation event. Retires prior reconciled Lists, then
//     writes three artifacts built by the pure lib builders:
//       List       (snapshot, LOINC 10160-0)  — the clinical artifact
//       Provenance (SNOMED 430193006 activity) — the audit trail
//       Procedure  (SNOMED 430193006)          — the eCQM hook
//     (Medication Reconciliation Post-Discharge measures look for that
//     Procedure code, which lets quality-measures count the event as-is.)

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import moment from 'moment';

import {
  MEDICATION_LIST_LOINC,
  buildReconciledList,
  buildReconciliationProvenance,
  buildReconciliationProcedure
} from '../../lib/MedicationReconciliation.js';

const ACTIONABLE_RESOURCE_TYPES = ['MedicationRequest', 'MedicationStatement'];

function getCollectionOrThrow(name) {
  const collection = get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
  if (!collection) {
    throw new Meteor.Error('not-available', name + ' collection not available');
  }
  return collection;
}

async function getAuthorContext(userId) {
  const user = await Meteor.users.findOneAsync({ _id: userId });
  return {
    reference: 'Practitioner/' + userId,
    display: get(user, 'profile.name', get(user, 'username', 'Current User'))
  };
}

Meteor.methods({
  // Immediately discontinue medications: MedicationRequests and
  // MedicationStatements both go to status 'stopped'.
  // items: [{ _id: String, resourceType: 'MedicationRequest'|'MedicationStatement' }]
  'pacio.medicationReconciliation.discontinue': async function(items, reasonText) {
    check(items, [Match.ObjectIncluding({ _id: String, resourceType: String })]);
    check(reasonText, Match.Maybe(String));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!items.length) {
      return { modified: 0 };
    }

    const now = moment().toISOString();
    let modified = 0;

    for (const item of items) {
      if (ACTIONABLE_RESOURCE_TYPES.indexOf(item.resourceType) === -1) {
        console.warn('[pacio.medicationReconciliation.discontinue] Skipping unsupported resourceType:', item.resourceType);
        continue;
      }
      const collection = getCollectionOrThrow(item.resourceType + 's');

      const updates = {
        status: 'stopped',
        'meta.lastUpdated': now
      };
      if (reasonText) {
        // statusReason is a CodeableConcept on both resource types (R4:
        // MedicationRequest.statusReason, MedicationStatement.statusReason[]).
        updates.statusReason = item.resourceType === 'MedicationStatement'
          ? [{ text: reasonText }]
          : { text: reasonText };
      }

      modified += await collection.updateAsync(
        { _id: item._id },
        { $set: updates }
      );
    }

    console.log('[pacio.medicationReconciliation.discontinue] Discontinued ' + modified + ' of ' + items.length + ' medication(s)');
    return { modified: modified };
  },

  // Save the reconciliation event.
  // reconciliation: {
  //   patientId: String,                  // FHIR id — artifacts use Patient/<id>
  //   patientDisplay: Maybe(String),
  //   actions: [{ _id, resourceType, action: 'continue'|'discontinue',
  //               display: Maybe(String), code: Maybe(String) }],
  //   note: Maybe(String)
  // }
  // Returns { listId, provenanceId, procedureId }
  'pacio.medicationReconciliation.save': async function(reconciliation) {
    check(reconciliation, Match.ObjectIncluding({
      patientId: String,
      actions: [Match.ObjectIncluding({
        _id: String,
        resourceType: String,
        action: Match.Where(function(value) {
          return value === 'continue' || value === 'discontinue';
        })
      })]
    }));
    check(get(reconciliation, 'patientDisplay'), Match.Maybe(String));
    check(get(reconciliation, 'note'), Match.Maybe(String));

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    if (!reconciliation.actions.length) {
      throw new Meteor.Error('invalid-argument', 'No reconciliation actions to save');
    }

    const Lists = getCollectionOrThrow('Lists');
    const Provenances = getCollectionOrThrow('Provenances');
    const Procedures = getCollectionOrThrow('Procedures');

    const recorded = moment().toISOString();
    // Patient/<id> form only — the pacio publications match this form, never
    // urn:uuid:, so a urn-referenced List would silently vanish from queries.
    const patientReference = 'Patient/' + reconciliation.patientId;
    const author = await getAuthorContext(this.userId);

    console.log('[pacio.medicationReconciliation.save] Saving reconciliation for ' + patientReference +
      ' (' + reconciliation.actions.length + ' action(s))');

    // Retire prior reconciled lists so only one is 'current'.
    const retired = await Lists.updateAsync(
      {
        'subject.reference': patientReference,
        'code.coding.code': MEDICATION_LIST_LOINC,
        status: 'current',
        title: 'Reconciled Medication List'
      },
      { $set: { status: 'retired', 'meta.lastUpdated': recorded } },
      { multi: true }
    );
    if (retired) {
      console.log('[pacio.medicationReconciliation.save] Retired ' + retired + ' prior reconciled list(s)');
    }

    const list = buildReconciledList({
      listId: Random.id(),
      actions: reconciliation.actions,
      patientReference: patientReference,
      patientDisplay: get(reconciliation, 'patientDisplay'),
      authorReference: author.reference,
      authorDisplay: author.display,
      note: get(reconciliation, 'note'),
      recorded: recorded
    });
    await Lists.insertAsync(list);

    const provenance = buildReconciliationProvenance({
      provenanceId: Random.id(),
      listId: list._id,
      actions: reconciliation.actions,
      authorReference: author.reference,
      authorDisplay: author.display,
      recorded: recorded
    });
    await Provenances.insertAsync(provenance);

    const procedure = buildReconciliationProcedure({
      procedureId: Random.id(),
      patientReference: patientReference,
      patientDisplay: get(reconciliation, 'patientDisplay'),
      authorReference: author.reference,
      authorDisplay: author.display,
      recorded: recorded
    });
    await Procedures.insertAsync(procedure);

    console.log('[pacio.medicationReconciliation.save] Saved List/' + list._id +
      ', Provenance/' + provenance._id + ', Procedure/' + procedure._id);

    return {
      listId: list._id,
      provenanceId: provenance._id,
      procedureId: procedure._id
    };
  }
});

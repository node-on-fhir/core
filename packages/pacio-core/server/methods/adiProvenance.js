// /packages/pacio-core/server/methods/adiProvenance.js
//
// ADI Provenance and access auditing for the PACIO ADI IG.
//
// Design rule:
//   - Provenance  = document lifecycle (create / update / revoke) — the ADI IG
//     profile is Provenance-based; the custodian agent answers "who is the
//     custodian of the ADI document"
//   - AuditEvent  = access (who queried for it / who retrieved it)

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import moment from 'moment';
import { AdiConstants, isAdiDocument } from '../../lib/constants/AdiConstants';

function getCustodianReference() {
  return get(Meteor, 'settings.private.pacio.custodianOrganization', 'Organization/PFEIG-Org-01');
}

function isAdiAuditEnabled() {
  return get(Meteor, 'settings.private.pacio.auditAdiAccess', true);
}

// Create an ADI-Provenance resource for a document lifecycle event.
// options = { targetId, targetDisplay, activity ('CREATE'|'UPDATE'|'NULLIFY'),
//             userId, occurredAt }
// Returns the Provenance _id, or null if the collection is unavailable.
export async function createAdiProvenance(options) {
  const Provenances = Meteor.Collections && Meteor.Collections.Provenances;
  if (!Provenances) {
    console.warn('[adiProvenance] Provenances collection not available; skipping provenance for', get(options, 'targetId'));
    return null;
  }

  const activity = AdiConstants.provenanceActivities[get(options, 'activity')] ||
    AdiConstants.provenanceActivities.UPDATE;
  const recorded = get(options, 'occurredAt', moment().toISOString());
  const provenanceId = Random.id();

  const provenance = {
    resourceType: 'Provenance',
    id: provenanceId,
    _id: provenanceId,
    meta: {
      profile: [AdiConstants.profiles.ADI_PROVENANCE],
      lastUpdated: recorded
    },
    target: [{
      reference: 'DocumentReference/' + get(options, 'targetId'),
      display: get(options, 'targetDisplay', 'Advance Directive')
    }],
    recorded: recorded,
    activity: {
      coding: [{
        system: AdiConstants.codeSystems.V3_DATA_OPERATION,
        code: activity.code,
        display: activity.display
      }]
    },
    agent: [
      {
        type: {
          coding: [{
            system: AdiConstants.codeSystems.PROVENANCE_PARTICIPANT_TYPE,
            code: 'author',
            display: 'Author'
          }]
        },
        who: {
          reference: 'Practitioner/' + get(options, 'userId', 'unknown'),
          display: get(options, 'userDisplay', 'Current User')
        }
      },
      {
        type: {
          coding: [{
            system: AdiConstants.codeSystems.PROVENANCE_PARTICIPANT_TYPE,
            code: 'custodian',
            display: 'Custodian'
          }]
        },
        who: {
          reference: getCustodianReference()
        }
      }
    ]
  };

  try {
    await Provenances.insertAsync(provenance);
    console.log('[adiProvenance] Recorded ' + activity.code + ' provenance for DocumentReference/' + get(options, 'targetId'));
    return provenanceId;
  } catch (error) {
    console.error('[adiProvenance] Failed to insert Provenance:', error);
    return null;
  }
}

// Create an AuditEvent for an ADI access event (query or retrieval).
// options = { subtype ('read'|'search-type'), userId, documentReferenceId,
//             patientReference }
// Returns the AuditEvent _id, or null if disabled/unavailable.
export async function createAdiAccessAuditEvent(options) {
  if (!isAdiAuditEnabled()) {
    return null;
  }

  const AuditEvents = Meteor.Collections && Meteor.Collections.AuditEvents;
  if (!AuditEvents) {
    console.warn('[adiProvenance] AuditEvents collection not available; skipping access audit');
    return null;
  }

  const subtype = get(options, 'subtype', 'read');
  const auditEventId = Random.id();

  const auditEvent = {
    resourceType: 'AuditEvent',
    id: auditEventId,
    _id: auditEventId,
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: subtype,
      display: subtype === 'search-type' ? 'search' : 'read'
    }],
    action: 'R',
    recorded: moment().toISOString(),
    outcome: '0',
    agent: [{
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'IRCP',
          display: 'information recipient'
        }]
      },
      who: {
        reference: 'Practitioner/' + get(options, 'userId', 'unknown')
      },
      requestor: true
    }],
    source: {
      observer: {
        display: 'Honeycomb PACIO Server'
      }
    },
    entity: []
  };

  if (get(options, 'documentReferenceId')) {
    auditEvent.entity.push({
      what: { reference: 'DocumentReference/' + options.documentReferenceId },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '2',
        display: 'System Object'
      }
    });
  }

  if (get(options, 'patientReference')) {
    auditEvent.entity.push({
      what: { reference: options.patientReference },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '1',
        display: 'Person'
      }
    });
  }

  try {
    await AuditEvents.insertAsync(auditEvent);
    console.log('[adiProvenance] Recorded ' + subtype + ' AuditEvent for ADI access by ' + get(options, 'userId'));
    return auditEventId;
  } catch (error) {
    console.error('[adiProvenance] Failed to insert AuditEvent:', error);
    return null;
  }
}

Meteor.methods({
  // Record that the current user retrieved (viewed/downloaded) an ADI document
  'pacio.recordAdiRetrieval': async function(directiveId, mode) {
    check(directiveId, String);
    check(mode, Match.OneOf('view', 'download'));

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    const DocumentReferences = Meteor.Collections && Meteor.Collections.DocumentReferences;
    if (!DocumentReferences) {
      throw new Meteor.Error('collection-not-found', 'DocumentReferences collection not found');
    }

    const directive = await DocumentReferences.findOneAsync({ _id: directiveId });
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }

    if (!isAdiDocument(directive)) {
      throw new Meteor.Error('not-an-advance-directive', 'Document is not an advance directive');
    }

    console.log('[pacio.recordAdiRetrieval] ' + mode + ' of DocumentReference/' + directiveId + ' by ' + this.userId);

    const auditEventId = await createAdiAccessAuditEvent({
      subtype: 'read',
      userId: this.userId,
      documentReferenceId: directiveId,
      patientReference: get(directive, 'subject.reference')
    });

    return { success: true, auditEventId: auditEventId };
  }
});

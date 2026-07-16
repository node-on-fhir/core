// npmPackages/hipaa-compliance/lib/AuditEventMapping.js
//
// Canonical mapping between the package's flat audit-event API and FHIR R4B
// AuditEvent resources stored in the core AuditEvents collection. This is the
// single place that knows both shapes: the logger uses buildFhirAuditEvent()
// on the write path, and publications/reports/exports use flattenAuditEvent()
// + buildAuditQuery() on the read path. Field naming mirrors the core
// dehydrator (imports/lib/FhirDehydrator.js flattenAuditEvent) where the two
// overlap, but lives here because npm workflow packages cannot import
// /imports paths.

import { get, set } from 'lodash';
import { AuditDetailLevels } from './Constants';

// Extension URLs for package-specific compliance fields carried on the FHIR
// resource (R4B-valid, unlike sidecar underscore fields).
export const EXTENSION_URLS = {
  ENCRYPTION_LEVEL: 'urn:honeycomb:hipaa:encryptionLevel',
  SIGNATURE: 'urn:honeycomb:hipaa:signature',
  KEY_ID: 'urn:honeycomb:hipaa:keyId'
};

// FHIR AuditEvent.action codes: C create, R read/view/print, U update,
// D delete, E execute (system/security operations).
const ACTION_MAP = {
  create: 'C',
  clone: 'C',
  init: 'C',
  view: 'R',
  read: 'R',
  access: 'R',
  print: 'R',
  download: 'R',
  export: 'R',
  update: 'U',
  modify: 'U',
  delete: 'D'
};

export function mapEventTypeToAction(eventType) {
  return get(ACTION_MAP, eventType, 'E');
}

// FHIR AuditEvent.outcome: 0 success, 4 minor failure, 8 serious failure.
export function mapEventTypeToOutcome(eventType) {
  if (eventType === 'denied') {
    return '4';
  }
  if (eventType === 'error') {
    return '8';
  }
  return '0';
}

export function getExtensionValue(fhirEvent, url) {
  const extensions = get(fhirEvent, 'extension', []);
  const match = Array.isArray(extensions)
    ? extensions.find(function(ext) { return get(ext, 'url') === url; })
    : null;
  return get(match, 'valueString');
}

export function setExtensionValue(fhirEvent, url, valueString) {
  if (!Array.isArray(fhirEvent.extension)) {
    fhirEvent.extension = [];
  }
  const existing = fhirEvent.extension.find(function(ext) { return get(ext, 'url') === url; });
  if (existing) {
    existing.valueString = valueString;
  } else {
    fhirEvent.extension.push({ url: url, valueString: valueString });
  }
  return fhirEvent;
}

// Build a FHIR R4B AuditEvent from the package's flat event shape.
//
// flatEvent: { eventType, message, userId, userName, userEmail, userRoles,
//              resourceType, resourceId, collectionName, patientId,
//              patientName, metadata, ipAddress, userAgent, sessionId,
//              eventDate }
export function buildFhirAuditEvent(flatEvent, detailLevel = AuditDetailLevels.STANDARD) {
  const eventType = get(flatEvent, 'eventType', 'access');
  const recorded = get(flatEvent, 'eventDate') || new Date();

  const fhirEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://hl7.org/fhir/audit-event-type',
      code: eventType,
      display: eventType
    },
    action: mapEventTypeToAction(eventType),
    recorded: recorded,
    outcome: mapEventTypeToOutcome(eventType),
    source: {
      observer: {
        display: 'Honeycomb FHIR Server'
      },
      type: [{
        system: 'http://hl7.org/fhir/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    }
  };

  if (get(flatEvent, 'message')) {
    fhirEvent.outcomeDesc = flatEvent.message;
  }

  // Agent (the acting user)
  const agent = { requestor: true };
  if (get(flatEvent, 'userId')) {
    agent.who = {
      reference: 'User/' + flatEvent.userId,
      display: get(flatEvent, 'userName', flatEvent.userId)
    };
  } else {
    agent.who = { display: get(flatEvent, 'userName', 'System') };
  }
  if (get(flatEvent, 'userEmail')) {
    agent.altId = flatEvent.userEmail;
  }
  const roles = get(flatEvent, 'userRoles', []);
  if (Array.isArray(roles) && roles.length > 0) {
    agent.role = roles.map(function(role) { return { text: role }; });
  }
  if (detailLevel === AuditDetailLevels.VERBOSE && get(flatEvent, 'ipAddress')) {
    agent.network = { address: flatEvent.ipAddress, type: '2' };
  }
  fhirEvent.agent = [agent];

  // Entities: the touched resource, then the patient compartment
  const entities = [];
  if (get(flatEvent, 'resourceId') || get(flatEvent, 'collectionName') || get(flatEvent, 'metadata')) {
    const resourceEntity = {
      type: {
        system: 'http://hl7.org/fhir/audit-entity-type',
        code: '2',
        display: 'System Object'
      }
    };
    if (get(flatEvent, 'resourceId')) {
      const resourceType = get(flatEvent, 'resourceType', get(flatEvent, 'collectionName', 'Resource'));
      resourceEntity.what = { reference: resourceType + '/' + flatEvent.resourceId };
    }
    const details = [];
    if (get(flatEvent, 'collectionName')) {
      details.push({ type: 'collectionName', valueString: flatEvent.collectionName });
    }
    if (detailLevel !== AuditDetailLevels.MINIMAL) {
      const metadata = Object.assign({}, get(flatEvent, 'metadata', {}));
      if (detailLevel === AuditDetailLevels.VERBOSE) {
        if (get(flatEvent, 'userAgent')) {
          metadata.userAgent = flatEvent.userAgent;
        }
        if (get(flatEvent, 'sessionId')) {
          metadata.sessionId = flatEvent.sessionId;
        }
      }
      if (Object.keys(metadata).length > 0) {
        details.push({ type: 'metadata', valueString: JSON.stringify(metadata) });
      }
    }
    if (details.length > 0) {
      resourceEntity.detail = details;
    }
    entities.push(resourceEntity);
  }

  if (get(flatEvent, 'patientId')) {
    // patient array satisfies the {'patient.reference':1} index and the core
    // dehydrator's patient[0].* reads; the entity entry keeps the resource
    // BALP-conventional.
    fhirEvent.patient = [{
      reference: 'Patient/' + flatEvent.patientId,
      display: get(flatEvent, 'patientName', '')
    }];
    entities.push({
      what: {
        reference: 'Patient/' + flatEvent.patientId,
        display: get(flatEvent, 'patientName', '')
      },
      type: {
        system: 'http://hl7.org/fhir/audit-entity-type',
        code: '1',
        display: 'Person'
      },
      role: {
        system: 'http://hl7.org/fhir/object-role',
        code: '1',
        display: 'Patient'
      }
    });
  }

  if (entities.length > 0) {
    fhirEvent.entity = entities;
  }

  return fhirEvent;
}

// Flatten a stored FHIR AuditEvent back to the package's flat shape for
// tables, CSV export, and reports. Tolerant of events written by the core
// auditEvents.log method (no patient array, no entity detail).
export function flattenAuditEvent(fhirEvent) {
  const entities = Array.isArray(get(fhirEvent, 'entity')) ? fhirEvent.entity : [];

  // Classify entities by their audit-entity-type codes ('1' Person = the
  // patient-compartment entry, '2' System Object = the touched resource),
  // falling back to reference-prefix heuristics for events written by other
  // emitters. Prefix alone is not enough: when the audited resource IS a
  // Patient, both entities reference Patient/<id>.
  const patientEntity =
    entities.find(function(entity) { return get(entity, 'role.code') === '1'; })
    || entities.find(function(entity) {
      return get(entity, 'type.code') !== '2'
        && String(get(entity, 'what.reference', '')).startsWith('Patient/');
    })
    || null;
  const resourceEntity =
    entities.find(function(entity) { return get(entity, 'type.code') === '2'; })
    || entities.find(function(entity) { return entity !== patientEntity; })
    || null;

  const patientReference = get(fhirEvent, 'patient[0].reference', get(patientEntity, 'what.reference', ''));
  const patientDisplay = get(fhirEvent, 'patient[0].display', get(patientEntity, 'what.display', ''));

  const agentWhoReference = get(fhirEvent, 'agent[0].who.reference', '');
  const resourceReference = get(resourceEntity, 'what.reference', '');

  let collectionName = '';
  let metadata = null;
  const details = get(resourceEntity, 'detail', []);
  if (Array.isArray(details)) {
    details.forEach(function(detail) {
      if (get(detail, 'type') === 'collectionName') {
        collectionName = get(detail, 'valueString', '');
      }
      if (get(detail, 'type') === 'metadata') {
        try {
          metadata = JSON.parse(get(detail, 'valueString', 'null'));
        } catch (parseError) {
          metadata = get(detail, 'valueString', null);
        }
      }
    });
  }

  const referenceParts = resourceReference.split('/');

  return {
    _id: get(fhirEvent, '_id'),
    id: get(fhirEvent, 'id'),
    eventType: get(fhirEvent, 'type.code', get(fhirEvent, 'type.coding[0].code', '')),
    action: get(fhirEvent, 'action', ''),
    recorded: get(fhirEvent, 'recorded'),
    outcome: get(fhirEvent, 'outcome', '0'),
    message: get(fhirEvent, 'outcomeDesc', ''),
    userId: agentWhoReference.startsWith('User/') ? agentWhoReference.replace('User/', '') : '',
    userName: get(fhirEvent, 'agent[0].who.display', ''),
    userEmail: get(fhirEvent, 'agent[0].altId', ''),
    userRoles: (get(fhirEvent, 'agent[0].role', []) || []).map(function(role) { return get(role, 'text', ''); }),
    ipAddress: get(fhirEvent, 'agent[0].network.address', ''),
    patientId: patientReference.startsWith('Patient/') ? patientReference.replace('Patient/', '') : '',
    patientName: patientDisplay,
    resourceReference: resourceReference,
    resourceType: referenceParts.length === 2 ? referenceParts[0] : '',
    resourceId: referenceParts.length === 2 ? referenceParts[1] : '',
    collectionName: collectionName,
    metadata: metadata,
    encryptionLevel: getExtensionValue(fhirEvent, EXTENSION_URLS.ENCRYPTION_LEVEL) || 'none',
    signature: getExtensionValue(fhirEvent, EXTENSION_URLS.SIGNATURE) || ''
  };
}

// Translate the package's flat filter shape into a MongoDB query over the
// FHIR AuditEvents collection. Matches the indexes created at startup
// ({recorded:-1}, {'type.code':1}, {'agent.who.reference':1},
// {'patient.reference':1}) and the text-search fields.
export function buildAuditQuery(filters = {}) {
  const query = {};

  if (get(filters, 'eventType')) {
    query['type.code'] = filters.eventType;
  }

  if (get(filters, 'userId')) {
    const userRef = String(filters.userId).startsWith('User/')
      ? filters.userId
      : 'User/' + filters.userId;
    query['agent.who.reference'] = userRef;
  }

  if (get(filters, 'patientId')) {
    const patientRef = String(filters.patientId).startsWith('Patient/')
      ? filters.patientId
      : 'Patient/' + filters.patientId;
    query['patient.reference'] = patientRef;
  }

  if (get(filters, 'collectionName')) {
    query['entity.detail'] = {
      $elemMatch: { type: 'collectionName', valueString: filters.collectionName }
    };
  }

  if (get(filters, 'startDate') || get(filters, 'endDate')) {
    query.recorded = {};
    if (filters.startDate) {
      query.recorded.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.recorded.$lte = filters.endDate;
    }
  }

  if (get(filters, 'action')) {
    query.action = filters.action;
  }

  if (get(filters, 'outcome')) {
    query.outcome = filters.outcome;
  }

  if (get(filters, 'searchText')) {
    query.$or = [
      { outcomeDesc: { $regex: filters.searchText, $options: 'i' } },
      { 'agent.who.display': { $regex: filters.searchText, $options: 'i' } },
      { 'patient.display': { $regex: filters.searchText, $options: 'i' } }
    ];
  }

  return query;
}

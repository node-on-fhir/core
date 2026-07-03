// npmPackages/record-lifecycle/lib/EventPayload.js

import { get } from 'lodash';
import { Random } from 'meteor/random';
import { resolveLifecycleEvent } from './RecordLifecycleEvents';

// =============================================================================
// Unified Event Payload Builder
// =============================================================================
//
// Normalizes the varied collection hook signatures into a single structure
// that satisfies HIPAA, FHIRcast, and workflow subscriber needs.
//
// Payload shape:
// {
//   id, timestamp, lifecycleEvent, crudOperation, collectionName, resourceType,
//   resourceId, userId, patientId, patientReference, fieldNames, currentStatus,
//   modifier, resource, source, metadata
// }
// =============================================================================

/**
 * Extract patient ID from a FHIR resource document.
 * Three-tier fallback: subject.reference → patient.reference → _id (if Patient collection).
 *
 * @param {Object} doc - The FHIR resource document
 * @param {string} collectionName - The collection the document belongs to
 * @returns {string|null} The patient ID or null
 */
export function extractPatientId(doc, collectionName) {
  if (!doc) return null;

  // Direct patient record
  if (collectionName === 'Patients') {
    return doc._id;
  }

  // FHIR resources with subject reference
  const subjectRef = get(doc, 'subject.reference', '');
  if (subjectRef.startsWith('Patient/')) {
    return subjectRef.replace('Patient/', '');
  }

  // FHIR resources with patient reference
  const patientRef = get(doc, 'patient.reference', '');
  if (patientRef.startsWith('Patient/')) {
    return patientRef.replace('Patient/', '');
  }

  return null;
}

/**
 * Extract patient reference string from a FHIR resource document.
 *
 * @param {Object} doc - The FHIR resource document
 * @param {string} collectionName - The collection the document belongs to
 * @returns {string|null} The patient reference (e.g., "Patient/123") or null
 */
export function extractPatientReference(doc, collectionName) {
  if (!doc) return null;

  if (collectionName === 'Patients') {
    return `Patient/${doc._id}`;
  }

  const subjectRef = get(doc, 'subject.reference', '');
  if (subjectRef.startsWith('Patient/')) {
    return subjectRef;
  }

  const patientRef = get(doc, 'patient.reference', '');
  if (patientRef.startsWith('Patient/')) {
    return patientRef;
  }

  return null;
}

/**
 * Build a unified event payload from collection hook context.
 *
 * @param {Object} options
 * @param {string} options.crudOperation - 'insert', 'update', or 'remove'
 * @param {string} options.collectionName - Name of the Mongo collection
 * @param {string|null} options.userId - Meteor userId who triggered the operation
 * @param {Object} options.doc - The document after the operation
 * @param {string[]} [options.fieldNames] - Fields that changed (for updates)
 * @param {Object} [options.modifier] - The MongoDB modifier (for updates)
 * @param {Object} [options.previousDoc] - The document before the operation (for updates)
 * @param {Object} [options.metadata] - Additional metadata
 * @returns {Object} Unified event payload
 */
export function buildEventPayload(options) {
  const {
    crudOperation,
    collectionName,
    userId,
    doc,
    fieldNames,
    modifier,
    previousDoc,
    metadata
  } = options;

  const lifecycleEvent = resolveLifecycleEvent(crudOperation, doc, fieldNames, previousDoc);
  const resourceType = get(doc, 'resourceType', collectionName);
  const patientId = extractPatientId(doc, collectionName);
  const patientReference = extractPatientReference(doc, collectionName);

  return {
    id: Random.id(),
    timestamp: new Date().toISOString(),
    lifecycleEvent: lifecycleEvent,
    crudOperation: crudOperation,
    collectionName: collectionName,
    resourceType: resourceType,
    resourceId: get(doc, '_id', null),
    userId: userId || null,
    patientId: patientId,
    patientReference: patientReference,
    fieldNames: fieldNames || [],
    currentStatus: get(doc, 'status', null),
    modifier: modifier || null,
    resource: doc || null,
    source: 'collection-hook',
    metadata: metadata || {}
  };
}

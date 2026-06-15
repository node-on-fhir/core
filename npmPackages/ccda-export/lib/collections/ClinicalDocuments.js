// packages/clinical-documents/lib/collections/ClinicalDocuments.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get, has } from 'lodash';

// Create the collection without schema
const ClinicalDocuments = new Mongo.Collection('ClinicalDocuments');

// Helper functions for working with clinical documents
ClinicalDocuments.getComposition = function(doc) {
  // Return the first entry which should be the Composition
  return get(doc, 'entry[0].resource');
};

ClinicalDocuments.getIdentifier = function(doc) {
  return get(doc, 'identifier');
};

ClinicalDocuments.getPatientReference = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'subject.reference');
};

ClinicalDocuments.getPatientId = function(doc) {
  const patientRef = ClinicalDocuments.getPatientReference(doc);
  if (patientRef && patientRef.startsWith('Patient/')) {
    return patientRef.replace('Patient/', '');
  }
  return null;
};

ClinicalDocuments.getTitle = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'title', 'Untitled Document');
};

ClinicalDocuments.getStatus = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'status', 'unknown');
};

ClinicalDocuments.getDocumentDate = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'date');
};

ClinicalDocuments.getAuthors = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'author', []);
};

ClinicalDocuments.getSections = function(doc) {
  const composition = ClinicalDocuments.getComposition(doc);
  return get(composition, 'section', []);
};

ClinicalDocuments.findResourceById = function(doc, resourceId) {
  // Find a resource within the bundle by its ID
  const entries = get(doc, 'entry', []);
  for (let entry of entries) {
    if (get(entry, 'resource.id') === resourceId) {
      return entry.resource;
    }
  }
  return null;
};

ClinicalDocuments.findResourcesByType = function(doc, resourceType) {
  // Find all resources of a specific type
  const entries = get(doc, 'entry', []);
  return entries
    .filter(entry => get(entry, 'resource.resourceType') === resourceType)
    .map(entry => entry.resource);
};

// Collection hooks for audit logging
if (Meteor.isServer) {
  ClinicalDocuments.before.insert(function (userId, doc) {
    doc.meta = doc.meta || {};
    doc.meta.createdAt = new Date();
    doc.meta.createdBy = userId;
    
    // Ensure timestamp is set
    if (!doc.timestamp) {
      doc.timestamp = new Date();
    }
  });
  
  ClinicalDocuments.before.update(function (userId, doc, fieldNames, modifier, options) {
    modifier.$set = modifier.$set || {};
    modifier.$set['meta.lastUpdatedAt'] = new Date();
    modifier.$set['meta.lastUpdatedBy'] = userId;
  });
}

// Deny all client-side updates by default
ClinicalDocuments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// Export the collection
export { ClinicalDocuments };
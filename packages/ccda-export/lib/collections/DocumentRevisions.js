// packages/clinical-documents/lib/collections/DocumentRevisions.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Create the collection without schema
const DocumentRevisions = new Mongo.Collection('DocumentRevisions');

// Helper functions for working with document revisions
DocumentRevisions.getDocument = function(revision) {
  return revision.documentSnapshot;
};

DocumentRevisions.getPreviousRevision = function(revision) {
  if (revision.previousRevisionId) {
    return DocumentRevisions.findOne(revision.previousRevisionId);
  }
  return null;
};

DocumentRevisions.getAllRevisions = function(documentIdentifier) {
  return DocumentRevisions.find({
    'documentIdentifier.system': documentIdentifier.system,
    'documentIdentifier.value': documentIdentifier.value
  }, {
    sort: { revision: 1 }
  }).fetch();
};

DocumentRevisions.getLatestRevision = function(documentIdentifier) {
  return DocumentRevisions.findOne({
    'documentIdentifier.system': documentIdentifier.system,
    'documentIdentifier.value': documentIdentifier.value
  }, {
    sort: { revision: -1 }
  });
};

DocumentRevisions.isLatest = function(revision) {
  const latest = DocumentRevisions.getLatestRevision(revision.documentIdentifier);
  return latest && latest._id === revision._id;
};

// Collection hooks
if (Meteor.isServer) {
  DocumentRevisions.before.insert(function (userId, doc) {
    // Ensure meta object exists
    doc.meta = doc.meta || {};
    doc.meta.createdAt = doc.meta.createdAt || new Date();
    
    // Set created by if not set
    if (!doc.meta.createdBy && userId) {
      doc.meta.createdBy = userId;
    }
    
    // Auto-increment revision number if not set
    if (!doc.revision) {
      const lastRevision = DocumentRevisions.findOne({
        'documentIdentifier.system': doc.documentIdentifier.system,
        'documentIdentifier.value': doc.documentIdentifier.value
      }, {
        sort: { revision: -1 }
      });
      
      doc.revision = lastRevision ? lastRevision.revision + 1 : 1;
    }
  });
}

// Deny all client-side updates
DocumentRevisions.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; }
});

// Export the collection
export { DocumentRevisions };
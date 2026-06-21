// packages/clinical-documents/server/publications/clinicalDocuments.js

import { Meteor } from 'meteor/meteor';
import { ClinicalDocuments } from '../../lib/collections/ClinicalDocuments';

// Publish all clinical documents
Meteor.publish('clinical-documents.all', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  return ClinicalDocuments.find({});
});

// Publish single clinical document
Meteor.publish('clinical-documents.single', function(documentId) {
  if (!this.userId) {
    return this.ready();
  }
  
  return ClinicalDocuments.find({ _id: documentId });
});
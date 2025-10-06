// packages/clinical-documents/server/publications/documentRevisions.js

import { Meteor } from 'meteor/meteor';
import { DocumentRevisions } from '../../lib/collections/DocumentRevisions';

// Publish revisions by document identifier
Meteor.publish('document-revisions.byIdentifier', function(identifier) {
  if (!this.userId || !identifier) {
    return this.ready();
  }
  
  return DocumentRevisions.find({
    'documentIdentifier.system': identifier.system,
    'documentIdentifier.value': identifier.value
  });
});
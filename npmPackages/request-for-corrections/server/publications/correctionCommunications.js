// packages/request-for-corrections/server/publications/correctionCommunications.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';

// Publish communications for a specific task
Meteor.publish('correctionCommunications.forTask', function(taskId) {
  check(taskId, String);
  
  if (!this.userId) {
    return this.ready();
  }
  
  // TODO: Check permissions - user should have access to this task
  
  return CorrectionCommunications.find({
    'about.reference': `Task/${taskId}`
  }, {
    sort: { sent: 1 }
  });
});
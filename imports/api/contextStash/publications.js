// imports/api/contextStash/publications.js
//
// contextStash.mine — the ONLY read path for the ContextSidebar stash.
// Strictly the caller's own rows; pinned first, newest first.
import { Meteor } from 'meteor/meteor';
import { ContextStash } from '/imports/lib/schemas/SimpleSchemas/ContextStash';

Meteor.publish('contextStash.mine', function() {
  if (!this.userId) {
    return this.ready();
  }
  return ContextStash.find(
    { userId: this.userId },
    { sort: { pinned: -1, createdAt: -1 }, limit: 60 }
  );
});

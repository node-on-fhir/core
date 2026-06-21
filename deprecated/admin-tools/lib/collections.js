// packages/admin-tools/lib/collections.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

// =============================================================================
// CLIENT-ONLY COLLECTIONS
// =============================================================================

let AdminToolsState;
if (Meteor.isClient) {
  AdminToolsState = new Mongo.Collection('AdminToolsState', {
    connection: null  // Client-only collection
  });
}

// =============================================================================
// COLLECTION HELPERS
// =============================================================================

const AdminToolsCollections = {
  AdminToolsState: AdminToolsState,

  initializeState: function() {
    if (Meteor.isClient) {
      if (AdminToolsState.find().count() === 0) {
        AdminToolsState.insert({
          _id: 'default',
          selectedCollection: null,
          searchFilter: '',
          pageSize: 25,
          currentPage: 0
        });
      }
    }
  },

  getCurrentState: function() {
    if (Meteor.isClient) {
      return AdminToolsState.findOne('default') || {};
    }
    return {};
  },

  updateState: function(updates) {
    if (Meteor.isClient) {
      AdminToolsState.update('default', { $set: updates });
    }
  },

  resetState: function() {
    if (Meteor.isClient) {
      AdminToolsState.remove({});
      this.initializeState();
    }
  },

  setSelectedCollection: function(collectionName) {
    if (Meteor.isClient) {
      this.updateState({ selectedCollection: collectionName, currentPage: 0 });
    }
  },

  setSearchFilter: function(filter) {
    if (Meteor.isClient) {
      this.updateState({ searchFilter: filter, currentPage: 0 });
    }
  },

  setPage: function(page) {
    if (Meteor.isClient) {
      this.updateState({ currentPage: page });
    }
  }
};

export {
  AdminToolsCollections,
  AdminToolsState
};

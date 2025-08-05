// /packages/checklist-manifesto/server/publications/lists.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ChecklistLists } from '../../lib/collections/ChecklistLists';

/**
 * Publish lists based on user authentication status
 * - For anonymous users: only public lists
 * - For logged in users: public lists and their own lists
 */
Meteor.publish('checklist.lists', function(options = {}) {
  const selector = {
    isDeleted: { $ne: true },
    isProtocol: { $ne: true }, // Don't include protocols in regular lists
    isSystemTemplate: { $ne: true }
  };

  if (!this.userId) {
    // For unauthenticated users, only show public lists
    selector.public = true;
  } else {
    // For authenticated users, show both public lists and their own lists
    selector.$or = [
      { public: true },
      { userId: this.userId }
    ];
  }

  // Add optional filters
  if (options.status) {
    selector.status = options.status;
  }

  if (options.mode) {
    selector.mode = options.mode;
  }

  return ChecklistLists.find(selector, {
    fields: {
      title: 1,
      name: 1,
      description: 1,
      incompleteCount: 1,
      taskCount: 1,
      public: 1,
      status: 1,
      mode: 1,
      createdAt: 1,
      lastModified: 1,
      userId: 1
    },
    sort: { lastModified: -1 }
  });
});

/**
 * Publish a single list by ID with full details
 */
Meteor.publish('checklist.listDetails', async function(listId) {
  check(listId, String);

  // Find the list
  const list = await ChecklistLists.findOneAsync({
    _id: listId,
    isDeleted: { $ne: true }
  });

  if (!list) {
    return this.ready();
  }

  // If list is private, check if current user is the owner
  if (!list.public && (!this.userId || list.userId !== this.userId)) {
    return this.ready();
  }

  return ChecklistLists.find({
    _id: listId,
    isDeleted: { $ne: true }
  });
});

/**
 * Publish protocols (reusable checklists)
 */
Meteor.publish('checklist.protocols', function() {
  const selector = {
    $or: [
      { isProtocol: true },
      { isSystemTemplate: true }
    ],
    isDeleted: { $ne: true }
  };

  // For anonymous users, only show public protocols and system templates
  if (!this.userId) {
    selector.$and = [
      {
        $or: [
          { public: true },
          { isSystemTemplate: true }
        ]
      }
    ];
  } else {
    // For authenticated users, show system templates, public protocols, and their own
    selector.$or = [
      { isSystemTemplate: true },
      { public: true },
      { userId: this.userId }
    ];
  }

  return ChecklistLists.find(selector, {
    fields: {
      title: 1,
      name: 1,
      description: 1,
      taskCount: 1,
      public: 1,
      userId: 1,
      isProtocol: 1,
      isSystemTemplate: 1,
      createdAt: 1,
      lastModified: 1
    },
    sort: { 
      isSystemTemplate: -1,  // System templates first
      title: 1 
    }
  });
});

/**
 * Publish recently updated lists
 */
Meteor.publish('checklist.recentLists', function(limit = 10) {
  check(limit, Number);

  const selector = {
    isDeleted: { $ne: true },
    isProtocol: { $ne: true },
    isSystemTemplate: { $ne: true }
  };

  if (!this.userId) {
    // Only public lists for anonymous users
    selector.public = true;
  } else {
    // Public lists and user's own lists for logged in users
    selector.$or = [
      { public: true },
      { userId: this.userId }
    ];
  }

  return ChecklistLists.find(selector, {
    fields: {
      title: 1,
      name: 1,
      description: 1,
      incompleteCount: 1,
      taskCount: 1,
      public: 1,
      lastModified: 1
    },
    sort: { lastModified: -1 },
    limit: limit
  });
});

/**
 * Publish user's own lists
 */
Meteor.publish('checklist.myLists', function() {
  if (!this.userId) {
    return this.ready();
  }

  return ChecklistLists.find({
    userId: this.userId,
    isDeleted: { $ne: true }
  }, {
    sort: { lastModified: -1 }
  });
});
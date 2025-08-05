// /packages/checklist-manifesto/lib/collections/ChecklistLists.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

export const ChecklistLists = new Mongo.Collection('ChecklistLists');

// Helper functions

/**
 * Calculate a default name for a list in the form of 'List A'
 * @returns {String} Default list name
 */
export const getDefaultListName = function() {
  let nextLetter = 'A';
  let nextName = 'List ' + nextLetter;
  
  while (ChecklistLists.findOne({ name: nextName, isDeleted: { $ne: true } })) {
    // Get next letter in alphabet
    nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    nextName = 'List ' + nextLetter;
  }

  return nextName;
};

/**
 * Create a new list with default values
 * @param {Object} options Optional settings for the new list
 * @returns {String} ID of the new list
 */
export const createNewList = function(options = {}) {
  if (!Meteor.userId()) {
    throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
  }
  
  const user = Meteor.user();
  const list = {
    resourceType: 'List',
    status: 'active',
    mode: 'working',
    title: options.title || getDefaultListName(),
    name: options.name || options.title || getDefaultListName(), // For backward compatibility
    description: options.description || '',
    incompleteCount: 0,
    taskCount: 0,
    public: options.public || false,
    createdAt: new Date(),
    lastModified: new Date(),
    userId: Meteor.userId(),
    isDeleted: false,
    isProtocol: options.isProtocol || false,
    isSystemTemplate: options.isSystemTemplate || false
  };
  
  // Add optional fields if provided
  if (options.source) {
    list.source = options.source;
  }
  
  return ChecklistLists.insertAsync ? ChecklistLists.insertAsync(list) : ChecklistLists.insert(list);
};

// Initialize indexes on server
if (Meteor.isServer) {
  Meteor.startup(async function() {
    // Create indexes for efficient queries
    await ChecklistLists.createIndexAsync({ userId: 1 });
    await ChecklistLists.createIndexAsync({ public: 1 });
    await ChecklistLists.createIndexAsync({ status: 1 });
    await ChecklistLists.createIndexAsync({ isDeleted: 1 });
    await ChecklistLists.createIndexAsync({ 'identifier.value': 1 });
    await ChecklistLists.createIndexAsync({ isProtocol: 1 });
    await ChecklistLists.createIndexAsync({ isSystemTemplate: 1 });
    await ChecklistLists.createIndexAsync({ lastModified: -1 });
    await ChecklistLists.createIndexAsync({ taskCount: 1 });
    await ChecklistLists.createIndexAsync({ createdAt: -1 });
    
    console.log('ChecklistLists indexes created');
  });
}
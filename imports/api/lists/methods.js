// imports/api/lists/methods.js
// Meteor methods for FHIR List resource CRUD operations

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';

// Import Lists collection
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';

Meteor.methods({
  /**
   * Create a new FHIR List
   * @param {Object} listData - FHIR List resource data
   * @returns {String} - ID of created list
   */
  'lists.insert': async function(listData) {
    check(listData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a list');
    }

    const list = {
      resourceType: 'List',
      id: get(listData, 'id', Random.id()),
      status: get(listData, 'status', 'current'),
      mode: get(listData, 'mode', 'working'),
      title: get(listData, 'title', ''),
      code: get(listData, 'code', {}),
      subject: get(listData, 'subject', {}),
      encounter: get(listData, 'encounter', {}),
      date: get(listData, 'date', new Date().toISOString()),
      source: get(listData, 'source', {}),
      orderedBy: get(listData, 'orderedBy', {}),
      note: get(listData, 'note', []),
      entry: get(listData, 'entry', []),
      emptyReason: get(listData, 'emptyReason', {})
    };

    // Ensure _id matches id for MongoDB
    list._id = list.id;

    console.log('[lists.insert] Creating list:', list.title, '| ID:', list._id);

    const result = await Lists.insertAsync(list);
    return result;
  },

  /**
   * Update an existing FHIR List
   * @param {String} listId - ID of list to update
   * @param {Object} listData - Fields to update
   * @returns {Number} - Number of documents updated
   */
  'lists.update': async function(listId, listData) {
    check(listId, String);
    check(listData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a list');
    }

    const existing = await Lists.findOneAsync({ _id: listId });
    if (!existing) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    // Build update object with only provided fields
    const updates = {};

    if (listData.status !== undefined) updates.status = listData.status;
    if (listData.mode !== undefined) updates.mode = listData.mode;
    if (listData.title !== undefined) updates.title = listData.title;
    if (listData.code !== undefined) updates.code = listData.code;
    if (listData.subject !== undefined) updates.subject = listData.subject;
    if (listData.encounter !== undefined) updates.encounter = listData.encounter;
    if (listData.date !== undefined) updates.date = listData.date;
    if (listData.source !== undefined) updates.source = listData.source;
    if (listData.orderedBy !== undefined) updates.orderedBy = listData.orderedBy;
    if (listData.note !== undefined) updates.note = listData.note;
    if (listData.entry !== undefined) updates.entry = listData.entry;
    if (listData.emptyReason !== undefined) updates.emptyReason = listData.emptyReason;

    console.log('[lists.update] Updating list:', listId);

    const result = await Lists.updateAsync({ _id: listId }, { $set: updates });
    return result;
  },

  /**
   * Remove a FHIR List
   * @param {String} listId - ID of list to remove
   * @returns {Number} - Number of documents removed
   */
  'lists.remove': async function(listId) {
    check(listId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to remove a list');
    }

    console.log('[lists.remove] Removing list:', listId);

    const result = await Lists.removeAsync({ _id: listId });
    return result;
  },

  /**
   * Find a single FHIR List by ID
   * @param {String} listId - ID of list to find
   * @returns {Object} - FHIR List resource
   */
  'lists.findOne': async function(listId) {
    check(listId, String);

    const list = await Lists.findOneAsync({ _id: listId });
    return list;
  },

  /**
   * Search for Lists matching criteria
   * @param {Object} searchOptions - Search parameters
   * @returns {Array} - Array of matching FHIR List resources
   */
  'lists.search': async function(searchOptions = {}) {
    check(searchOptions, Object);

    const query = {};

    // Filter by status
    if (searchOptions.status) {
      query.status = searchOptions.status;
    }

    // Filter by mode
    if (searchOptions.mode) {
      query.mode = searchOptions.mode;
    }

    // Filter by title (partial match)
    if (searchOptions.title) {
      query.title = { $regex: searchOptions.title, $options: 'i' };
    }

    // Filter by code
    if (searchOptions.code) {
      query['code.coding.code'] = searchOptions.code;
    }

    console.log('[lists.search] Searching with query:', JSON.stringify(query));

    const lists = await Lists.find(query).fetchAsync();
    return lists;
  },

  /**
   * Add an entry to a FHIR List
   * @param {String} listId - ID of list to update
   * @param {Object} entry - Entry to add (with item reference)
   * @returns {Number} - Number of documents updated
   */
  'lists.addEntry': async function(listId, entry) {
    check(listId, String);
    check(entry, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to modify a list');
    }

    // Validate entry has required item field
    if (!entry.item) {
      throw new Meteor.Error('invalid-entry', 'Entry must have an item reference');
    }

    // Add date if not provided
    if (!entry.date) {
      entry.date = new Date().toISOString();
    }

    console.log('[lists.addEntry] Adding entry to list:', listId, '| Item:', get(entry, 'item.reference', 'unknown'));

    const result = await Lists.updateAsync(
      { _id: listId },
      { $push: { entry: entry } }
    );

    return result;
  },

  /**
   * Remove an entry from a FHIR List by index
   * @param {String} listId - ID of list to update
   * @param {Number} entryIndex - Index of entry to remove
   * @returns {Number} - Number of documents updated
   */
  'lists.removeEntry': async function(listId, entryIndex) {
    check(listId, String);
    check(entryIndex, Number);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to modify a list');
    }

    const list = await Lists.findOneAsync({ _id: listId });
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    const entries = get(list, 'entry', []);
    if (entryIndex < 0 || entryIndex >= entries.length) {
      throw new Meteor.Error('invalid-index', 'Entry index out of bounds');
    }

    // Remove entry at index
    entries.splice(entryIndex, 1);

    console.log('[lists.removeEntry] Removing entry at index:', entryIndex, 'from list:', listId);

    const result = await Lists.updateAsync(
      { _id: listId },
      { $set: { entry: entries } }
    );

    return result;
  },

  /**
   * Update an entry's quantity in a FHIR List
   * Used for inventory tracking (e.g., updating substance amounts)
   * @param {String} listId - ID of list to update
   * @param {Number} entryIndex - Index of entry to update
   * @param {Object} quantity - New quantity object { value, unit, system, code }
   * @returns {Number} - Number of documents updated
   */
  'lists.updateEntryQuantity': async function(listId, entryIndex, quantity) {
    check(listId, String);
    check(entryIndex, Number);
    check(quantity, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to modify a list');
    }

    const list = await Lists.findOneAsync({ _id: listId });
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    const entries = get(list, 'entry', []);
    if (entryIndex < 0 || entryIndex >= entries.length) {
      throw new Meteor.Error('invalid-index', 'Entry index out of bounds');
    }

    // Update entry quantity using extension
    if (!entries[entryIndex].extension) {
      entries[entryIndex].extension = [];
    }

    // Find or create quantity extension
    const quantityExtIndex = entries[entryIndex].extension.findIndex(
      ext => ext.url === 'http://hl7.org/fhir/StructureDefinition/list-quantity'
    );

    const quantityExtension = {
      url: 'http://hl7.org/fhir/StructureDefinition/list-quantity',
      valueQuantity: quantity
    };

    if (quantityExtIndex >= 0) {
      entries[entryIndex].extension[quantityExtIndex] = quantityExtension;
    } else {
      entries[entryIndex].extension.push(quantityExtension);
    }

    // Update date
    entries[entryIndex].date = new Date().toISOString();

    console.log('[lists.updateEntryQuantity] Updating entry quantity at index:', entryIndex,
      '| New value:', quantity.value, quantity.unit);

    const result = await Lists.updateAsync(
      { _id: listId },
      { $set: { entry: entries } }
    );

    return result;
  },

  /**
   * Mark an entry as deleted (soft delete per FHIR spec)
   * @param {String} listId - ID of list to update
   * @param {Number} entryIndex - Index of entry to mark deleted
   * @returns {Number} - Number of documents updated
   */
  'lists.markEntryDeleted': async function(listId, entryIndex) {
    check(listId, String);
    check(entryIndex, Number);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to modify a list');
    }

    const list = await Lists.findOneAsync({ _id: listId });
    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    const entries = get(list, 'entry', []);
    if (entryIndex < 0 || entryIndex >= entries.length) {
      throw new Meteor.Error('invalid-index', 'Entry index out of bounds');
    }

    // Mark as deleted
    entries[entryIndex].deleted = true;
    entries[entryIndex].date = new Date().toISOString();

    console.log('[lists.markEntryDeleted] Marking entry as deleted at index:', entryIndex, 'in list:', listId);

    const result = await Lists.updateAsync(
      { _id: listId },
      { $set: { entry: entries } }
    );

    return result;
  }
});

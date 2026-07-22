// imports/api/lists/methods.js
// Server methods for FHIR List resource CRUD operations

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Random } from 'meteor/random';

// Import Lists collection
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';

// List resources can be patient-scoped (subject reference, entries pointing at
// clinical resources) — PHI-flagged.

Meteor.ServerMethods.define('lists.insert', {
  description: 'Create a FHIR List resource',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const listData = params;

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

  context.log.info('Creating list', { title: list.title, _id: list._id });

  const result = await Lists.insertAsync(list);
  return result;
});

Meteor.ServerMethods.define('lists.update', {
  description: 'Update fields on an existing FHIR List resource',
  phi: true,
  positionalParams: ['listId', 'listData'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      listData: { type: 'object' }
    },
    required: ['listId', 'listData']
  }
}, async function(params, context){
  const listId = params.listId;
  const listData = params.listData;

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

  context.log.info('Updating list', { listId: listId });

  const result = await Lists.updateAsync({ _id: listId }, { $set: updates });
  return result;
});

Meteor.ServerMethods.define('lists.remove', {
  description: 'Delete a FHIR List resource by id',
  phi: true,
  positionalParams: ['listId'],
  schemaObject: {
    type: 'object',
    properties: { listId: { type: 'string' } },
    required: ['listId']
  }
}, async function(params, context){
  context.log.info('Removing list', { listId: params.listId });

  const result = await Lists.removeAsync({ _id: params.listId });
  return result;
});

Meteor.ServerMethods.define('lists.findOne', {
  description: 'Fetch a single FHIR List resource by id',
  phi: true,
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  positionalParams: ['listId'],
  schemaObject: {
    type: 'object',
    properties: { listId: { type: 'string' } },
    required: ['listId']
  }
}, async function(params){
  const list = await Lists.findOneAsync({ _id: params.listId });
  return list;
});

Meteor.ServerMethods.define('lists.search', {
  description: 'Search FHIR List resources by status, mode, title, or code',
  phi: true,
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  schemaObject: {
    type: 'object',
    properties: {
      status: { type: 'string' },
      mode: { type: 'string' },
      title: { type: 'string' },
      code: { type: 'string' }
    }
  }
}, async function(params, context){
  const searchOptions = params || {};

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

  context.log.debug('Searching lists', { query: query });

  const lists = await Lists.find(query).fetchAsync();
  return lists;
});

Meteor.ServerMethods.define('lists.addEntry', {
  description: 'Append an entry (item reference) to a FHIR List',
  phi: true,
  positionalParams: ['listId', 'entry'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      entry: { type: 'object' }
    },
    required: ['listId', 'entry']
  }
}, async function(params, context){
  const listId = params.listId;
  const entry = params.entry;

  // Validate entry has required item field
  if (!entry.item) {
    throw new Meteor.Error('invalid-entry', 'Entry must have an item reference');
  }

  // Add date if not provided
  if (!entry.date) {
    entry.date = new Date().toISOString();
  }

  context.log.info('Adding entry to list', { listId: listId, item: get(entry, 'item.reference', 'unknown') });

  const result = await Lists.updateAsync(
    { _id: listId },
    { $push: { entry: entry } }
  );

  return result;
});

Meteor.ServerMethods.define('lists.removeEntry', {
  description: 'Remove an entry from a FHIR List by index',
  phi: true,
  positionalParams: ['listId', 'entryIndex'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      entryIndex: { type: 'number' }
    },
    required: ['listId', 'entryIndex']
  }
}, async function(params, context){
  const listId = params.listId;
  const entryIndex = params.entryIndex;

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

  context.log.info('Removing entry from list', { entryIndex: entryIndex, listId: listId });

  const result = await Lists.updateAsync(
    { _id: listId },
    { $set: { entry: entries } }
  );

  return result;
});

Meteor.ServerMethods.define('lists.updateEntryQuantity', {
  description: 'Update the quantity extension on a FHIR List entry (inventory tracking)',
  phi: true,
  positionalParams: ['listId', 'entryIndex', 'quantity'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      entryIndex: { type: 'number' },
      quantity: { type: 'object' }
    },
    required: ['listId', 'entryIndex', 'quantity']
  }
}, async function(params, context){
  const listId = params.listId;
  const entryIndex = params.entryIndex;
  const quantity = params.quantity;

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

  context.log.info('Updating entry quantity', { entryIndex: entryIndex, value: quantity.value, unit: quantity.unit });

  const result = await Lists.updateAsync(
    { _id: listId },
    { $set: { entry: entries } }
  );

  return result;
});

Meteor.ServerMethods.define('lists.markEntryDeleted', {
  description: 'Soft-delete a FHIR List entry by index (per FHIR spec)',
  phi: true,
  positionalParams: ['listId', 'entryIndex'],
  schemaObject: {
    type: 'object',
    properties: {
      listId: { type: 'string' },
      entryIndex: { type: 'number' }
    },
    required: ['listId', 'entryIndex']
  }
}, async function(params, context){
  const listId = params.listId;
  const entryIndex = params.entryIndex;

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

  context.log.info('Marking entry as deleted', { entryIndex: entryIndex, listId: listId });

  const result = await Lists.updateAsync(
    { _id: listId },
    { $set: { entry: entries } }
  );

  return result;
});

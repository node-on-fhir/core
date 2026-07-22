// imports/api/groups/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Groups } from '/imports/lib/schemas/SimpleSchemas/Groups';

// Group.member entries reference Patients, so these methods are PHI-flagged.

Meteor.ServerMethods.define('groups.insert', {
  description: 'Create a FHIR Group resource',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const groupData = params;

  const cleanGroup = {
    resourceType: 'Group',
    active: get(groupData, 'active', true),
    type: get(groupData, 'type', 'person'),
    actual: get(groupData, 'actual', true),
    code: get(groupData, 'code', {}),
    name: get(groupData, 'name', ''),
    description: get(groupData, 'description', ''),
    quantity: get(groupData, 'quantity', 0),
    managingEntity: get(groupData, 'managingEntity', {}),
    characteristic: get(groupData, 'characteristic', []),
    member: get(groupData, 'member', []),
    note: get(groupData, 'note', []),
    identifier: get(groupData, 'identifier', [])
  };

  // Generate IDs
  cleanGroup.id = Random.id();
  cleanGroup._id = cleanGroup.id;

  context.log.info('Inserting group', { _id: cleanGroup._id, name: cleanGroup.name });
  const result = await Groups.insertAsync(cleanGroup);
  return result;
});

Meteor.ServerMethods.define('groups.update', {
  description: 'Update an existing FHIR Group resource',
  phi: true,
  positionalParams: ['groupId', 'groupData'],
  schemaObject: {
    type: 'object',
    properties: {
      groupId: { type: 'string' },
      groupData: { type: 'object' }
    },
    required: ['groupId', 'groupData']
  }
}, async function(params, context){
  const groupId = params.groupId;
  const groupData = params.groupData;

  const existing = await Groups.findOneAsync({ _id: groupId });
  if (!existing) {
    throw new Meteor.Error('not-found', 'Group not found.');
  }

  const updates = {
    active: get(groupData, 'active', existing.active),
    type: get(groupData, 'type', existing.type),
    actual: get(groupData, 'actual', existing.actual),
    code: get(groupData, 'code', existing.code),
    name: get(groupData, 'name', existing.name),
    description: get(groupData, 'description', existing.description),
    quantity: get(groupData, 'quantity', existing.quantity),
    managingEntity: get(groupData, 'managingEntity', existing.managingEntity),
    characteristic: get(groupData, 'characteristic', existing.characteristic),
    member: get(groupData, 'member', existing.member),
    note: get(groupData, 'note', existing.note),
    identifier: get(groupData, 'identifier', existing.identifier)
  };

  context.log.info('Updating group', { groupId: groupId });
  const result = await Groups.updateAsync(
    { _id: groupId },
    { $set: updates }
  );
  return result;
});

Meteor.ServerMethods.define('groups.remove', {
  description: 'Delete a FHIR Group resource by id',
  phi: true,
  positionalParams: ['groupId'],
  schemaObject: {
    type: 'object',
    properties: { groupId: { type: 'string' } },
    required: ['groupId']
  }
}, async function(params, context){
  context.log.info('Removing group', { groupId: params.groupId });
  const result = await Groups.removeAsync({ _id: params.groupId });
  return result;
});

Meteor.ServerMethods.define('groups.findOne', {
  description: 'Fetch a single FHIR Group resource by id',
  phi: true,
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  positionalParams: ['groupId'],
  schemaObject: {
    type: 'object',
    properties: { groupId: { type: 'string' } },
    required: ['groupId']
  }
}, async function(params){
  const group = await Groups.findOneAsync({ _id: params.groupId });
  return group;
});

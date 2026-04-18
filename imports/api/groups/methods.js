// imports/api/groups/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Groups } from '/imports/lib/schemas/SimpleSchemas/Groups';

Meteor.methods({
  'groups.insert': async function(groupData) {
    check(groupData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create a group.');
    }

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

    console.log('[groups.insert] Inserting:', cleanGroup._id, cleanGroup.name);
    const result = await Groups.insertAsync(cleanGroup);
    return result;
  },

  'groups.update': async function(groupId, groupData) {
    check(groupId, String);
    check(groupData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update a group.');
    }

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

    console.log('[groups.update] Updating:', groupId);
    const result = await Groups.updateAsync(
      { _id: groupId },
      { $set: updates }
    );
    return result;
  },

  'groups.remove': async function(groupId) {
    check(groupId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete a group.');
    }

    console.log('[groups.remove] Removing:', groupId);
    const result = await Groups.removeAsync({ _id: groupId });
    return result;
  },

  'groups.findOne': async function(groupId) {
    check(groupId, String);

    const group = await Groups.findOneAsync({ _id: groupId });
    return group;
  }
});

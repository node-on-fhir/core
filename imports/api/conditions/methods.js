// /imports/api/conditions/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Conditions';

// Get the correct Conditions collection reference
function getConditions() {
  if (Meteor.isServer) {
    return Meteor.Collections?.Conditions || global.Conditions;
  } else {
    return Meteor.Collections?.Conditions;
  }
}

Meteor.methods({
  async 'conditions.create'(conditionData) {
    check(conditionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create conditions');
    }

    // Store in FHIR R4 format as-is, adding metadata
    const condition = {
      ...conditionData,
      resourceType: 'Condition',
      meta: {
        ...get(conditionData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    const Conditions = getConditions();
    const conditionId = await Conditions.insertAsync(condition);

    // HIPAA audit log
    console.log('[conditions.create] Condition created', {
      userId: this.userId,
      conditionId: conditionId,
      timestamp: new Date()
    });

    return conditionId;
  },

  async 'conditions.update'(conditionId, conditionData) {
    check(conditionId, String);
    check(conditionData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update conditions');
    }

    const Conditions = getConditions();

    const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
    if (!existingCondition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }

    // Update metadata, keep FHIR R4 format as-is
    const updatedCondition = {
      ...conditionData,
      _id: conditionId,
      resourceType: 'Condition',
      meta: {
        ...get(conditionData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingCondition, 'meta.versionId', '0')) + 1)
      }
    };

    const result = await Conditions.updateAsync(
      { _id: conditionId },
      { $set: updatedCondition }
    );

    // HIPAA audit log
    console.log('[conditions.update] Condition updated', {
      userId: this.userId,
      conditionId: conditionId,
      timestamp: new Date()
    });

    return result;
  },

  async 'conditions.remove'(conditionId) {
    check(conditionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove conditions');
    }

    const Conditions = getConditions();

    const existingCondition = await Conditions.findOneAsync({ _id: conditionId });
    if (!existingCondition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }

    const result = await Conditions.removeAsync({ _id: conditionId });

    // HIPAA audit log
    console.log('[conditions.remove] Condition removed', {
      userId: this.userId,
      conditionId: conditionId,
      timestamp: new Date()
    });

    return result;
  },

  async 'conditions.get'(conditionId) {
    check(conditionId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view conditions');
    }

    const Conditions = getConditions();

    let condition = await Conditions.findOneAsync({ _id: conditionId });

    if (!condition) {
      condition = await Conditions.findOneAsync(conditionId);
    }

    if (!condition) {
      throw new Meteor.Error('not-found', 'Condition not found');
    }

    return condition;
  }
});

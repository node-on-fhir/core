// /imports/api/molecularSequences/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/MolecularSequences';

// Get the correct MolecularSequences collection reference
function getMolecularSequences() {
  if (Meteor.isServer) {
    return Meteor.Collections?.MolecularSequences || global.MolecularSequences;
  } else {
    return Meteor.Collections?.MolecularSequences;
  }
}

Meteor.methods({
  async 'molecularSequences.create'(molecularSequenceData) {
    check(molecularSequenceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create molecular sequences');
    }

    console.log('=== molecularSequences.create called ===');

    const cleanMolecularSequence = {
      ...molecularSequenceData,
      resourceType: 'MolecularSequence',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    try {
      const MolecularSequences = getMolecularSequences();
      const molecularSequenceId = await MolecularSequences.insertAsync(cleanMolecularSequence);
      console.log('[molecularSequences.create] Successfully inserted with ID:', molecularSequenceId);

      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('MolecularSequence created', {
          userId: this.userId,
          molecularSequenceId: molecularSequenceId,
          timestamp: new Date()
        });
      }

      return molecularSequenceId;
    } catch (error) {
      console.error('[molecularSequences.create] Error:', error);
      throw error;
    }
  },

  async 'molecularSequences.update'(molecularSequenceId, molecularSequenceData) {
    check(molecularSequenceId, String);
    check(molecularSequenceData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update molecular sequences');
    }

    const MolecularSequences = getMolecularSequences();

    const existingMolecularSequence = await MolecularSequences.findOneAsync({ _id: molecularSequenceId });
    if (!existingMolecularSequence) {
      throw new Meteor.Error('not-found', 'MolecularSequence not found');
    }

    const updatedMolecularSequence = {
      ...molecularSequenceData,
      _id: molecularSequenceId,
      resourceType: 'MolecularSequence',
      meta: {
        ...get(molecularSequenceData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingMolecularSequence, 'meta.versionId', '0')) + 1)
      }
    };

    const result = await MolecularSequences.updateAsync(
      { _id: molecularSequenceId },
      { $set: updatedMolecularSequence }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('MolecularSequence updated', {
        userId: this.userId,
        molecularSequenceId: molecularSequenceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'molecularSequences.remove'(molecularSequenceId) {
    check(molecularSequenceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove molecular sequences');
    }

    const MolecularSequences = getMolecularSequences();

    const existingMolecularSequence = await MolecularSequences.findOneAsync({ _id: molecularSequenceId });
    if (!existingMolecularSequence) {
      throw new Meteor.Error('not-found', 'MolecularSequence not found');
    }

    const result = await MolecularSequences.removeAsync({ _id: molecularSequenceId });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('MolecularSequence removed', {
        userId: this.userId,
        molecularSequenceId: molecularSequenceId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'molecularSequences.get'(molecularSequenceId) {
    check(molecularSequenceId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view molecular sequences');
    }

    const MolecularSequences = getMolecularSequences();

    let molecularSequence = await MolecularSequences.findOneAsync({ _id: molecularSequenceId });

    if (!molecularSequence) {
      molecularSequence = await MolecularSequences.findOneAsync(molecularSequenceId);
    }

    if (!molecularSequence) {
      throw new Meteor.Error('not-found', 'MolecularSequence not found');
    }

    return molecularSequence;
  }
});

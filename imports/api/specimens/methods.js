// /imports/api/specimens/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Specimens';

// Get the correct Specimens collection reference
function getSpecimens() {
  if (Meteor.isServer) {
    return Meteor.Collections?.Specimens || global.Specimens;
  } else {
    return Meteor.Collections?.Specimens;
  }
}

Meteor.methods({
  async 'specimens.create'(specimenData) {
    check(specimenData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create specimens');
    }

    console.log('=== specimens.create called ===');

    const cleanSpecimen = {
      ...specimenData,
      resourceType: 'Specimen',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    try {
      const Specimens = getSpecimens();
      const specimenId = await Specimens.insertAsync(cleanSpecimen);
      console.log('[specimens.create] Successfully inserted with ID:', specimenId);

      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Specimen created', {
          userId: this.userId,
          specimenId: specimenId,
          timestamp: new Date()
        });
      }

      return specimenId;
    } catch (error) {
      console.error('[specimens.create] Error:', error);
      throw error;
    }
  },

  async 'specimens.update'(specimenId, specimenData) {
    check(specimenId, String);
    check(specimenData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update specimens');
    }

    const Specimens = getSpecimens();

    const existingSpecimen = await Specimens.findOneAsync({ _id: specimenId });
    if (!existingSpecimen) {
      throw new Meteor.Error('not-found', 'Specimen not found');
    }

    const updatedSpecimen = {
      ...specimenData,
      _id: specimenId,
      resourceType: 'Specimen',
      meta: {
        ...get(specimenData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingSpecimen, 'meta.versionId', '0')) + 1)
      }
    };

    const result = await Specimens.updateAsync(
      { _id: specimenId },
      { $set: updatedSpecimen }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Specimen updated', {
        userId: this.userId,
        specimenId: specimenId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'specimens.remove'(specimenId) {
    check(specimenId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove specimens');
    }

    const Specimens = getSpecimens();

    const existingSpecimen = await Specimens.findOneAsync({ _id: specimenId });
    if (!existingSpecimen) {
      throw new Meteor.Error('not-found', 'Specimen not found');
    }

    const result = await Specimens.removeAsync({ _id: specimenId });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Specimen removed', {
        userId: this.userId,
        specimenId: specimenId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'specimens.get'(specimenId) {
    check(specimenId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view specimens');
    }

    const Specimens = getSpecimens();

    let specimen = await Specimens.findOneAsync({ _id: specimenId });

    if (!specimen) {
      specimen = await Specimens.findOneAsync(specimenId);
    }

    if (!specimen) {
      throw new Meteor.Error('not-found', 'Specimen not found');
    }

    return specimen;
  }
});

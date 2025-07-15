import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Compositions } from '../../lib/schemas/SimpleSchemas/Compositions';

Meteor.methods({
  'Compositions.insert': async function(composition) {
    check(composition, Object);
    
    // Security check
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create compositions');
    }

    // Validate required fields
    if (!composition.type) {
      throw new Meteor.Error('invalid-composition', 'Composition type is required');
    }

    if (!composition.status) {
      throw new Meteor.Error('invalid-composition', 'Composition status is required');
    }

    if (!composition.subject) {
      throw new Meteor.Error('invalid-composition', 'Composition subject is required');
    }

    // Add server-side metadata
    composition.id = composition.id || Random.id();
    composition.meta = {
      versionId: '1',
      lastUpdated: new Date()
    };

    // Add author if not present
    if (!composition.author || composition.author.length === 0) {
      composition.author = [{
        reference: `Practitioner/${this.userId}`,
        display: Meteor.user()?.username || 'Current User'
      }];
    }

    // Set date if not present
    if (!composition.date) {
      composition.date = new Date().toISOString();
    }

    try {
      const result = await Compositions.insertAsync(composition);
      console.log('Composition created:', result);
      return result;
    } catch (error) {
      console.error('Error inserting Composition:', error);
      throw new Meteor.Error('insert-failed', 'Failed to save composition: ' + error.message);
    }
  },

  'Compositions.update': async function(selector, modifier) {
    check(selector, Object);
    check(modifier, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update compositions');
    }

    // Update metadata
    if (!modifier.$set) {
      modifier.$set = {};
    }
    modifier.$set['meta.lastUpdated'] = new Date();
    modifier.$set['meta.versionId'] = String(parseInt(modifier.$set['meta.versionId'] || '1') + 1);

    try {
      const result = await Compositions.updateAsync(selector, modifier);
      console.log('Composition updated:', result);
      return result;
    } catch (error) {
      console.error('Error updating Composition:', error);
      throw new Meteor.Error('update-failed', 'Failed to update composition: ' + error.message);
    }
  },

  'Compositions.remove': async function(compositionId) {
    check(compositionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete compositions');
    }

    const composition = await Compositions.findOneAsync(compositionId);
    
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found');
    }

    // Additional authorization check could go here
    // For example, check if user is the author

    try {
      return await Compositions.removeAsync(compositionId);
    } catch (error) {
      console.error('Error removing Composition:', error);
      throw new Meteor.Error('remove-failed', 'Failed to delete composition: ' + error.message);
    }
  },

  'Compositions.updateStatus': async function(compositionId, newStatus) {
    check(compositionId, String);
    check(newStatus, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update compositions');
    }

    const validStatuses = ['preliminary', 'final', 'amended', 'entered-in-error'];
    if (!validStatuses.includes(newStatus)) {
      throw new Meteor.Error('invalid-status', 'Invalid status. Must be one of: ' + validStatuses.join(', '));
    }

    try {
      return await Compositions.updateAsync(compositionId, {
        $set: {
          status: newStatus,
          'meta.lastUpdated': new Date()
        }
      });
    } catch (error) {
      console.error('Error updating Composition status:', error);
      throw new Meteor.Error('update-failed', 'Failed to update composition status: ' + error.message);
    }
  },

  'Compositions.finalizeDocument': async function(compositionId) {
    check(compositionId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to finalize compositions');
    }

    const composition = await Compositions.findOneAsync(compositionId);
    
    if (!composition) {
      throw new Meteor.Error('not-found', 'Composition not found');
    }

    if (composition.status === 'final') {
      throw new Meteor.Error('already-final', 'Composition is already finalized');
    }

    try {
      return await Compositions.updateAsync(compositionId, {
        $set: {
          status: 'final',
          'meta.lastUpdated': new Date(),
          'attester': [{
            mode: 'professional',
            time: new Date().toISOString(),
            party: {
              reference: `Practitioner/${this.userId}`,
              display: Meteor.user()?.username || 'Current User'
            }
          }]
        }
      });
    } catch (error) {
      console.error('Error finalizing Composition:', error);
      throw new Meteor.Error('finalize-failed', 'Failed to finalize composition: ' + error.message);
    }
  }
});
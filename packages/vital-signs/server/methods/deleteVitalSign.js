// /packages/vital-signs/server/methods/deleteVitalSign.js

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Collections will be accessed via Meteor.Collections
let Observations;

Meteor.startup(function() {
  Observations = Meteor.Collections?.Observations;
});

if (Meteor.isServer) {
  Meteor.methods({
    async 'VitalSigns.delete'(vitalSignId) {
      console.log('[VitalSigns.delete] Method called', vitalSignId);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to delete vital signs');
      }
      
      // Validate input
      check(vitalSignId, String);
      
      // Check vital sign exists and is a vital sign observation
      const vitalSign = await Observations.findOneAsync({
        _id: vitalSignId,
        'category.coding.code': 'vital-signs'
      });
      
      if (!vitalSign) {
        throw new Meteor.Error('not-found', 'Vital sign not found');
      }
      
      // Check permissions - user should be performer or have admin rights
      const isPerformer = get(vitalSign, 'performer', []).some(perf => 
        get(perf, 'reference') === `Practitioner/${this.userId}`
      );
      
      if (!isPerformer && !Roles.userIsInRole(this.userId, ['admin', 'practitioner'])) {
        throw new Meteor.Error('not-authorized', 'You can only delete your own vital sign measurements');
      }
      
      // Soft delete approach - update status to entered-in-error
      try {
        const result = await Observations.updateAsync(
          { _id: vitalSignId },
          { 
            $set: { 
              status: 'entered-in-error',
              'meta.lastUpdated': new Date(),
              'meta.versionId': String(parseInt(get(vitalSign, 'meta.versionId', '0')) + 1),
              '_deletedAt': new Date(),
              '_deletedBy': this.userId
            } 
          }
        );
        
        console.log('[VitalSigns.delete] Vital sign soft deleted:', result);
        return result;
      } catch (error) {
        console.error('[VitalSigns.delete] Error deleting vital sign:', error);
        throw new Meteor.Error('delete-failed', error.message);
      }
    },
    
    async 'VitalSigns.remove'(vitalSignId) {
      console.log('[VitalSigns.remove] Method called for hard delete', vitalSignId);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to remove vital signs');
      }
      
      // Check if user has admin rights for hard delete
      if (!Roles.userIsInRole(this.userId, ['admin'])) {
        throw new Meteor.Error('not-authorized', 'Only administrators can permanently remove vital signs');
      }
      
      // Validate input
      check(vitalSignId, String);
      
      // Check vital sign exists and is a vital sign observation
      const vitalSign = await Observations.findOneAsync({
        _id: vitalSignId,
        'category.coding.code': 'vital-signs'
      });
      
      if (!vitalSign) {
        throw new Meteor.Error('not-found', 'Vital sign not found');
      }
      
      // Hard delete
      try {
        const result = await Observations.removeAsync({ _id: vitalSignId });
        console.log('[VitalSigns.remove] Vital sign permanently removed:', result);
        
        return result;
      } catch (error) {
        console.error('[VitalSigns.remove] Error removing vital sign:', error);
        throw new Meteor.Error('remove-failed', error.message);
      }
    },
    
    async 'VitalSigns.restore'(vitalSignId) {
      console.log('[VitalSigns.restore] Method called', vitalSignId);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to restore vital signs');
      }
      
      // Validate input
      check(vitalSignId, String);
      
      // Check vital sign exists and is marked as deleted
      const vitalSign = await Observations.findOneAsync({
        _id: vitalSignId,
        'category.coding.code': 'vital-signs',
        status: 'entered-in-error',
        _deletedAt: { $exists: true }
      });
      
      if (!vitalSign) {
        throw new Meteor.Error('not-found', 'Deleted vital sign not found');
      }
      
      // Check permissions - user should have admin rights or be the one who deleted it
      if (!Roles.userIsInRole(this.userId, ['admin']) && vitalSign._deletedBy !== this.userId) {
        throw new Meteor.Error('not-authorized', 'You can only restore vital signs you deleted or must be an administrator');
      }
      
      // Restore the vital sign
      try {
        const result = await Observations.updateAsync(
          { _id: vitalSignId },
          { 
            $set: { 
              status: 'final',
              'meta.lastUpdated': new Date(),
              'meta.versionId': String(parseInt(get(vitalSign, 'meta.versionId', '0')) + 1)
            },
            $unset: {
              '_deletedAt': '',
              '_deletedBy': ''
            }
          }
        );
        
        console.log('[VitalSigns.restore] Vital sign restored:', result);
        return result;
      } catch (error) {
        console.error('[VitalSigns.restore] Error restoring vital sign:', error);
        throw new Meteor.Error('restore-failed', error.message);
      }
    }
  });
}
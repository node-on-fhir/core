// server/methods/practitionerMethods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Practitioners } from '../../imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '../../imports/lib/schemas/SimpleSchemas/PractitionerRoles';

Meteor.methods({
  /**
   * Link a practitioner ID to the current user's account
   */
  'users.linkPractitionerId': async function(practitionerId) {
    check(practitionerId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to link a practitioner record');
    }
    
    // Verify the practitioner exists
    const practitioner = await Practitioners.findOneAsync({
      $or: [
        { id: practitionerId },
        { _id: practitionerId }
      ]
    });
    
    if (!practitioner) {
      throw new Meteor.Error('not-found', 'Practitioner record not found');
    }
    
    // Update the user's practitionerId
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $set: { 
          practitionerId: get(practitioner, 'id', practitionerId),
          'profile.isPractitioner': true
        } 
      }
    );
    
    console.log(`Linked practitioner ${practitionerId} to user ${this.userId}`);
    
    return result;
  },
  
  /**
   * Link a practitioner role ID to the current user's account
   */
  'users.linkPractitionerRoleId': async function(practitionerRoleId) {
    check(practitionerRoleId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to link a practitioner role');
    }
    
    // Verify the practitioner role exists
    const practitionerRole = await PractitionerRoles.findOneAsync({
      $or: [
        { id: practitionerRoleId },
        { _id: practitionerRoleId }
      ]
    });
    
    if (!practitionerRole) {
      throw new Meteor.Error('not-found', 'Practitioner role not found');
    }
    
    // Update the user's practitionerRoleId
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $set: { 
          practitionerRoleId: get(practitionerRole, 'id', practitionerRoleId)
        } 
      }
    );
    
    console.log(`Linked practitioner role ${practitionerRoleId} to user ${this.userId}`);
    
    return result;
  },
  
  /**
   * Unlink practitioner records from the current user's account
   */
  'users.unlinkPractitionerRecords': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to unlink practitioner records');
    }
    
    // Remove practitioner-related fields from the user
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $unset: { 
          practitionerId: '',
          practitionerRoleId: '',
          'profile.isPractitioner': ''
        } 
      }
    );
    
    console.log(`Unlinked practitioner records from user ${this.userId}`);
    
    return result;
  },
  
  /**
   * Get practitioner-related resources for a user
   */
  'users.getPractitionerResources': async function(userId) {
    check(userId, Match.Maybe(String));
    
    const targetUserId = userId || this.userId;
    
    if (!targetUserId) {
      throw new Meteor.Error('not-authorized', 'User ID required');
    }
    
    const user = await Meteor.users.findOneAsync(targetUserId);
    if (!user) {
      throw new Meteor.Error('not-found', 'User not found');
    }
    
    const result = {
      practitioner: null,
      practitionerRole: null
    };
    
    // Get practitioner record
    if (user.practitionerId) {
      result.practitioner = await Practitioners.findOneAsync({
        $or: [
          { id: user.practitionerId },
          { _id: user.practitionerId }
        ]
      });
    }
    
    // Get practitioner role
    if (user.practitionerRoleId) {
      result.practitionerRole = await PractitionerRoles.findOneAsync({
        $or: [
          { id: user.practitionerRoleId },
          { _id: user.practitionerRoleId }
        ]
      });
    }
    
    return result;
  }
});
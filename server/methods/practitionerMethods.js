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
  },
  
  /**
   * Get the current user's practitioner ID
   */
  'users.getCurrentPractitionerId': async function() {
    if (!this.userId) {
      return null;
    }
    
    const user = await Meteor.users.findOneAsync(this.userId);
    console.log('getCurrentPractitionerId - user:', user?.username, 'practitionerId:', user?.practitionerId);
    
    return user?.practitionerId || null;
  },
  
  /**
   * Dev helper: Link house user to Chief Medical Officer
   * Run in browser console: Meteor.call('dev.linkHouseToCMO')
   */
  'dev.linkHouseToCMO': async function() {
    if (Meteor.isProduction) {
      throw new Meteor.Error('not-allowed', 'This method is only available in development');
    }
    
    const houseUser = await Meteor.users.findOneAsync({ username: 'house' });
    if (!houseUser) {
      throw new Meteor.Error('not-found', 'House user not found');
    }
    
    const chiefMedicalOfficerId = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer.reference', '').replace('Practitioner/', '');
    
    if (!chiefMedicalOfficerId) {
      throw new Meteor.Error('not-configured', 'Chief Medical Officer not configured in settings');
    }
    
    const result = await Meteor.users.updateAsync(
      { _id: houseUser._id },
      { 
        $set: { 
          practitionerId: chiefMedicalOfficerId,
          'profile.isPractitioner': true
        } 
      }
    );
    
    console.log(`Linked house user to Chief Medical Officer (${chiefMedicalOfficerId})`);
    return { success: true, practitionerId: chiefMedicalOfficerId };
  },
  
  /**
   * Set user as practitioner without requiring a linked practitioner record
   * This allows users to see intervention approvals and other practitioner-specific content
   */
  'users.setAsPractitioner': async function(isPractitioner = true) {
    check(isPractitioner, Boolean);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $set: { 
          'profile.isPractitioner': isPractitioner
        } 
      }
    );
    
    console.log(`Set user ${this.userId} isPractitioner to ${isPractitioner}`);
    
    return result;
  },
  
  /**
   * Debug method: Link current user to Chief Medical Officer
   * This is for development/testing purposes only
   */
  'debug.linkCurrentUserToCMO': async function() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in');
    }
    
    const chiefMedicalOfficerId = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer.reference', '').replace('Practitioner/', '');
    
    if (!chiefMedicalOfficerId) {
      // Create a default CMO practitioner ID if not configured
      const defaultCMOId = 'chief-medical-officer';
      
      await Meteor.users.updateAsync(
        { _id: this.userId },
        { 
          $set: { 
            practitionerId: defaultCMOId,
            'profile.isPractitioner': true
          } 
        }
      );
      
      console.log(`Linked user ${this.userId} to default Chief Medical Officer (${defaultCMOId})`);
      return { success: true, practitionerId: defaultCMOId, message: 'Linked to default Chief Medical Officer' };
    }
    
    const result = await Meteor.users.updateAsync(
      { _id: this.userId },
      { 
        $set: { 
          practitionerId: chiefMedicalOfficerId,
          'profile.isPractitioner': true
        } 
      }
    );
    
    console.log(`Linked user ${this.userId} to Chief Medical Officer (${chiefMedicalOfficerId})`);
    return { success: true, practitionerId: chiefMedicalOfficerId, message: `Linked to Chief Medical Officer (${chiefMedicalOfficerId})` };
  }
});
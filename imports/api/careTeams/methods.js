// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/careTeams/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Random } from 'meteor/random';

Meteor.methods({
  async createCareTeam(careTeamData) {
    console.log('[createCareTeam] Creating new care team:', careTeamData);
    
    // Check user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create care teams');
    }
    
    // Validate required fields
    if (!careTeamData.status) {
      throw new Meteor.Error('invalid-data', 'Care team status is required');
    }
    
    // Build clean care team object
    let cleanCareTeam = {
      resourceType: 'CareTeam',
      status: careTeamData.status,
      id: Random.id()
    };
    
    // Set name
    if (careTeamData.name) {
      cleanCareTeam.name = careTeamData.name;
    }
    
    // Set subject (patient) reference
    if (careTeamData.subject) {
      cleanCareTeam.subject = careTeamData.subject;
    }
    
    // Set category as proper CodeableConcept
    if (careTeamData.category && careTeamData.category.length > 0) {
      cleanCareTeam.category = careTeamData.category;
    }
    
    // Set period
    if (careTeamData.period) {
      cleanCareTeam.period = {};
      if (careTeamData.period.start) {
        cleanCareTeam.period.start = moment(careTeamData.period.start).format('YYYY-MM-DD');
      }
      if (careTeamData.period.end) {
        cleanCareTeam.period.end = moment(careTeamData.period.end).format('YYYY-MM-DD');
      }
    }
    
    // Set participants
    if (careTeamData.participant && Array.isArray(careTeamData.participant)) {
      cleanCareTeam.participant = careTeamData.participant
        .filter(p => p.member && p.member.display)
        .map(p => {
          const cleanParticipant = {
            member: p.member
          };
          
          // Add role if present
          if (p.role && Array.isArray(p.role)) {
            cleanParticipant.role = p.role;
          }
          
          // Add period if present
          if (p.period) {
            cleanParticipant.period = {};
            if (p.period.start) {
              cleanParticipant.period.start = moment(p.period.start).format('YYYY-MM-DD');
            }
            if (p.period.end) {
              cleanParticipant.period.end = moment(p.period.end).format('YYYY-MM-DD');
            }
          }
          
          return cleanParticipant;
        });
    }
    
    // Set managing organizations
    if (careTeamData.managingOrganization && Array.isArray(careTeamData.managingOrganization)) {
      cleanCareTeam.managingOrganization = careTeamData.managingOrganization
        .filter(org => org.display || org.reference);
    }
    
    // Set notes
    if (careTeamData.note && Array.isArray(careTeamData.note)) {
      cleanCareTeam.note = careTeamData.note
        .filter(n => n.text)
        .map(n => ({
          text: n.text,
          time: n.time || new Date()
        }));
    }
    
    // Set metadata
    cleanCareTeam.meta = {
      lastUpdated: new Date()
    };
    
    // Set _id based on environment variable for consistent sorting
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      cleanCareTeam._id = objectId.toHexString();
      console.log('[careTeams.create] Using MongoDB ObjectID:', cleanCareTeam._id);
    } else {
      cleanCareTeam._id = cleanCareTeam.id;
      console.log('[careTeams.create] Using Meteor string ID:', cleanCareTeam._id);
    }
    
    console.log('[createCareTeam] Inserting care team:', cleanCareTeam);
    
    try {
      const result = await CareTeams.insertAsync(cleanCareTeam);
      console.log('[createCareTeam] Successfully created care team:', result);
      return result;
    } catch (error) {
      console.error('[createCareTeam] Error inserting care team:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },
  
  async updateCareTeam(careTeamId, careTeamData) {
    console.log('[updateCareTeam] Updating care team:', careTeamId, careTeamData);
    
    // Check user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update care teams');
    }
    
    // Check care team exists
    const existingCareTeam = await CareTeams.findOneAsync({_id: careTeamId});
    if (!existingCareTeam) {
      throw new Meteor.Error('not-found', 'Care team not found');
    }
    
    // Build update object
    let updateData = {
      $set: {
        'meta.lastUpdated': new Date()
      }
    };
    
    // Update status
    if (careTeamData.status) {
      updateData.$set.status = careTeamData.status;
    }
    
    // Update name
    if (careTeamData.name !== undefined) {
      updateData.$set.name = careTeamData.name;
    }
    
    // Update subject
    if (careTeamData.subject) {
      updateData.$set.subject = careTeamData.subject;
    }
    
    // Update category
    if (careTeamData.category) {
      updateData.$set.category = careTeamData.category;
    }
    
    // Update period - build complete object first to avoid MongoDB path conflict
    if (careTeamData.period) {
      const periodUpdate = {};
      if (careTeamData.period.start) {
        periodUpdate.start = moment(careTeamData.period.start).format('YYYY-MM-DD');
      }
      if (careTeamData.period.end) {
        periodUpdate.end = moment(careTeamData.period.end).format('YYYY-MM-DD');
      }
      updateData.$set.period = periodUpdate;
    }
    
    // Update participants
    if (careTeamData.participant !== undefined) {
      updateData.$set.participant = careTeamData.participant
        .filter(p => p.member && p.member.display)
        .map(p => {
          const cleanParticipant = {
            member: p.member
          };
          
          if (p.role) {
            cleanParticipant.role = p.role;
          }
          
          if (p.period) {
            cleanParticipant.period = {};
            if (p.period.start) {
              cleanParticipant.period.start = moment(p.period.start).format('YYYY-MM-DD');
            }
            if (p.period.end) {
              cleanParticipant.period.end = moment(p.period.end).format('YYYY-MM-DD');
            }
          }
          
          return cleanParticipant;
        });
    }
    
    // Update managing organizations
    if (careTeamData.managingOrganization !== undefined) {
      updateData.$set.managingOrganization = careTeamData.managingOrganization
        .filter(org => org.display || org.reference);
    }
    
    // Update notes
    if (careTeamData.note !== undefined) {
      updateData.$set.note = careTeamData.note
        .filter(n => n.text)
        .map(n => ({
          text: n.text,
          time: n.time || new Date()
        }));
    }
    
    console.log('[updateCareTeam] Update data:', updateData);
    
    try {
      const result = await CareTeams.updateAsync(careTeamId, updateData);
      console.log('[updateCareTeam] Successfully updated care team:', result);
      return result;
    } catch (error) {
      console.error('[updateCareTeam] Error updating care team:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },
  
  async removeCareTeam(careTeamId) {
    console.log('[removeCareTeam] Removing care team:', careTeamId);
    
    // Check user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove care teams');
    }
    
    // Check if deletion is allowed (TEST_RUN environment)
    if (!process.env.TEST_RUN) {
      console.log('[removeCareTeam] Deletion blocked - not in TEST_RUN mode');
      throw new Meteor.Error('not-allowed', 'Care team deletion is restricted');
    }
    
    try {
      const result = await CareTeams.removeAsync({_id: careTeamId});
      console.log('[removeCareTeam] Successfully removed care team:', result);
      return result;
    } catch (error) {
      console.error('[removeCareTeam] Error removing care team:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  }
});
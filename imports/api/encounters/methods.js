// /imports/api/encounters/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Encounters';

// Get the correct Encounters collection reference
function getEncounters() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Encounters || global.Encounters;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Encounters;
  }
}

Meteor.methods({
  async 'encounters.create'(encounterData) {
    check(encounterData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create encounters');
    }
    
    // Add metadata
    const encounter = {
      ...encounterData,
      resourceType: 'Encounter',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Debug logging
    if (Meteor.isServer) {
      console.log('encounters.create - Creating encounter with data:', JSON.stringify(encounter, null, 2));
      if (encounter.participant && encounter.participant[0]) {
        console.log('encounters.create - Participant data:', encounter.participant[0]);
        console.log('encounters.create - Practitioner display:', encounter.participant[0].individual?.display);
      } else {
        console.log('encounters.create - No participant data found');
      }
    }
    
    // Insert and return the new encounter
    const Encounters = getEncounters();
    const encounterId = await Encounters.insertAsync(encounter);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Encounter created', {
        userId: this.userId,
        encounterId: encounterId,
        timestamp: new Date()
      });
    }
    
    return encounterId;
  },
  
  async 'encounters.update'(encounterId, encounterData) {
    check(encounterId, String);
    check(encounterData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update encounters');
    }
    
    const Encounters = getEncounters();
    
    // Check if encounter exists
    const existingEncounter = await Encounters.findOneAsync({ _id: encounterId });
    if (!existingEncounter) {
      throw new Meteor.Error('not-found', 'Encounter not found');
    }
    
    // Update metadata
    const updatedEncounter = {
      ...encounterData,
      _id: encounterId,
      resourceType: 'Encounter',
      meta: {
        ...get(encounterData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingEncounter, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the encounter
    const result = await Encounters.updateAsync(
      { _id: encounterId },
      { $set: updatedEncounter }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Encounter updated', {
        userId: this.userId,
        encounterId: encounterId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'encounters.remove'(encounterId) {
    check(encounterId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove encounters');
    }
    
    const Encounters = getEncounters();
    
    // Check if encounter exists
    const existingEncounter = await Encounters.findOneAsync({ _id: encounterId });
    if (!existingEncounter) {
      throw new Meteor.Error('not-found', 'Encounter not found');
    }
    
    // Remove the encounter
    const result = await Encounters.removeAsync({ _id: encounterId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Encounter removed', {
        userId: this.userId,
        encounterId: encounterId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'encounters.get'(encounterId) {
    check(encounterId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view encounters');
    }
    
    const Encounters = getEncounters();
    console.log('encounters.get called with ID:', encounterId);
    console.log('Using Encounters collection:', !!Encounters);
    
    // Try both ways to find the encounter
    let encounter = await Encounters.findOneAsync({ _id: encounterId });
    
    if (!encounter) {
      // Also try without the query object
      encounter = await Encounters.findOneAsync(encounterId);
    }
    
    if (!encounter) {
      console.log('Encounter not found for ID:', encounterId);
      console.log('Total encounters in collection:', await Encounters.countAsync());
      
      // Log a few encounters to see their ID format
      const sampleEncounters = await Encounters.find({}, { limit: 3 }).fetchAsync();
      console.log('Sample encounter IDs:', sampleEncounters.map(e => ({ _id: e._id, type: typeof e._id })));
      
      throw new Meteor.Error('not-found', 'Encounter not found');
    }
    
    console.log('Found encounter:', encounter._id);
    return encounter;
  }
});
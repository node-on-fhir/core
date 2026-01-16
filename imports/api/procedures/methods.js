// /imports/api/procedures/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Procedures';

// Get the correct Procedures collection reference
function getProcedures() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Procedures || global.Procedures;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Procedures;
  }
}

Meteor.methods({
  async 'createProcedure'(procedureData) {
    check(procedureData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create procedures');
    }
    
    // Add metadata
    const procedure = {
      ...procedureData,
      resourceType: 'Procedure',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new procedure
    const Procedures = getProcedures();
    const procedureId = await Procedures.insertAsync(procedure);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Procedure created', {
        userId: this.userId,
        procedureId: procedureId,
        timestamp: new Date()
      });
    }
    
    return procedureId;
  },
  
  async 'updateProcedure'(procedureId, procedureData) {
    check(procedureId, String);
    check(procedureData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update procedures');
    }
    
    const Procedures = getProcedures();
    
    // Check if procedure exists
    const existingProcedure = await Procedures.findOneAsync({ _id: procedureId });
    if (!existingProcedure) {
      throw new Meteor.Error('not-found', 'Procedure not found');
    }
    
    // Update metadata
    const updatedProcedure = {
      ...procedureData,
      _id: procedureId,
      resourceType: 'Procedure',
      meta: {
        ...get(procedureData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingProcedure, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the procedure
    const result = await Procedures.updateAsync(
      { _id: procedureId },
      { $set: updatedProcedure }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Procedure updated', {
        userId: this.userId,
        procedureId: procedureId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'removeProcedure'(procedureId) {
    check(procedureId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove procedures');
    }
    
    const Procedures = getProcedures();
    
    // Check if procedure exists
    const existingProcedure = await Procedures.findOneAsync({ _id: procedureId });
    if (!existingProcedure) {
      throw new Meteor.Error('not-found', 'Procedure not found');
    }
    
    // Remove the procedure
    const result = await Procedures.removeAsync({ _id: procedureId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Procedure removed', {
        userId: this.userId,
        procedureId: procedureId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'procedures.get'(procedureId) {
    check(procedureId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view procedures');
    }

    const Procedures = getProcedures();
    console.log('procedures.get called with ID:', procedureId);
    console.log('Using Procedures collection:', !!Procedures);

    // Try both ways to find the procedure
    let procedure = await Procedures.findOneAsync({ _id: procedureId });

    if (!procedure) {
      // Also try without the query object
      procedure = await Procedures.findOneAsync(procedureId);
    }

    if (!procedure) {
      throw new Meteor.Error('not-found', 'Procedure not found');
    }

    return procedure;
  }
});
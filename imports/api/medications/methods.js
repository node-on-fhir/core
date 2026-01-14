// /imports/api/medications/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Medications';

// Get the correct Medications collection reference
function getMedications() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Medications || global.Medications;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Medications;
  }
}

Meteor.methods({
  async 'medications.create'(medicationData) {
    check(medicationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create medications');
    }

    // Add metadata
    const medication = {
      ...medicationData,
      resourceType: 'Medication',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    // Set _id based on environment variable for consistent sorting with Synthea data
    // This ensures new medications sort properly with existing ObjectID-based records
    if (process.env.USE_MONGO_OBJECTID) {
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      // Convert to hex string for Meteor compatibility
      medication._id = objectId.toHexString();
      console.log('[medications.create] Using MongoDB ObjectID (as hex string):', medication._id);
    }
    // Otherwise Meteor will auto-generate a random string ID

    // Insert and return the new medication
    const Medications = getMedications();
    const medicationId = await Medications.insertAsync(medication);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Medication created', {
        userId: this.userId,
        medicationId: medicationId,
        timestamp: new Date()
      });
    }
    
    return medicationId;
  },
  
  async 'medications.update'(medicationId, medicationData) {
    check(medicationId, String);
    check(medicationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update medications');
    }
    
    const Medications = getMedications();
    
    // Check if medication exists
    const existingMedication = await Medications.findOneAsync({ _id: medicationId });
    if (!existingMedication) {
      throw new Meteor.Error('not-found', 'Medication not found');
    }
    
    // Update metadata
    const updatedMedication = {
      ...medicationData,
      _id: medicationId,
      resourceType: 'Medication',
      meta: {
        ...get(medicationData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingMedication, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the medication
    const result = await Medications.updateAsync(
      { _id: medicationId },
      { $set: updatedMedication }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Medication updated', {
        userId: this.userId,
        medicationId: medicationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'medications.get'(medicationId) {
    check(medicationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view medications');
    }
    
    const Medications = getMedications();
    const medication = await Medications.findOneAsync({ _id: medicationId });
    
    if (!medication) {
      throw new Meteor.Error('not-found', 'Medication not found');
    }
    
    // Log access for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Medication accessed', {
        userId: this.userId,
        medicationId: medicationId,
        timestamp: new Date()
      });
    }
    
    return medication;
  },
  
  async 'medications.remove'(medicationId) {
    check(medicationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete medications');
    }
    
    const Medications = getMedications();
    
    // Check if medication exists
    const existingMedication = await Medications.findOneAsync({ _id: medicationId });
    if (!existingMedication) {
      throw new Meteor.Error('not-found', 'Medication not found');
    }
    
    // Remove the medication
    const result = await Medications.removeAsync({ _id: medicationId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Medication deleted', {
        userId: this.userId,
        medicationId: medicationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'medications.search'(searchOptions = {}) {
    check(searchOptions, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to search medications');
    }
    
    const Medications = getMedications();
    const { query = {}, options = {} } = searchOptions;
    
    // Add any necessary query transformations here
    // For example, searching by medication name
    if (searchOptions.name) {
      query['code.text'] = { $regex: searchOptions.name, $options: 'i' };
    }
    
    // Set default options
    const findOptions = {
      limit: options.limit || 20,
      sort: options.sort || { 'meta.lastUpdated': -1 },
      ...options
    };
    
    const medications = await Medications.findAsync(query, findOptions).then(cursor => cursor.toArray());
    
    // Log search for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Medications searched', {
        userId: this.userId,
        query: query,
        resultCount: medications.length,
        timestamp: new Date()
      });
    }
    
    return medications;
  }
});
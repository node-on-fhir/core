// /imports/api/patients/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';

Meteor.methods({
  async 'patients.insert'(patientData) {
    check(patientData, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create patients');
    }
    
    // Clean up the patient data to avoid parallel array indexing issues
    const cleanPatient = {
      resourceType: 'Patient',
      active: patientData.active !== undefined ? patientData.active : true
    };

    // Generate unique FHIR id - never accept from client to avoid collisions
    // Only accept ID if it's a non-empty string, otherwise generate
    if (!patientData.id || typeof patientData.id !== 'string' || patientData.id.trim() === '') {
      cleanPatient.id = Random.id();
    } else {
      cleanPatient.id = patientData.id;
    }
    
    // Set _id based on environment variable
    if (process.env.USE_MONGO_OBJECTID) {
      // Use MongoDB ObjectID for consistency with existing data
      const { Mongo } = Package.mongo;
      const objectId = new Mongo.ObjectID();
      // Convert to hex string for Meteor
      cleanPatient._id = objectId.toHexString();
      console.log('[patients.insert] Using MongoDB ObjectID (as hex string):', cleanPatient._id);
    } else {
      // Default: Set _id to match id (Meteor string ID)
      cleanPatient._id = cleanPatient.id;
      console.log('[patients.insert] Using Meteor string ID:', cleanPatient._id);
    }
    
    // Handle name - ensure it's an array with at least one entry
    if (patientData.name && patientData.name.length > 0) {
      cleanPatient.name = patientData.name.map(n => ({
        use: n.use || 'official',
        text: n.text || '',
        family: n.family || '',
        given: Array.isArray(n.given) ? n.given : [n.given || '']
      }));
    } else {
      throw new Meteor.Error('invalid-patient', 'Patient must have a name');
    }
    
    // Handle single value fields
    if (patientData.gender) cleanPatient.gender = patientData.gender;
    if (patientData.birthDate) cleanPatient.birthDate = patientData.birthDate;
    
    // Handle telecom array
    if (patientData.telecom && patientData.telecom.length > 0) {
      cleanPatient.telecom = patientData.telecom.filter(t => t.value).map(t => ({
        system: t.system || 'phone',
        value: t.value,
        use: t.use || 'home'
      }));
    }
    
    // Handle address array
    if (patientData.address && patientData.address.length > 0) {
      cleanPatient.address = patientData.address.map(a => ({
        use: a.use || 'home',
        type: a.type || 'both',
        line: Array.isArray(a.line) ? a.line.filter(l => l) : [],
        city: a.city || '',
        state: a.state || '',
        postalCode: a.postalCode || '',
        country: a.country || ''
      }));
    }
    
    // Handle communication array
    if (patientData.communication && patientData.communication.length > 0) {
      cleanPatient.communication = patientData.communication;
    }
    
    // Handle maritalStatus
    if (patientData.maritalStatus) {
      cleanPatient.maritalStatus = patientData.maritalStatus;
    }
    
    // Handle identifier array
    if (patientData.identifier && patientData.identifier.length > 0) {
      cleanPatient.identifier = patientData.identifier.map(id => ({
        use: id.use || 'usual',
        value: id.value || '',
        system: id.system,
        type: id.type
      })).filter(id => id.value);
    }
    
    // Handle extensions separately to avoid parallel array issues
    if (patientData.extension && patientData.extension.length > 0) {
      cleanPatient.extension = patientData.extension.filter(ext => 
        ext.url && (ext.valueCode || ext.valueCodeableConcept)
      );
    }
    
    // Validate required fields
    if (!get(cleanPatient, 'name[0].family') || !get(cleanPatient, 'name[0].given[0]')) {
      throw new Meteor.Error('invalid-patient', 'Patient must have a name');
    }
    
    try {
      console.log('[patients.insert] Inserting patient:', JSON.stringify(cleanPatient, null, 2));
      const result = await Patients.insertAsync(cleanPatient);
      console.log('[patients.insert] insertAsync returned ID:', result);

      // DIAGNOSTIC: Verify the patient was actually inserted
      const verifyPatient = await Patients.findOneAsync({ _id: result });
      if (verifyPatient) {
        console.log('[patients.insert] ✓ Verified patient exists in database with ID:', result);
      } else {
        console.error('[patients.insert] ✗ WARNING: insertAsync returned ID but patient NOT in database!');
        console.error('[patients.insert] This indicates a serious database issue');
      }

      return result;
    } catch (error) {
      console.error('[patients.insert] Error details:', {
        message: error.message,
        stack: error.stack,
        details: error.details,
        reason: error.reason
      });
      // If it's a validation error, include more details
      if (error.validationErrors) {
        console.error('[patients.insert] Validation errors:', error.validationErrors);
      }
      throw new Meteor.Error('insert-failed', error.message || 'Failed to insert patient', error.details);
    }
  },
  
  async 'patients.update'(selector, modifier) {
    check(selector, Object);
    check(modifier, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update patients');
    }
    
    // If we're doing a $set operation, clean the data
    if (modifier.$set) {
      const patientData = modifier.$set;
      const cleanPatient = {};
      
      // Copy over simple fields
      ['resourceType', 'id', 'active', 'gender', 'birthDate'].forEach(field => {
        if (patientData[field] !== undefined) {
          cleanPatient[field] = patientData[field];
        }
      });
      
      // Handle name array
      if (patientData.name) {
        cleanPatient.name = patientData.name.map(n => ({
          use: n.use || 'official',
          text: n.text || '',
          family: n.family || '',
          given: Array.isArray(n.given) ? n.given : [n.given || '']
        }));
      }
      
      // Handle telecom array - filter out empty values
      if (patientData.telecom) {
        cleanPatient.telecom = patientData.telecom.filter(t => t.value).map(t => ({
          system: t.system || 'phone',
          value: t.value,
          use: t.use || 'home'
        }));
      }
      
      // Handle address array
      if (patientData.address) {
        cleanPatient.address = patientData.address.map(a => ({
          use: a.use || 'home',
          type: a.type || 'both',
          line: Array.isArray(a.line) ? a.line.filter(l => l) : [],
          city: a.city || '',
          state: a.state || '',
          postalCode: a.postalCode || '',
          country: a.country || ''
        }));
      }
      
      // Handle other complex fields
      if (patientData.communication) cleanPatient.communication = patientData.communication;
      if (patientData.maritalStatus) cleanPatient.maritalStatus = patientData.maritalStatus;
      
      // Handle identifier array
      if (patientData.identifier) {
        cleanPatient.identifier = patientData.identifier.map(id => ({
          use: id.use || 'usual',
          value: id.value || '',
          system: id.system,
          type: id.type
        })).filter(id => id.value);
      }
      
      // Handle extensions
      if (patientData.extension) {
        cleanPatient.extension = patientData.extension.filter(ext => 
          ext.url && (ext.valueCode || ext.valueCodeableConcept)
        );
      }
      
      modifier.$set = cleanPatient;
    }
    
    try {
      console.log('[patients.update] Updating with:', modifier);
      const result = await Patients.updateAsync(selector, modifier);
      console.log('[patients.update] Updated patient:', result);
      return result;
    } catch (error) {
      console.error('[patients.update] Error:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },
  
  async 'patients.remove'(patientId) {
    check(patientId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove patients');
    }
    
    // In production, only allow deletion in test mode or from specific contexts
    // (e.g., MyProfile page would have additional checks)
    if (!process.env.TEST_RUN && !get(Meteor, 'settings.public.defaults.allowPatientDeletion', false)) {
      console.log('[patients.remove] Deletion blocked - not in TEST_RUN mode');
      throw new Meteor.Error('not-allowed', 'Patient deletion is restricted in production mode');
    }
    
    try {
      const result = await Patients.removeAsync({
        $or: [
          { id: patientId },
          { _id: patientId }
        ]
      });
      console.log('[patients.remove] Removed patient:', result);
      return result;
    } catch (error) {
      console.error('[patients.remove] Error:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },
  
  async 'patients.findOne'(patientId) {
    check(patientId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view patients');
    }
    
    try {
      const patient = await Patients.findOneAsync({
        $or: [
          { id: patientId },
          { _id: patientId }
        ]
      });
      return patient;
    } catch (error) {
      console.error('[patients.findOne] Error:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});
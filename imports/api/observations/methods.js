// /imports/api/observations/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.methods({
  async 'observations.create'(observationData) {
    check(observationData, Object);

    console.log('=== observations.create called ===');
    console.log('User ID:', this.userId);
    console.log('Observation data received:', JSON.stringify(observationData, null, 2));
    
    // Generate FHIR id if not provided
    const fhirId = observationData.id || Random.id();
    
    // Add metadata
    const observation = {
      ...observationData,
      id: fhirId,
      resourceType: 'Observation',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    console.log('Observation to insert:', JSON.stringify(observation, null, 2));
    
    // Insert and return the new observation
    const observationId = await Observations._collection.insertAsync(observation);
    console.log('Successfully inserted observation with _id:', observationId);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Observation created', {
        userId: this.userId,
        observationId: observationId,
        fhirId: fhirId,
        timestamp: new Date()
      });
    }
    
    return observationId;
  },
  
  async 'observations.update'(observationId, observationData) {
    check(observationId, String);
    check(observationData, Object);

    // Check if observation exists - try _id first, then id
    let existingObservation = await Observations.findOneAsync({ _id: observationId });
    if (!existingObservation) {
      existingObservation = await Observations.findOneAsync({ id: observationId });
    }
    if (!existingObservation) {
      throw new Meteor.Error('not-found', 'Observation not found');
    }
    
    // Update metadata
    const updatedObservation = {
      ...observationData,
      _id: existingObservation._id,  // Use the actual _id from the found observation
      id: existingObservation.id,    // Preserve the FHIR id
      resourceType: 'Observation',
      meta: {
        ...get(observationData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingObservation, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the observation using the actual _id
    const result = await Observations._collection.updateAsync(
      { _id: existingObservation._id },
      { $set: updatedObservation }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Observation updated', {
        userId: this.userId,
        observationId: observationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'observations.remove'(observationId) {
    check(observationId, String);

    // Check if observation exists - try _id first, then id
    let existingObservation = await Observations.findOneAsync({ _id: observationId });
    if (!existingObservation) {
      existingObservation = await Observations.findOneAsync({ id: observationId });
    }
    if (!existingObservation) {
      throw new Meteor.Error('not-found', 'Observation not found');
    }
    
    // Remove the observation using the actual _id
    const result = await Observations._collection.removeAsync({ _id: existingObservation._id });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Observation removed', {
        userId: this.userId,
        observationId: observationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'observations.get'(observationId) {
    check(observationId, String);

    console.log('=== observations.get called with observationId:', observationId);
    
    // Try to find by _id first, then by id
    let observation = await Observations.findOneAsync({ _id: observationId });
    
    if (!observation) {
      console.log('Not found by _id, trying by FHIR id...');
      // Try finding by FHIR id
      observation = await Observations.findOneAsync({ id: observationId });
    }
    
    if (!observation) {
      console.log('Observation not found with _id or id:', observationId);
      // Let's also log what observations exist to help debug
      const allObservations = await Observations.find({}, { limit: 5 }).fetchAsync();
      console.log('Sample observations in DB:', allObservations.map(o => ({ _id: o._id, id: o.id })));
      throw new Meteor.Error('not-found', 'Observation not found');
    }
    
    console.log('Found observation:', { _id: observation._id, id: observation.id });
    return observation;
  }
});
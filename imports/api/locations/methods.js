// /imports/api/locations/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';

Meteor.methods({
  async 'locations.create'(locationData) {
    check(locationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create locations');
    }
    
    console.log('=== locations.create called ===');
    console.log('User ID:', this.userId);
    console.log('Location data received:', JSON.stringify(locationData, null, 2));
    
    // Generate FHIR id if not provided
    const fhirId = locationData.id || Random.id();
    
    // Add metadata
    const location = {
      ...locationData,
      id: fhirId,
      resourceType: 'Location',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    console.log('Location to insert:', JSON.stringify(location, null, 2));
    
    // Insert and return the new location
    const locationId = await Locations._collection.insertAsync(location);
    console.log('Successfully inserted location with _id:', locationId);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Location created', {
        userId: this.userId,
        locationId: locationId,
        fhirId: fhirId,
        timestamp: new Date()
      });
    }
    
    return locationId;
  },
  
  async 'locations.update'(locationId, locationData) {
    check(locationId, String);
    check(locationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update locations');
    }
    
    // Check if location exists - try _id first, then id
    let existingLocation = await Locations.findOneAsync({ _id: locationId });
    if (!existingLocation) {
      existingLocation = await Locations.findOneAsync({ id: locationId });
    }
    if (!existingLocation) {
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    // Update metadata
    const updatedLocation = {
      ...locationData,
      _id: existingLocation._id,  // Use the actual _id from the found location
      id: existingLocation.id,    // Preserve the FHIR id
      resourceType: 'Location',
      meta: {
        ...get(locationData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingLocation, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the location using the actual _id
    const result = await Locations._collection.updateAsync(
      { _id: existingLocation._id },
      { $set: updatedLocation }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Location updated', {
        userId: this.userId,
        locationId: locationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'locations.remove'(locationId) {
    check(locationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove locations');
    }
    
    // Check if location exists - try _id first, then id
    let existingLocation = await Locations.findOneAsync({ _id: locationId });
    if (!existingLocation) {
      existingLocation = await Locations.findOneAsync({ id: locationId });
    }
    if (!existingLocation) {
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    // Remove the location using the actual _id
    const result = await Locations._collection.removeAsync({ _id: existingLocation._id });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Location removed', {
        userId: this.userId,
        locationId: locationId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'locations.get'(locationId) {
    check(locationId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view locations');
    }
    
    console.log('=== locations.get called with locationId:', locationId);
    
    // Try to find by _id first, then by id
    let location = await Locations.findOneAsync({ _id: locationId });
    
    if (!location) {
      console.log('Not found by _id, trying by FHIR id...');
      // Try finding by FHIR id
      location = await Locations.findOneAsync({ id: locationId });
    }
    
    if (!location) {
      console.log('Location not found with _id or id:', locationId);
      // Let's also log what locations exist to help debug
      const allLocations = await Locations.find({}, { limit: 5 }).fetchAsync();
      console.log('Sample locations in DB:', allLocations.map(l => ({ _id: l._id, id: l.id })));
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    console.log('Found location:', { _id: location._id, id: location.id });
    return location;
  }
});
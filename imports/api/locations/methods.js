// /imports/api/locations/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';

Meteor.methods({
  async 'locations.create'(locationData) {
    check(locationData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create locations');
    }
    
    // Add metadata
    const location = {
      ...locationData,
      resourceType: 'Location',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };
    
    // Insert and return the new location
    const locationId = await Locations._collection.insertAsync(location);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Location created', {
        userId: this.userId,
        locationId: locationId,
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
    
    // Check if location exists
    const existingLocation = await Locations.findOneAsync({ _id: locationId });
    if (!existingLocation) {
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    // Update metadata
    const updatedLocation = {
      ...locationData,
      _id: locationId,
      resourceType: 'Location',
      meta: {
        ...get(locationData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingLocation, 'meta.versionId', '0')) + 1)
      }
    };
    
    // Update the location
    const result = await Locations._collection.updateAsync(
      { _id: locationId },
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
    
    // Check if location exists
    const existingLocation = await Locations.findOneAsync({ _id: locationId });
    if (!existingLocation) {
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    // Remove the location
    const result = await Locations._collection.removeAsync({ _id: locationId });
    
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
    
    const location = await Locations.findOneAsync({ _id: locationId });
    
    if (!location) {
      throw new Meteor.Error('not-found', 'Location not found');
    }
    
    return location;
  }
});
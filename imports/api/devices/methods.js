// /imports/api/devices/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Devices } from '../../lib/schemas/SimpleSchemas/Devices';

Meteor.methods({
  async 'devices.create'(deviceData) {
    check(deviceData, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create devices');
    }
    
    // Clean up the device data
    const cleanDevice = {
      resourceType: 'Device',
      id: deviceData.id || Random.id(),
      status: deviceData.status || 'active'
    };
    
    // Set _id to match id (Meteor string ID)
    cleanDevice._id = cleanDevice.id;
    console.log('[devices.create] Using Meteor string ID:', cleanDevice._id);
    
    // Handle deviceName - ensure it's an array with at least one entry
    if (deviceData.deviceName && deviceData.deviceName.length > 0) {
      cleanDevice.deviceName = deviceData.deviceName.map(n => ({
        name: n.name || '',
        type: n.type || 'udi-label-name'
      }));
    } else if (deviceData.deviceName) {
      // If single object provided, convert to array
      cleanDevice.deviceName = [{
        name: get(deviceData, 'deviceName.name', ''),
        type: get(deviceData, 'deviceName.type', 'udi-label-name')
      }];
    }
    
    // Handle simple fields
    if (deviceData.manufacturer) cleanDevice.manufacturer = deviceData.manufacturer;
    if (deviceData.modelNumber) cleanDevice.modelNumber = deviceData.modelNumber;
    if (deviceData.serialNumber) cleanDevice.serialNumber = deviceData.serialNumber;
    if (deviceData.lotNumber) cleanDevice.lotNumber = deviceData.lotNumber;
    if (deviceData.manufactureDate) cleanDevice.manufactureDate = deviceData.manufactureDate;
    if (deviceData.expirationDate) cleanDevice.expirationDate = deviceData.expirationDate;
    
    // Handle type (CodeableConcept)
    if (deviceData.type) {
      cleanDevice.type = deviceData.type;
    }
    
    // Handle version array
    if (deviceData.version && deviceData.version.length > 0) {
      cleanDevice.version = deviceData.version.filter(v => v.value);
    }
    
    // Handle patient reference
    if (deviceData.patient) {
      cleanDevice.patient = deviceData.patient;
    }
    
    // Handle note array
    if (deviceData.note && deviceData.note.length > 0) {
      cleanDevice.note = deviceData.note.filter(n => n.text);
    }
    
    // Validate required fields
    if (!get(cleanDevice, 'deviceName[0].name')) {
      throw new Meteor.Error('invalid-device', 'Device must have a name');
    }
    
    try {
      console.log('[devices.create] Inserting device:', cleanDevice);
      const result = await Devices.insertAsync(cleanDevice);
      console.log('[devices.create] Created device:', result);
      return result;
    } catch (error) {
      console.error('[devices.create] Error:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },
  
  async 'devices.update'(deviceId, deviceData) {
    check(deviceId, String);
    check(deviceData, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update devices');
    }
    
    // Clean the data similar to create
    const cleanDevice = { ...deviceData };
    
    // Remove _id from update data to prevent conflicts
    delete cleanDevice._id;
    
    try {
      console.log('[devices.update] Updating device:', deviceId, cleanDevice);
      const result = await Devices.updateAsync(
        { $or: [{ id: deviceId }, { _id: deviceId }] },
        { $set: cleanDevice }
      );
      console.log('[devices.update] Updated device:', result);
      return result;
    } catch (error) {
      console.error('[devices.update] Error:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },
  
  async 'devices.remove'(deviceId) {
    check(deviceId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove devices');
    }
    
    // TODO: Add role-based access control (RBAC) here in the future
    // For now, only authentication is required
    // Example future implementation:
    // if (!Roles.userIsInRole(this.userId, ['admin', 'device-manager'])) {
    //   throw new Meteor.Error('not-authorized', 'User does not have permission to delete devices');
    // }
    
    try {
      const result = await Devices.removeAsync({
        $or: [
          { id: deviceId },
          { _id: deviceId }
        ]
      });
      console.log('[devices.remove] Removed device:', result);
      return result;
    } catch (error) {
      console.error('[devices.remove] Error:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },
  
  async 'devices.findOne'(deviceId) {
    check(deviceId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view devices');
    }
    
    try {
      const device = await Devices.findOneAsync({
        $or: [
          { id: deviceId },
          { _id: deviceId }
        ]
      });
      return device;
    } catch (error) {
      console.error('[devices.findOne] Error:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});
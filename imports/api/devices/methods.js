// /imports/api/devices/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Devices } from '../../lib/schemas/SimpleSchemas/Devices';

// Helper: find a device by _id, with ObjectID fallback for imported data (Synthea)
async function findDeviceById(deviceId) {
  // Try string _id first (Meteor-created records)
  let device = await Devices.findOneAsync({ _id: deviceId });

  // If not found, try as MongoDB ObjectID (Synthea/imported data)
  if (!device && /^[0-9a-fA-F]{24}$/.test(deviceId)) {
    device = await Devices.findOneAsync({ _id: new Mongo.ObjectID(deviceId) });
  }

  return device;
}

Meteor.ServerMethods.define('devices.create', {
  description: 'Create a FHIR Device record',
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const deviceData = params;

  // Clean up the device data
  const cleanDevice = {
    resourceType: 'Device',
    id: deviceData.id || Random.id(),
    status: deviceData.status || 'active'
  };

  // Set _id to match id (Meteor string ID)
  cleanDevice._id = cleanDevice.id;
  context.log.info('Using Meteor string ID', { _id: cleanDevice._id });

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
    const result = await Devices.insertAsync(cleanDevice);
    context.log.info('Created device', { deviceId: result });
    return result;
  } catch (error) {
    context.log.error('Error creating device', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('devices.update', {
  description: 'Update an existing FHIR Device record by id',
  phi: true,
  positionalParams: ['deviceId', 'deviceData'],
  schemaObject: {
    type: 'object',
    properties: {
      deviceId: { type: 'string' },
      deviceData: { type: 'object' }
    },
    required: ['deviceId', 'deviceData']
  }
}, async function(params, context){
  const { deviceId, deviceData } = params;

  // Clean the data similar to create
  const cleanDevice = { ...deviceData };

  // Remove _id from update data to prevent conflicts
  delete cleanDevice._id;

  try {
    // Find the device first to get the correct _id (handles ObjectID)
    const existing = await findDeviceById(deviceId);
    if (!existing) {
      throw new Meteor.Error('not-found', 'Device not found: ' + deviceId);
    }

    const result = await Devices.updateAsync(
      { _id: existing._id },
      { $set: cleanDevice }
    );
    context.log.info('Updated device', { deviceId: existing._id, updated: result });
    return result;
  } catch (error) {
    context.log.error('Error updating device', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('devices.remove', {
  description: 'Remove a FHIR Device record by id',
  phi: true,
  positionalParams: ['deviceId'],
  schemaObject: {
    type: 'object',
    properties: { deviceId: { type: 'string' } },
    required: ['deviceId']
  }
}, async function(params, context){
  const deviceId = params.deviceId;

  // TODO: Add role-based access control (RBAC) here in the future
  // For now, only authentication is required (requireAuth default)
  // Example future implementation:
  // if (!Roles.userIsInRole(context.userId, ['admin', 'device-manager'])) {
  //   throw new Meteor.Error('not-authorized', 'User does not have permission to delete devices');
  // }

  try {
    // Find the device first to get the correct _id (handles ObjectID)
    const existing = await findDeviceById(deviceId);
    if (!existing) {
      throw new Meteor.Error('not-found', 'Device not found: ' + deviceId);
    }

    const result = await Devices.removeAsync({ _id: existing._id });
    context.log.info('Removed device', { deviceId: existing._id, removed: result });
    return result;
  } catch (error) {
    context.log.error('Error removing device', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

Meteor.ServerMethods.define('devices.findOne', {
  description: 'Fetch a single FHIR Device record by id',
  phi: true,
  positionalParams: ['deviceId'],
  schemaObject: {
    type: 'object',
    properties: { deviceId: { type: 'string' } },
    required: ['deviceId']
  }
}, async function(params, context){
  const deviceId = params.deviceId;

  try {
    const device = await findDeviceById(deviceId);
    return device;
  } catch (error) {
    context.log.error('Error finding device', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});

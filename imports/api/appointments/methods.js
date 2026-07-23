// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/appointments/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { get, set, has, unset } from 'lodash';

import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';

Meteor.ServerMethods.define('appointments.create', {
  description: 'Create a new Appointment resource',
  aliases: ['createAppointment'],
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR Appointment shape
}, async function(params, context){
  const appointmentData = params;

  context.log.debug('Creating appointment', { data: appointmentData });

  // Create a clean appointment object
  let cleanAppointment = {
    resourceType: 'Appointment',
    status: get(appointmentData, 'status', 'proposed'),
    participant: []
  };

  // Generate ID
  cleanAppointment.id = Random.id();

  // Use MongoDB ObjectID if configured
  if (process.env.USE_MONGO_OBJECTID) {
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    cleanAppointment._id = objectId.toHexString();
  } else {
    cleanAppointment._id = cleanAppointment.id;
  }

  // Basic fields
  if (has(appointmentData, 'status')) {
    cleanAppointment.status = appointmentData.status;
  }
  if (has(appointmentData, 'priority')) {
    cleanAppointment.priority = appointmentData.priority;
  }
  if (has(appointmentData, 'description')) {
    cleanAppointment.description = appointmentData.description;
  }
  if (has(appointmentData, 'comment')) {
    cleanAppointment.comment = appointmentData.comment;
  }
  if (has(appointmentData, 'patientInstruction')) {
    cleanAppointment.patientInstruction = appointmentData.patientInstruction;
  }
  if (has(appointmentData, 'minutesDuration')) {
    cleanAppointment.minutesDuration = appointmentData.minutesDuration;
  }

  // Date fields
  if (has(appointmentData, 'start')) {
    cleanAppointment.start = appointmentData.start;
  }
  if (has(appointmentData, 'end')) {
    cleanAppointment.end = appointmentData.end;
  }
  if (has(appointmentData, 'created')) {
    cleanAppointment.created = appointmentData.created;
  } else {
    cleanAppointment.created = new Date();
  }

  // CodeableConcept fields
  if (has(appointmentData, 'appointmentType')) {
    cleanAppointment.appointmentType = appointmentData.appointmentType;
  }
  if (has(appointmentData, 'reasonCode')) {
    cleanAppointment.reasonCode = appointmentData.reasonCode;
  }
  if (has(appointmentData, 'serviceCategory')) {
    cleanAppointment.serviceCategory = appointmentData.serviceCategory;
  }
  if (has(appointmentData, 'serviceType')) {
    cleanAppointment.serviceType = appointmentData.serviceType;
  }
  if (has(appointmentData, 'specialty')) {
    cleanAppointment.specialty = appointmentData.specialty;
  }

  // Subject (for consistency with other resources)
  if (has(appointmentData, 'subject')) {
    cleanAppointment.subject = appointmentData.subject;
  }

  // Participants
  if (has(appointmentData, 'participant') && Array.isArray(appointmentData.participant)) {
    cleanAppointment.participant = appointmentData.participant;
  }

  // Notes
  if (has(appointmentData, 'note') && Array.isArray(appointmentData.note)) {
    cleanAppointment.note = appointmentData.note;
  }

  // Meta
  cleanAppointment.meta = {
    versionId: '1',
    lastUpdated: new Date()
  };

  context.log.debug('Inserting clean appointment', { data: cleanAppointment });

  try {
    const appointmentId = await Appointments.insertAsync(cleanAppointment);
    context.log.info('Appointment created', { appointmentId: appointmentId });

    // Log the audit event
    if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
      const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
      await Meteor.callAsync('logAuditEvent', {
        eventType: 'create',
        userId: context.userId,
        userName: get(currentUser, 'username', 'Unknown User'),
        collectionName: 'Appointments',
        recordId: appointmentId,
        patientId: null,
        patientName: null,
        message: 'Appointment created'
      });
    }

    return appointmentId;
  } catch (error) {
    context.log.error('Error creating appointment', { message: error.message });
    throw new Meteor.Error('insert-failed', 'Failed to create appointment', error.message);
  }
});

Meteor.ServerMethods.define('appointments.update', {
  description: 'Update an existing Appointment resource by id',
  aliases: ['updateAppointment'],
  phi: true,
  positionalParams: ['appointmentId', 'appointmentData'],
  schemaObject: {
    type: 'object',
    properties: {
      appointmentId: { type: 'string' },
      appointmentData: { type: 'object' }
    },
    required: ['appointmentId', 'appointmentData']
  }
}, async function(params, context){
  const appointmentId = params.appointmentId;
  const appointmentData = params.appointmentData;

  context.log.debug('Updating appointment', { appointmentId: appointmentId, data: appointmentData });

  // Get existing appointment
  const existingAppointment = await Appointments.findOneAsync({_id: appointmentId});
  if (!existingAppointment) {
    throw new Meteor.Error('not-found', 'Appointment not found');
  }

  // Build update object
  let updateData = {
    $set: {}
  };

  // Basic fields
  const fieldsToUpdate = [
    'status', 'priority', 'description', 'comment',
    'patientInstruction', 'minutesDuration', 'start',
    'end', 'created', 'appointmentType', 'reasonCode',
    'serviceCategory', 'serviceType', 'specialty',
    'participant', 'note'
  ];

  fieldsToUpdate.forEach(field => {
    if (has(appointmentData, field)) {
      updateData.$set[field] = appointmentData[field];
    }
  });

  // Handle subject field separately (for consistency with other resources)
  if (has(appointmentData, 'subject')) {
    updateData.$set['subject'] = appointmentData.subject;
  }

  // Update meta
  updateData.$set['meta.lastUpdated'] = new Date();
  updateData.$set['meta.versionId'] = String(parseInt(get(existingAppointment, 'meta.versionId', '1')) + 1);

  context.log.debug('Update data', { data: updateData });

  try {
    const result = await Appointments.updateAsync(
      { _id: appointmentId },
      updateData
    );

    context.log.info('Appointment updated', { appointmentId: appointmentId, result: result });

    // Log the audit event
    if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
      const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
      await Meteor.callAsync('logAuditEvent', {
        eventType: 'update',
        userId: context.userId,
        userName: get(currentUser, 'username', 'Unknown User'),
        collectionName: 'Appointments',
        recordId: appointmentId,
        patientId: null,
        patientName: null,
        message: 'Appointment updated'
      });
    }

    return appointmentId;
  } catch (error) {
    context.log.error('Error updating appointment', { message: error.message });
    throw new Meteor.Error('update-failed', 'Failed to update appointment', error.message);
  }
});

Meteor.ServerMethods.define('appointments.remove', {
  description: 'Delete an Appointment resource by id',
  aliases: ['removeAppointment'],
  phi: true,
  positionalParams: ['appointmentId'],
  schemaObject: {
    type: 'object',
    properties: {
      appointmentId: { type: 'string' }
    },
    required: ['appointmentId']
  }
}, async function(params, context){
  const appointmentId = params.appointmentId;

  context.log.debug('Removing appointment', { appointmentId: appointmentId });

  // Check if appointment exists
  const appointment = await Appointments.findOneAsync({_id: appointmentId});
  if (!appointment) {
    throw new Meteor.Error('not-found', 'Appointment not found');
  }

  try {
    const result = await Appointments.removeAsync({_id: appointmentId});
    context.log.info('Appointment removed', { appointmentId: appointmentId, result: result });

    // Log the audit event
    if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
      const currentUser = await Meteor.users.findOneAsync({ _id: context.userId });
      await Meteor.callAsync('logAuditEvent', {
        eventType: 'delete',
        userId: context.userId,
        userName: get(currentUser, 'username', 'Unknown User'),
        collectionName: 'Appointments',
        recordId: appointmentId,
        patientId: null,
        patientName: null,
        message: 'Appointment deleted'
      });
    }

    return result;
  } catch (error) {
    context.log.error('Error removing appointment', { message: error.message });
    throw new Meteor.Error('remove-failed', 'Failed to remove appointment', error.message);
  }
});

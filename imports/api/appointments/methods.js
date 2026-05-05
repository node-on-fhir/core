// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/appointments/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set, has, unset } from 'lodash';

import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';

Meteor.methods({
  async createAppointment(appointmentData) {
    console.log('Creating appointment with data:', appointmentData);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to create appointments');
    }

    check(appointmentData, Object);

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

    console.log('Inserting clean appointment:', cleanAppointment);

    try {
      const appointmentId = await Appointments.insertAsync(cleanAppointment);
      console.log('Appointment created with ID:', appointmentId);
      
      // Log the audit event
      if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
        const currentUser = await Meteor.userAsync();
        await Meteor.callAsync('logAuditEvent', {
          eventType: 'create',
          userId: this.userId,
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
      console.error('Error creating appointment:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create appointment', error.message);
    }
  },

  async updateAppointment(appointmentId, appointmentData) {
    console.log('Updating appointment:', appointmentId, appointmentData);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to update appointments');
    }

    check(appointmentId, String);
    check(appointmentData, Object);

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

    console.log('Update data:', updateData);

    try {
      const result = await Appointments.updateAsync(
        { _id: appointmentId },
        updateData
      );
      
      console.log('Update result:', result);
      
      // Log the audit event
      if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
        const currentUser = await Meteor.userAsync();
        await Meteor.callAsync('logAuditEvent', {
          eventType: 'update',
          userId: this.userId,
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
      console.error('Error updating appointment:', error);
      throw new Meteor.Error('update-failed', 'Failed to update appointment', error.message);
    }
  },

  async removeAppointment(appointmentId) {
    console.log('Removing appointment:', appointmentId);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to delete appointments');
    }

    check(appointmentId, String);

    // Check if appointment exists
    const appointment = await Appointments.findOneAsync({_id: appointmentId});
    if (!appointment) {
      throw new Meteor.Error('not-found', 'Appointment not found');
    }

    try {
      const result = await Appointments.removeAsync({_id: appointmentId});
      console.log('Remove result:', result);
      
      // Log the audit event
      if (Meteor.isServer && get(Meteor, 'settings.private.enableAuditLogging', false)) {
        const currentUser = await Meteor.userAsync();
        await Meteor.callAsync('logAuditEvent', {
          eventType: 'delete',
          userId: this.userId,
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
      console.error('Error removing appointment:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove appointment', error.message);
    }
  }
});
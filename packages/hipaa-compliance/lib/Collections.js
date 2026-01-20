// packages/hipaa-compliance/lib/Collections.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import SimpleSchema from 'simpl-schema';
import { EventTypes } from './Constants';

// Create the collection
HipaaAuditLog = new Mongo.Collection('HipaaAuditLog');

// Define the schema
const HipaaAuditLogSchema = new SimpleSchema({
  // Event Information
  eventType: {
    type: String,
    allowedValues: Object.values(EventTypes)
  },
  eventDate: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  
  // User Information
  userId: {
    type: String,
    optional: true
  },
  userName: {
    type: String,
    optional: true
  },
  userEmail: {
    type: String,
    optional: true
  },
  userRoles: {
    type: Array,
    optional: true
  },
  'userRoles.$': {
    type: String
  },
  
  // Resource Information
  resourceType: {
    type: String,
    optional: true
  },
  resourceId: {
    type: String,
    optional: true
  },
  collectionName: {
    type: String,
    optional: true
  },
  
  // Patient Context
  patientId: {
    type: String,
    optional: true
  },
  patientName: {
    type: String,
    optional: true
  },
  
  // Event Details
  message: {
    type: String,
    optional: true
  },
  metadata: {
    type: Object,
    optional: true,
    blackbox: true
  },
  
  // Security and Tracking
  ipAddress: {
    type: String,
    optional: true
  },
  userAgent: {
    type: String,
    optional: true
  },
  sessionId: {
    type: String,
    optional: true
  },
  
  // Compliance Fields
  encryptionLevel: {
    type: String,
    optional: true
  },
  signature: {
    type: String,
    optional: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset(); // Prevent updates
      }
    }
  }
});

// Store schema reference for validation
HipaaAuditLog.schema = HipaaAuditLogSchema;

// Security rules - Write only, no updates or deletes
HipaaAuditLog.allow({
  insert: function (userId, doc) {
    // Only allow inserts from authenticated users or system
    return userId || doc.userId === 'system';
  },
  update: function () {
    // Audit logs are immutable
    return false;
  },
  remove: function () {
    // Audit logs cannot be deleted
    return false;
  }
});

// Helper functions (exported separately since we're not using collection2)
export const HipaaAuditLogHelpers = {
  getUser: function(doc) {
    if (doc.userId) {
      return Meteor.users.findOne(doc.userId);
    }
  },
  
  getPatient: async function(doc) {
    if (doc.patientId && Meteor.isServer) {
      const Patients = await global.Collections.Patients;
      if (Patients) {
        return await Patients.findOneAsync(doc.patientId);
      }
    }
  },
  
  isPatientRelated: function(doc) {
    return !!doc.patientId;
  },
  
  getEventIcon: function(doc) {
    const iconMap = {
      'view': 'visibility',
      'create': 'add_circle',
      'update': 'edit',
      'delete': 'delete',
      'login': 'login',
      'logout': 'logout',
      'denied': 'block',
      'error': 'error',
      'export': 'file_download'
    };
    return iconMap[doc.eventType] || 'info';
  },
  
  getEventColor: function(doc) {
    const colorMap = {
      'view': 'info',
      'create': 'success',
      'update': 'warning',
      'delete': 'error',
      'denied': 'error',
      'error': 'error'
    };
    return colorMap[doc.eventType] || 'default';
  }
};

// Export for use in other files
export { HipaaAuditLog, HipaaAuditLogSchema, HipaaAuditLogHelpers };
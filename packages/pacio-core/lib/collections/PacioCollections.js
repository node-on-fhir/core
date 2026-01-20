// /packages/pacio-core/lib/collections/PacioCollections.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';

// Extend the window object to make collections globally available
if (Meteor.isClient) {
  window.PacioCollections = {};
}

// Collection for tracking patient sync status
export const PatientSyncStatus = new Mongo.Collection('PatientSyncStatus');
PatientSyncStatus.schema = new SimpleSchema({
  patientId: {
    type: String
  },
  lastSyncDate: {
    type: Date
  },
  resourcesSynced: {
    type: Object,
    blackbox: true
  },
  syncStatus: {
    type: String,
    allowedValues: ['pending', 'in-progress', 'completed', 'failed']
  },
  errors: {
    type: Array,
    optional: true
  },
  'errors.$': {
    type: Object,
    blackbox: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
});

// Collection for watermarked PDF cache
export const WatermarkedPdfCache = new Mongo.Collection('WatermarkedPdfCache');
WatermarkedPdfCache.schema = new SimpleSchema({
  originalUrl: {
    type: String
  },
  watermarkText: {
    type: String
  },
  watermarkedUrl: {
    type: String
  },
  watermarkConfig: {
    type: Object,
    blackbox: true
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  }
});

// Collection for advance directive templates
export const AdvanceDirectiveTemplates = new Mongo.Collection('AdvanceDirectiveTemplates');
AdvanceDirectiveTemplates.schema = new SimpleSchema({
  name: {
    type: String
  },
  type: {
    type: Object
  },
  'type.coding': {
    type: Array
  },
  'type.coding.$': {
    type: Object
  },
  'type.coding.$.system': {
    type: String
  },
  'type.coding.$.code': {
    type: String
  },
  'type.coding.$.display': {
    type: String
  },
  description: {
    type: String,
    optional: true
  },
  templateContent: {
    type: String,
    optional: true
  },
  fields: {
    type: Array,
    optional: true
  },
  'fields.$': {
    type: Object,
    blackbox: true
  },
  isActive: {
    type: Boolean,
    defaultValue: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
});

// Collection for goal achievement tracking
export const GoalAchievements = new Mongo.Collection('GoalAchievements');
GoalAchievements.schema = new SimpleSchema({
  goalId: {
    type: String
  },
  patientId: {
    type: String
  },
  achievementDate: {
    type: Date
  },
  achievementValue: {
    type: Object,
    blackbox: true
  },
  notes: {
    type: String,
    optional: true
  },
  recordedBy: {
    type: String,
    optional: true
  },
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      }
    }
  }
});

// Helper functions for collections
export const PacioCollectionHelpers = {
  // Clean up expired cache entries
  cleanupExpiredCache: async function() {
    if (Meteor.isServer) {
      const now = new Date();
      const result = await WatermarkedPdfCache.removeAsync({
        expiresAt: { $lt: now }
      });
      console.log(`Cleaned up ${result} expired PDF cache entries`);
      return result;
    }
  },
  
  // Get or create patient sync status
  getPatientSyncStatus: async function(patientId) {
    let status = await PatientSyncStatus.findOneAsync({ patientId });
    
    if (!status) {
      const statusId = await PatientSyncStatus.insertAsync({
        patientId,
        lastSyncDate: null,
        resourcesSynced: {},
        syncStatus: 'pending'
      });
      status = await PatientSyncStatus.findOneAsync(statusId);
    }
    
    return status;
  },
  
  // Update patient sync status
  updatePatientSyncStatus: async function(patientId, updates) {
    return await PatientSyncStatus.updateAsync(
      { patientId },
      { $set: updates },
      { upsert: true }
    );
  },
  
  // Get cached watermarked PDF
  getCachedWatermarkedPdf: async function(originalUrl, watermarkText) {
    const now = new Date();
    return await WatermarkedPdfCache.findOneAsync({
      originalUrl,
      watermarkText,
      expiresAt: { $gt: now }
    });
  },
  
  // Cache watermarked PDF
  cacheWatermarkedPdf: async function(originalUrl, watermarkText, watermarkedUrl, config = {}) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute cache
    
    return await WatermarkedPdfCache.insertAsync({
      originalUrl,
      watermarkText,
      watermarkedUrl,
      watermarkConfig: config,
      expiresAt
    });
  }
};

// Create indexes on server
if (Meteor.isServer) {
  Meteor.startup(function() {
    // PatientSyncStatus indexes
    PatientSyncStatus.createIndex({ patientId: 1 });
    
    // WatermarkedPdfCache indexes
    WatermarkedPdfCache.createIndex({ originalUrl: 1 });
    WatermarkedPdfCache.createIndex({ expiresAt: 1 });
    
    // GoalAchievements indexes
    GoalAchievements.createIndex({ goalId: 1 });
    GoalAchievements.createIndex({ patientId: 1 });
  });
}

// Make collections available globally on client
if (Meteor.isClient) {
  window.PacioCollections = {
    PatientSyncStatus,
    WatermarkedPdfCache,
    AdvanceDirectiveTemplates,
    GoalAchievements,
    helpers: PacioCollectionHelpers
  };
}
// /packages/pacio-core/lib/collections/BedsCollection.js

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';

// Create the Beds collection
export const Beds = new Mongo.Collection('Beds');

// In Meteor v3, async methods are automatically available on collections
// No need to explicitly add them - they come with the collection

// Define the schema
export const BedSchema = new SimpleSchema({
  // Bed identification
  bedId: {
    type: String,
    label: "Bed ID"
  },
  roomNumber: {
    type: String,
    label: "Room Number"
  },
  ward: {
    type: String,
    label: "Ward/Unit",
    optional: true
  },
  floor: {
    type: String,
    label: "Floor",
    optional: true
  },
  building: {
    type: String,
    label: "Building",
    optional: true
  },
  
  // Facility reference
  facilityId: {
    type: String,
    label: "Facility ID",
    optional: true
  },
  facilityName: {
    type: String,
    label: "Facility Name",
    optional: true
  },
  
  // Bed status
  status: {
    type: String,
    label: "Bed Status",
    allowedValues: ['available', 'occupied', 'maintenance', 'cleaning', 'reserved'],
    defaultValue: 'available'
  },
  
  // Patient assignment
  patientId: {
    type: String,
    label: "Patient ID",
    optional: true
  },
  encounterId: {
    type: String,
    label: "Encounter ID",
    optional: true
  },
  patientName: {
    type: String,
    label: "Patient Name",
    optional: true
  },
  patientMRN: {
    type: String,
    label: "Patient MRN",
    optional: true
  },
  patientAge: {
    type: Number,
    label: "Patient Age",
    optional: true
  },
  primaryCondition: {
    type: String,
    label: "Primary Condition",
    optional: true
  },
  acuityLevel: {
    type: String,
    label: "Acuity Level",
    optional: true,
    allowedValues: ['Stable', 'Monitoring', 'Critical']
  },
  
  // Clinical data
  vitals: {
    type: Object,
    label: "Vitals",
    optional: true,
    blackbox: true
  },
  medications: {
    type: Object,
    label: "Medications",
    optional: true,
    blackbox: true
  },
  labs: {
    type: Object,
    label: "Labs",
    optional: true,
    blackbox: true
  },
  tasks: {
    type: Object,
    label: "Tasks",
    optional: true,
    blackbox: true
  },
  fallRisk: {
    type: Boolean,
    label: "Fall Risk",
    optional: true
  },
  isolation: {
    type: Boolean,
    label: "Isolation",
    optional: true
  },
  dietRestrictions: {
    type: String,
    label: "Diet Restrictions",
    optional: true
  },
  
  // Assignment dates
  admissionDate: {
    type: Date,
    label: "Admission Date",
    optional: true
  },
  expectedDischargeDate: {
    type: Date,
    label: "Expected Discharge Date",
    optional: true
  },
  
  // Care team
  attendingPhysician: {
    type: String,
    label: "Attending Physician",
    optional: true
  },
  primaryNurse: {
    type: String,
    label: "Primary Nurse",
    optional: true
  },
  
  // Bed features
  bedType: {
    type: String,
    label: "Bed Type",
    allowedValues: ['standard', 'ICU', 'maternity', 'pediatric', 'bariatric', 'psychiatric'],
    defaultValue: 'standard'
  },
  features: {
    type: Array,
    label: "Bed Features",
    optional: true
  },
  'features.$': {
    type: String
  },
  
  // Metadata
  createdAt: {
    type: Date,
    autoValue: function() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return {$setOnInsert: new Date()};
      } else {
        this.unset();
      }
    }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  },
  updatedBy: {
    type: String,
    optional: true,
    autoValue: function() {
      if (this.userId) {
        return this.userId;
      }
    }
  }
});

// Export schema for use in methods validation
// Note: We don't attach the schema directly to the collection
// as this requires the Collection2 package

// Create indexes on server
if (Meteor.isServer) {
  Meteor.startup(async function() {
    try {
      await Beds.createIndexAsync({ bedId: 1 });
      await Beds.createIndexAsync({ patientId: 1 });
      await Beds.createIndexAsync({ status: 1 });
      console.log('Beds collection indexes created successfully');
    } catch (error) {
      console.error('Error creating Beds indexes:', error);
    }
  });
  
  // Allow/Deny rules
  Beds.allow({
    insert: function(userId, doc) {
      return userId;
    },
    update: function(userId, doc) {
      return userId;
    },
    remove: function(userId, doc) {
      return userId;
    }
  });
}

// Make it available globally
if (Meteor.isClient) {
  window.Beds = Beds;
}
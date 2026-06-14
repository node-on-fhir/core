// /packages/workqueues/lib/schemas/WorkQueueItemSchema.js

import SimpleSchema from 'simpl-schema';

export const WorkQueueItemSchema = new SimpleSchema({
  // Core fields from original Todos
  text: {
    type: String,
    max: 1000
  },
  description: {
    type: String,
    optional: true,
    max: 5000
  },
  done: {
    type: Boolean,
    defaultValue: false
  },
  star: {
    type: Boolean,
    defaultValue: false
  },
  
  // Enhanced priority system
  priority: {
    type: String,
    allowedValues: ['stat', 'urgent', 'asap', 'routine'],
    defaultValue: 'routine'
  },
  
  // Status tracking
  status: {
    type: String,
    allowedValues: ['draft', 'requested', 'received', 'accepted', 'rejected', 'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 'completed', 'entered-in-error'],
    defaultValue: 'requested'
  },
  
  // Queue assignment
  queueId: {
    type: String,
    optional: true
  },
  
  // Tags for categorization
  tags: {
    type: Array,
    optional: true,
    defaultValue: []
  },
  'tags.$': {
    type: String
  },
  
  // Assignment and ownership
  owner: {
    type: String,
    optional: true
  },
  creator: {
    type: String,
    autoValue: function() {
      if (this.isInsert) {
        return this.userId;
      } else if (this.isUpsert) {
        return {$setOnInsert: this.userId};
      } else {
        this.unset();
      }
    },
    optional: true
  },
  assignee: {
    type: String,
    optional: true
  },
  
  // Clinical context
  patientId: {
    type: String,
    optional: true
  },
  patientReference: {
    type: String,
    optional: true // FHIR reference format: "Patient/12345"
  },
  encounterId: {
    type: String,
    optional: true
  },
  encounterReference: {
    type: String,
    optional: true // FHIR reference format: "Encounter/12345"
  },
  practitionerId: {
    type: String,
    optional: true
  },
  practitionerReference: {
    type: String,
    optional: true // FHIR reference format: "Practitioner/12345"
  },
  
  // Timing
  dueDate: {
    type: Date,
    optional: true
  },
  completedAt: {
    type: Date,
    optional: true
  },
  startedAt: {
    type: Date,
    optional: true
  },
  
  // Visibility
  public: {
    type: Boolean,
    defaultValue: false
  },
  
  // Attachments
  image: {
    type: String,
    optional: true
  },
  attachments: {
    type: Array,
    optional: true,
    defaultValue: []
  },
  'attachments.$': {
    type: Object
  },
  'attachments.$.url': {
    type: String
  },
  'attachments.$.title': {
    type: String,
    optional: true
  },
  'attachments.$.contentType': {
    type: String,
    optional: true
  },
  
  // FHIR Task resource
  fhirTask: {
    type: Object,
    optional: true,
    blackbox: true
  },
  
  // Audit fields
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
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true
  },
  
  // Additional metadata
  category: {
    type: String,
    optional: true,
    allowedValues: ['imaging', 'laboratory', 'pharmacy', 'consultation', 'procedure', 'administrative', 'other']
  },
  intent: {
    type: String,
    allowedValues: ['proposal', 'plan', 'order', 'option'],
    defaultValue: 'order'
  },
  
  // For tracking completion percentage
  progress: {
    type: Number,
    optional: true,
    min: 0,
    max: 100,
    defaultValue: 0
  },
  
  // Notes and comments
  notes: {
    type: Array,
    optional: true,
    defaultValue: []
  },
  'notes.$': {
    type: Object
  },
  'notes.$.text': {
    type: String
  },
  'notes.$.authorId': {
    type: String
  },
  'notes.$.timestamp': {
    type: Date,
    autoValue: function() {
      return new Date();
    }
  }
});

WorkQueueItemSchema.messageBox.defaults({
  en: {
    required: '{{label}} is required',
    minString: '{{label}} must be at least {{min}} characters',
    maxString: '{{label}} cannot exceed {{max}} characters',
    regEx: '{{label}} failed validation'
  }
});
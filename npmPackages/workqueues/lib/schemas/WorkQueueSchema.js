// /packages/workqueues/lib/schemas/WorkQueueSchema.js

import { SimpleSchema } from 'meteor/aldeed:simple-schema';

export const WorkQueueSchema = new SimpleSchema({
  name: {
    type: String,
    max: 200
  },
  description: {
    type: String,
    optional: true,
    max: 1000
  },
  department: {
    type: String,
    optional: true,
    allowedValues: ['radiology', 'laboratory', 'pharmacy', 'nursing', 'emergency', 'surgery', 'general']
  },
  active: {
    type: Boolean,
    defaultValue: true
  },
  settings: {
    type: Object,
    optional: true,
    blackbox: true
  },
  'settings.autoAssign': {
    type: Boolean,
    optional: true,
    defaultValue: false
  },
  'settings.priorityThreshold': {
    type: String,
    optional: true,
    allowedValues: ['urgent', 'stat', 'routine'],
    defaultValue: 'routine'
  },
  'settings.maxItemsPerUser': {
    type: Number,
    optional: true,
    defaultValue: 20
  },
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
  createdBy: {
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
  }
});

WorkQueueSchema.messageBox.defaults({
  en: {
    required: '{{label}} is required',
    minString: '{{label}} must be at least {{min}} characters',
    maxString: '{{label}} cannot exceed {{max}} characters',
    regEx: '{{label}} failed validation'
  }
});
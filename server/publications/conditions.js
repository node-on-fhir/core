// server/publications/conditions.js

import { Meteor } from 'meteor/meteor';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';

const log = (Meteor.Logger ? Meteor.Logger.for('conditions') : console);

// Publish all conditions
Meteor.publish('conditions.all', function() {
  if (!this.userId) {
    return this.ready();
  }
  
  console.log('Publishing conditions.all for user:', this.userId);
  
  // For now, publish all conditions for logged-in users
  // In production, you'd want to filter by patient access rights
  return Conditions.find({});
});

// Publish a single condition by ID
Meteor.publish('conditions.byId', function(conditionId) {
  if (!this.userId || !conditionId) {
    return this.ready();
  }
  
  console.log('Publishing conditions.byId for ID:', conditionId);
  
  return Conditions.find({ _id: conditionId });
});

// Publish conditions for a specific patient
Meteor.publish('conditions.byPatient', function(patientId) {
  if (!this.userId || !patientId) {
    return this.ready();
  }
  
  log.debug('Publishing conditions for patient:', { patientId });

  return Conditions.find({
    'subject.reference': `Patient/${patientId}` 
  });
});
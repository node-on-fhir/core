// packages/reference-app/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('publications') : console);

// =============================================================================
// PUBLICATIONS
// =============================================================================

// ---------------------------------------------------------------------------
// Reference App Data Publication
// ---------------------------------------------------------------------------

Meteor.publish('referenceApp.data', async function(patientId, options = {}) {
  log.debug('Publishing referenceApp.data for patient:', { patientId });
  
  // Check if user is authenticated
  if (!this.userId) {
    console.warn('Unauthorized subscription attempt to referenceApp.data');
    return this.ready();
  }
  
  // Validate inputs
  check(patientId, Match.Maybe(String));
  check(options, {
    limit: Match.Maybe(Number),
    sort: Match.Maybe(Object),
    fields: Match.Maybe(Object)
  });
  
  try {
    // Get collections
    const Observations = await global.Collections.Observations;
    const Procedures = await global.Collections.Procedures;
    
    const cursors = [];
    
    // Publish observations for the patient
    if (Observations && patientId) {
      const observationsCursor = Observations.find(
        { 'subject.reference': `Patient/${patientId}` },
        {
          limit: get(options, 'limit', 100),
          sort: get(options, 'sort', { effectiveDateTime: -1 }),
          fields: get(options, 'fields', {})
        }
      );
      cursors.push(observationsCursor);
    }
    
    // Publish procedures for the patient
    if (Procedures && patientId) {
      const proceduresCursor = Procedures.find(
        { 'subject.reference': `Patient/${patientId}` },
        {
          limit: get(options, 'limit', 100),
          sort: get(options, 'sort', { performedDateTime: -1 })
        }
      );
      cursors.push(proceduresCursor);
    }
    
    return cursors;
    
  } catch (error) {
    console.error('Error in referenceApp.data publication:', error);
    return this.ready();
  }
});

// ---------------------------------------------------------------------------
// Reference App Workflow Publication
// ---------------------------------------------------------------------------

Meteor.publish('referenceApp.workflow', async function(workflowId) {
  console.log('Publishing referenceApp.workflow:', workflowId);
  
  if (!this.userId) {
    return this.ready();
  }
  
  check(workflowId, Match.Maybe(String));
  
  try {
    const Tasks = await global.Collections.Tasks;
    
    if (!Tasks) {
      return this.ready();
    }
    
    // Publish workflow tasks
    return Tasks.find({
      $or: [
        { id: workflowId },
        { 'groupIdentifier.value': workflowId },
        { 'owner.reference': `Practitioner/${this.userId}` }
      ],
      status: { $in: ['requested', 'received', 'accepted', 'in-progress'] }
    });
    
  } catch (error) {
    console.error('Error in referenceApp.workflow publication:', error);
    return this.ready();
  }
});

// ---------------------------------------------------------------------------
// Reference App Summary Stats Publication
// ---------------------------------------------------------------------------

Meteor.publish('referenceApp.stats', async function() {
  console.log('Publishing referenceApp.stats');
  
  if (!this.userId) {
    return this.ready();
  }
  
  const self = this;
  
  try {
    // Get collections
    const Patients = await global.Collections.Patients;
    const Observations = await global.Collections.Observations;
    const Procedures = await global.Collections.Procedures;
    
    // Create a synthetic collection for stats
    const stats = {
      _id: 'referenceAppStats',
      patientCount: 0,
      observationCount: 0,
      procedureCount: 0,
      lastUpdated: new Date()
    };
    
    // Count documents
    if (Patients) {
      stats.patientCount = await Patients.countAsync();
    }
    if (Observations) {
      stats.observationCount = await Observations.countAsync();
    }
    if (Procedures) {
      stats.procedureCount = await Procedures.countAsync();
    }
    
    // Publish to a client-only collection
    self.added('ReferenceAppStats', stats._id, stats);
    
    // Set up reactive updates (optional)
    const interval = Meteor.setInterval(async () => {
      stats.lastUpdated = new Date();
      if (Patients) {
        stats.patientCount = await Patients.countAsync();
      }
      if (Observations) {
        stats.observationCount = await Observations.countAsync();
      }
      if (Procedures) {
        stats.procedureCount = await Procedures.countAsync();
      }
      
      self.changed('ReferenceAppStats', stats._id, stats);
    }, 60000); // Update every minute
    
    // Clean up on stop
    self.onStop(() => {
      Meteor.clearInterval(interval);
    });
    
    self.ready();
    
  } catch (error) {
    console.error('Error in referenceApp.stats publication:', error);
    return self.ready();
  }
});

// ---------------------------------------------------------------------------
// Reference App User Preferences Publication
// ---------------------------------------------------------------------------

Meteor.publish('referenceApp.preferences', async function() {
  console.log('Publishing referenceApp.preferences for user:', this.userId);
  
  if (!this.userId) {
    return this.ready();
  }
  
  try {
    const Users = Meteor.users;
    
    // Publish only the preferences field for the current user
    return Users.find(
      { _id: this.userId },
      { 
        fields: { 
          'profile.referenceApp': 1,
          'profile.preferences': 1
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in referenceApp.preferences publication:', error);
    return this.ready();
  }
});
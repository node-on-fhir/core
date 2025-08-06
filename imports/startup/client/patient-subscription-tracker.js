// /imports/startup/client/patient-subscription-tracker.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import patientSubscriptionManager from '../../client/subscriptions/PatientSubscriptionManager';

// Initialize patient subscription tracking
Meteor.startup(() => {
  console.log('Initializing global patient subscription tracker');

  // Create a reactive computation that watches selectedPatientId
  Tracker.autorun(() => {
    const selectedPatientId = Session.get('selectedPatientId');
    
    if (selectedPatientId) {
      console.log('Global tracker: Patient selected, activating subscriptions for:', selectedPatientId);
      
      // Activate patient-specific subscriptions
      patientSubscriptionManager.activatePatientSubscriptions(selectedPatientId);
    } else {
      console.log('Global tracker: No patient selected, clearing subscriptions');
      
      // Clear subscriptions when no patient is selected
      patientSubscriptionManager.clearSubscriptions();
    }
  });

  // Also ensure we have a subscription to Patients collection
  const autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
  
  if (autoPublishEnabled) {
    console.log('Global tracker: Subscribing to all patients via autopublish');
    Meteor.subscribe('autopublish.Patients', {}, { limit: 1000 });
  } else {
    console.log('Global tracker: Subscribing to all patients via patients.search');
    Meteor.subscribe('patients.search', {}, { limit: 1000 });
  }
});
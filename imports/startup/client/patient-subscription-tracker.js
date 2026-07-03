// /imports/startup/client/patient-subscription-tracker.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import patientSubscriptionManager from '../../client/subscriptions/PatientSubscriptionManager';

const log = (Meteor.Logger ? Meteor.Logger.for('patient-subscription-tracker') : console);

// Initialize patient subscription tracking
Meteor.startup(() => {
  console.log('Initializing global patient subscription tracker'); // phi-audit: ok

  // Always subscribe to patients list via patients.search (role-based ACL)
  console.log('Global tracker: Subscribing to patients via patients.search'); // phi-audit: ok
  Meteor.subscribe('patients.search', {}, { limit: 1000 }, {
    onReady: function() {
      console.log('Global tracker: patients.search ready'); // phi-audit: ok
    },
    onError: function(error) {
      log.phi('Global tracker: patients.search error:', error, { action: 'search' });
    }
  });

  // PatientSubscriptionManager handles patient-scoped resource subscriptions
  // (Observations, Conditions, etc.) when autoSubscribe is enabled
  const autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

  if(autoSubscribeEnabled){
    console.log('PatientSubscriptionManager active for resource subscriptions'); // phi-audit: ok

    // Create a reactive computation that watches selectedPatientId
    Tracker.autorun(() => {
      const selectedPatientId = Session.get('selectedPatientId');

      if (selectedPatientId) {
        log.debug('Global tracker: Patient selected, activating subscriptions for:', { selectedPatientId });

        // Tracker.nonreactive prevents readyComputation autoruns (created inside
        // subscribeTranche) from becoming children of this outer autorun. Without
        // this, any re-fire of the outer autorun kills the entire tranche chain.
        Tracker.nonreactive(() => {
          patientSubscriptionManager.activatePatientSubscriptions(selectedPatientId);
        });
      } else {
        console.log('Global tracker: No patient selected, clearing subscriptions'); // phi-audit: ok
        patientSubscriptionManager.clearSubscriptions();
      }
    });
  } else {
    console.log('PatientSubscriptionManager disabled (autoSubscribe off)'); // phi-audit: ok
  }
});
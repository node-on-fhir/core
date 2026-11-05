// /imports/startup/client/patient-subscription-tracker.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { get } from 'lodash';

import patientSubscriptionManager from '../../client/subscriptions/PatientSubscriptionManager';

const log = (Meteor.Logger ? Meteor.Logger.for('patient-subscription-tracker') : console);

// Initialize patient subscription tracking
Meteor.startup(() => {
  log.info('Initializing global patient subscription tracker'); // phi-audit: ok

  // Subscribe to the patients list via patients.search (role-based ACL) —
  // but only when the deployment ships the Patient Directory. The server
  // gates the publication on settings.private.modules.PatientDirectory
  // (default false) and every settings profile that enables it privately
  // mirrors it at settings.public.modules.PatientDirectory; marketing-style
  // deployments (orbital-homepage) have neither, and subscribing anyway
  // just paints a module-disabled error in the console at boot.
  const patientDirectoryEnabled = get(Meteor, 'settings.public.modules.PatientDirectory', false);
  if (patientDirectoryEnabled) {
    log.debug('Global tracker: Subscribing to patients via patients.search'); // phi-audit: ok
    Meteor.subscribe('patients.search', {}, { limit: 1000 }, {
      onReady: function() {
        log.debug('Global tracker: patients.search ready'); // phi-audit: ok
      },
      onError: function(error) {
        log.error('Global tracker: patients.search error', { error: error.message });
      }
    });
  } else {
    log.info('Global tracker: patients.search skipped (PatientDirectory module disabled)'); // phi-audit: ok
  }

  // PatientSubscriptionManager handles patient-scoped resource subscriptions
  // (Observations, Conditions, etc.) when autoSubscribe is enabled
  const autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);

  if(autoSubscribeEnabled){
    log.info('PatientSubscriptionManager active for resource subscriptions'); // phi-audit: ok

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
        log.debug('Global tracker: No patient selected, clearing subscriptions'); // phi-audit: ok
        patientSubscriptionManager.clearSubscriptions();
      }
    });
  } else {
    log.info('PatientSubscriptionManager disabled (autoSubscribe off)'); // phi-audit: ok
  }
});
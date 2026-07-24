// /imports/client/subscriptions/PatientSubscriptionManager.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

const log = (Meteor.Logger ? Meteor.Logger.for('PatientSubscriptionManager') : console);

// Subscription tranches ordered by IPS (International Patient Summary) priority.
// Within each tranche, all resources subscribe in parallel.
// Between tranches, we wait for the current tranche to be ready (or timeout) before starting the next.
//
// 4 resources removed that have no matching publication:
//   FamilyMemberHistories, DeviceRequests, DeviceUsageStatements, AppointmentResponses
const SUBSCRIPTION_TRANCHES = [
  // Tranche 1 - IPS Required (load immediately)
  {
    name: 'IPS Required',
    resources: [
      'Conditions',              // Problems
      'AllergyIntolerances',     // Allergies
      'MedicationRequests',      // Medications
      'MedicationStatements',    // Medications
      'Medications',             // Medications
    ]
  },
  // Tranche 2 - IPS Recommended
  {
    name: 'IPS Recommended',
    resources: [
      'Immunizations',
      'DiagnosticReports',
      'Procedures',
      'Devices',
    ]
  },
  // Tranche 3 - Care Coordination
  {
    name: 'Care Coordination',
    resources: [
      'Encounters',
      'CarePlans',
      'CareTeams',
      'Goals',
      'ServiceRequests',
      'Appointments',
    ]
  },
  // Tranche 4 - Observations (isolated - can be very large)
  {
    name: 'Observations',
    resources: [
      'Observations',
    ]
  },
  // Tranche 5 - Documents & Remaining
  {
    name: 'Documents & Other',
    resources: [
      'DocumentReferences',
      'Compositions',
      'QuestionnaireResponses',
      'Communications',
      'Consents',
      'ImagingStudies',
      'ClinicalImpressions',
      'RiskAssessments',
      'Tasks',
      'MedicationAdministrations',
      'NutritionIntakes',
      'Specimens',
      'MolecularSequences',
    ]
  }
];

class PatientSubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.currentPatientId = null;
    this.pendingTimeouts = [];
    this.pendingComputations = [];
  }

  activatePatientSubscriptions(patientId) {
    // Guard: don't restart if already subscribed for this patient
    if (patientId && patientId === this.currentPatientId && this.subscriptions.size > 0) {
      log.debug('Already subscribed for patient', { patientId });
      return;
    }

    log.debug('Activating subscriptions for patient', { patientId });

    // Clear any existing subscriptions
    this.clearSubscriptions();

    // Store current patient ID (after clear, which resets it)
    this.currentPatientId = patientId;

    if (!patientId) {
      log.warn('No patient ID provided'); // phi-audit: ok
      return;
    }

    // Pass the patientId string to the server — the server builds the query
    // via FhirUtilities.addPatientFilterToQuery() server-side.
    log.debug('Using selectedPatient.* publications for patient', { patientId });

    // Start tranche-based subscription chain (non-reactive, non-async)
    this.subscribeTranche(patientId, 0);
  }

  subscribeTranche(patientId, trancheIndex) {
    if (trancheIndex >= SUBSCRIPTION_TRANCHES.length) {
      log.info('All tranches complete', { activeSubscriptions: this.subscriptions.size }); // phi-audit: ok
      return;
    }

    const tranche = SUBSCRIPTION_TRANCHES[trancheIndex];
    log.debug('Starting tranche', { tranche: tranche.name, resources: tranche.resources.length }); // phi-audit: ok

    const handles = [];

    // Subscribe to all resources in this tranche in parallel
    tranche.resources.forEach((resourceName) => {
      const publicationName = `selectedPatient.${resourceName}`;

      const handle = Meteor.subscribe(publicationName, patientId, {
        limit: 1000
      });

      this.subscriptions.set(resourceName, handle);
      handles.push({ handle, resourceName });
    });

    // Wait for all handles in this tranche to be ready, with 10s timeout guard
    const timeout = Meteor.setTimeout(() => {
      const notReady = handles.filter(function(h) { return !h.handle.ready(); }).map(function(h) { return h.resourceName; });
      if (notReady.length > 0) {
        log.warn('Tranche timed out', { tranche: tranche.name, notReady: notReady }); // phi-audit: ok
      }
      if (readyComputation) {
        readyComputation.stop();
      }
      // Proceed to next tranche despite timeout
      this.subscribeTranche(patientId, trancheIndex + 1);
    }, 10000);
    this.pendingTimeouts.push(timeout);

    const readyComputation = Tracker.autorun(function(comp) {
      const allReady = handles.every(function(h) { return h.handle.ready(); });
      if (allReady) {
        Meteor.clearTimeout(timeout);
        comp.stop();
        log.debug('Tranche fully ready', { tranche: tranche.name }); // phi-audit: ok
        // Proceed to next tranche outside the stopped computation's Tracker context
        Tracker.nonreactive(() => {
          this.subscribeTranche(patientId, trancheIndex + 1);
        });
      }
    }.bind(this));
    this.pendingComputations.push(readyComputation);
  }

  clearSubscriptions() {
    log.debug('Clearing existing subscriptions'); // phi-audit: ok

    // Clear all pending timeouts to prevent stale callbacks from firing
    this.pendingTimeouts.forEach(function(t) { Meteor.clearTimeout(t); });
    this.pendingTimeouts = [];

    // Stop all pending ready-check computations
    this.pendingComputations.forEach(function(comp) {
      if (!comp.stopped) {
        comp.stop();
      }
    });
    this.pendingComputations = [];

    // Stop all subscription handles
    this.subscriptions.forEach(function(handle, resourceName) {
      try {
        handle.stop();
        log.debug('Stopped subscription', { resource: resourceName }); // phi-audit: ok
      } catch (error) {
        log.error('Error stopping subscription', { resource: resourceName, error: error && error.message }); // phi-audit: ok
      }
    });

    // Clear the map
    this.subscriptions.clear();

    // Clear patient ID
    this.currentPatientId = null;
  }

  getActiveSubscriptions() {
    const active = [];
    this.subscriptions.forEach((handle, resourceName) => {
      active.push({
        resource: resourceName,
        ready: handle.ready()
      });
    });
    return active;
  }

  isReady() {
    let allReady = true;
    this.subscriptions.forEach((handle) => {
      if (!handle.ready()) {
        allReady = false;
      }
    });
    return allReady;
  }

  getCurrentPatientId() {
    return this.currentPatientId;
  }
}

// Create singleton instance
const patientSubscriptionManager = new PatientSubscriptionManager();

// Export singleton
export default patientSubscriptionManager;

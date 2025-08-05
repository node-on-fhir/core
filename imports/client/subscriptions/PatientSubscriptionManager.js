// /imports/client/subscriptions/PatientSubscriptionManager.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { get } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';

// Define all FHIR resources that contain PHI and need patient-specific subscriptions
const PHI_RESOURCES = [
  // Clinical Resources
  'AllergyIntolerances',
  'CarePlans', 
  'CareTeams',
  'Conditions',
  'Encounters',
  'Goals',
  'Immunizations',
  'Medications',
  'MedicationStatements',
  'MedicationAdministrations',
  'MedicationRequests',
  'Observations',
  'Procedures',
  
  // Documents
  'DocumentReferences',
  'Compositions',
  'QuestionnaireResponses',
  
  // Other PHI Resources
  'ServiceRequests',
  'Communications',
  'Consents',
  'DiagnosticReports',
  'ImagingStudies',
  'FamilyMemberHistories',
  'DeviceRequests',
  'DeviceUsageStatements',
  'ClinicalImpressions',
  'RiskAssessments',
  'Appointments',
  'AppointmentResponses',
  'Tasks'
];

class PatientSubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.currentPatientId = null;
    this.computation = null;
  }

  activatePatientSubscriptions(patientId) {
    console.log('PatientSubscriptionManager: Activating subscriptions for patient:', patientId);
    
    // Store current patient ID
    this.currentPatientId = patientId;
    
    // Clear any existing subscriptions
    this.clearSubscriptions();
    
    // Check if autopublish is enabled
    const autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    console.log('PatientSubscriptionManager: Autopublish enabled:', autoPublishEnabled);
    
    // Create reactive computation for subscriptions
    this.computation = Tracker.autorun(() => {
      if (!patientId) {
        console.warn('PatientSubscriptionManager: No patient ID provided');
        return;
      }
      
      // Build patient-specific query using FhirUtilities
      const patientQuery = FhirUtilities.addPatientFilterToQuery(patientId);
      console.log('PatientSubscriptionManager: Patient query:', patientQuery);
      
      // Subscribe to each PHI resource
      PHI_RESOURCES.forEach(resourceName => {
        try {
          let handle;
          
          if (autoPublishEnabled) {
            // Use autopublish pattern
            const publicationName = `autopublish.${resourceName}`;
            console.log(`PatientSubscriptionManager: Subscribing to ${publicationName}`);
            
            handle = Meteor.subscribe(publicationName, patientQuery, { 
              limit: 1000,
              sort: { 'meta.lastUpdated': -1 }
            });
          } else {
            // Check if resource has custom patient-specific publication
            const customPubName = `${resourceName.toLowerCase()}.byPatient`;
            const fallbackPubName = `${resourceName.toLowerCase()}.all`;
            
            // Try patient-specific publication first
            try {
              console.log(`PatientSubscriptionManager: Trying ${customPubName}`);
              handle = Meteor.subscribe(customPubName, patientId);
            } catch (e) {
              // Fall back to general publication with query
              console.log(`PatientSubscriptionManager: Falling back to ${fallbackPubName}`);
              handle = Meteor.subscribe(fallbackPubName, patientQuery);
            }
          }
          
          // Store subscription handle
          if (handle) {
            this.subscriptions.set(resourceName, handle);
            
            // Log when subscription is ready
            Tracker.autorun(() => {
              if (handle.ready()) {
                console.log(`PatientSubscriptionManager: ${resourceName} subscription ready`);
              }
            });
          }
          
        } catch (error) {
          console.error(`PatientSubscriptionManager: Error subscribing to ${resourceName}:`, error);
        }
      });
      
      console.log(`PatientSubscriptionManager: Activated ${this.subscriptions.size} subscriptions`);
    });
  }

  clearSubscriptions() {
    console.log('PatientSubscriptionManager: Clearing existing subscriptions');
    
    // Stop all subscription handles
    this.subscriptions.forEach((handle, resourceName) => {
      try {
        handle.stop();
        console.log(`PatientSubscriptionManager: Stopped subscription for ${resourceName}`);
      } catch (error) {
        console.error(`PatientSubscriptionManager: Error stopping subscription for ${resourceName}:`, error);
      }
    });
    
    // Clear the map
    this.subscriptions.clear();
    
    // Stop the computation
    if (this.computation) {
      this.computation.stop();
      this.computation = null;
    }
    
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
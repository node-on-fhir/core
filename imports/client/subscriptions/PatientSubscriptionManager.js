// /imports/client/subscriptions/PatientSubscriptionManager.js

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { get } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';

// Define all FHIR resources that contain PHI and need patient-specific subscriptions
// Ordered by priority - most critical resources first
const PHI_RESOURCES = [
  // Critical Clinical Resources (load first)
  'Conditions',
  'AllergyIntolerances',
  'Medications',
  'MedicationRequests',
  
  // Important Clinical Resources
  'Procedures',
  'Encounters',
  'Immunizations',
  'DiagnosticReports',
  'CarePlans',
  
  // Care Coordination
  'CareTeams',
  'Goals',
  'ServiceRequests',
  'Appointments',
  
  // Medication Management
  'MedicationStatements',
  'MedicationAdministrations',
  
  // Documents (can be large, load later)
  'DocumentReferences',
  'Compositions',
  'QuestionnaireResponses',
  
  // Other Resources (lowest priority)
  'Communications',
  'Consents',
  'ImagingStudies',
  'FamilyMemberHistories',
  'DeviceRequests',
  'DeviceUsageStatements',
  'ClinicalImpressions',
  'RiskAssessments',
  'AppointmentResponses',
  'Tasks',
  
  // Observations (can be very large, load last)
  'Observations'
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
      
      // Subscribe to each PHI resource in an orderly fashion
      const subscribeToResources = (resources, index = 0) => {
        if (index >= resources.length) {
          console.log(`PatientSubscriptionManager: Completed activating ${this.subscriptions.size} subscriptions`);
          return;
        }
        
        const resourceName = resources[index];
        
        try {
          let handle;
          
          if (autoPublishEnabled) {
            // Use autopublish pattern
            const publicationName = `autopublish.${resourceName}`;
            console.log(`PatientSubscriptionManager: Subscribing to ${publicationName} (${index + 1}/${resources.length})`);
            
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
            
            // Wait for subscription to be ready before proceeding to next
            Tracker.autorun((computation) => {
              if (handle.ready()) {
                console.log(`PatientSubscriptionManager: ${resourceName} subscription ready`);
                computation.stop();
                
                // Small delay before next subscription to avoid overwhelming the server
                Meteor.setTimeout(() => {
                  subscribeToResources(resources, index + 1);
                }, 50); // 50ms delay between subscriptions
              }
            });
          } else {
            // If no handle, continue to next resource
            subscribeToResources(resources, index + 1);
          }
          
        } catch (error) {
          console.error(`PatientSubscriptionManager: Error subscribing to ${resourceName}:`, error);
          // Continue with next resource even if this one fails
          Meteor.setTimeout(() => {
            subscribeToResources(resources, index + 1);
          }, 50);
        }
      };
      
      // Start the subscription chain
      subscribeToResources(PHI_RESOURCES);
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
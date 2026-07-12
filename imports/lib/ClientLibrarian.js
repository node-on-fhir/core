// /imports/lib/ClientLibrarian.js

import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

const log = (Meteor.Logger ? Meteor.Logger.for('ClientLibrarian') : console);

//---------------------------------------------------------------------------
// Client Librarian
// A client-side library for importing FHIR Bundles and NDJSON files
// into local Minimongo collections
//---------------------------------------------------------------------------

const ClientLibrarian = {
  /**
   * Pluralize FHIR resource type names to match collection names
   * @param {string} resourceType - The FHIR resource type
   * @returns {string} The pluralized collection name
   */
  pluralizeResourceName: function(resourceType){
    var pluralized = '';
    switch (resourceType) {
      case 'Binary':          
        pluralized = 'Binaries';
        break;
      case 'Library':      
        pluralized = 'Libraries';
        break;
      case 'SupplyDelivery':      
        pluralized = 'SupplyDeliveries';
        break;
      case 'ImagingStudy':      
        pluralized = 'ImagingStudies';
        break;        
      case 'FamilyMemberHistory':      
        pluralized = 'FamilyMemberHistories';
        break;        
      case 'ResearchStudy':      
        pluralized = 'ResearchStudies';
        break;        
      default:
        pluralized = resourceType + 's';
        break;
    }

    return pluralized;
  },

  /**
   * Check if a subscription exists for a given collection
   * @param {string} collectionName - The name of the collection
   * @returns {boolean} True if subscription exists
   */
  hasActiveSubscription: function(collectionName) {
    let subscriptionExists = false;
    
    if(has(Meteor, 'connection._subscriptions')) {
      Object.keys(Meteor.connection._subscriptions).forEach(function(key) {
        const subscription = Meteor.connection._subscriptions[key];
        if(subscription.name === collectionName && subscription.ready) {
          subscriptionExists = true;
        }
      });
    }
    
    return subscriptionExists;
  },

  /**
   * Import a single FHIR resource into the appropriate collection
   * @param {Object} resource - The FHIR resource to import
   * @returns {string|null} The ID of the inserted resource, or null if failed
   */
  importResource: function(resource) {
    if(!resource || !resource.resourceType) {
      console.warn('Invalid resource - missing resourceType');
      return null;
    }

    // Ensure the resource has an ID
    if(!resource.id) {
      if(resource._id) {
        resource.id = resource._id;
      } else {
        const newId = Random.id();
        resource.id = newId;
        resource._id = newId;
      }
    }

    const collectionName = this.pluralizeResourceName(resource.resourceType);
    const collection = window[collectionName];

    if(!collection) {
      console.warn(`Collection ${collectionName} not found. Is it imported?`);
      return null;
    }

    // Check if subscription exists
    const hasSubscription = this.hasActiveSubscription(collectionName);
    
    if(hasSubscription) {
      console.log(`Active subscription detected for ${collectionName}. Consider whether local insert is needed.`);
      // You can add logic here to decide what to do when subscription exists
      // Options:
      // 1. Skip local insert (data will come from server via pub/sub)
      // 2. Insert locally anyway (for immediate UI update)
      // 3. Return a flag to let caller decide
    }

    try {
      // Check if resource already exists
      const existingResource = collection._collection.findOne({id: resource.id});
      
      if(existingResource) {
        console.log(`Resource ${resource.resourceType}/${resource.id} already exists in local collection`);
        return existingResource._id;
      }

      // Insert the resource
      const newRecordId = collection._collection.insert(resource, {
        validate: false, 
        filter: false
      });
      
      console.log(`Inserted ${resource.resourceType} with ID: ${newRecordId}`);
      return newRecordId;
      
    } catch(error) {
      console.error(`Error inserting ${resource.resourceType}:`, error);
      return null;
    }
  },

  /**
   * Import a FHIR Bundle into local collections
   * @param {Object|string} dataContent - The FHIR Bundle (as object or JSON string)
   * @returns {Object} Import results with counts and errors
   */
  importBundle: function(dataContent) {    
    console.log('ClientLibrarian.importBundle()');
    
    if(!Meteor.isClient) {
      console.error('ClientLibrarian is designed for client-side use only');
      return { success: false, error: 'Client-side only' };
    }

    let parsedBundle = {};
    const results = {
      success: true,
      totalResources: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      resourceCounts: {}
    };

    // Parse the input data
    try {
      if(typeof dataContent === "string") {
        parsedBundle = JSON.parse(dataContent);
      } else if(has(dataContent, 'content')) {
        if(typeof dataContent.content === "string") {
          parsedBundle = JSON.parse(dataContent.content);
        } else {
          parsedBundle = dataContent.content;
        }
      } else {
        parsedBundle = dataContent;
      }
    } catch(error) {
      console.error('Error parsing bundle:', error);
      return { success: false, error: 'Failed to parse bundle' };
    }

    // Handle FHIR Bundle
    if(get(parsedBundle, 'resourceType') === "Bundle") {
      const entries = get(parsedBundle, 'entry', []);
      console.log(`Found FHIR Bundle with ${entries.length} entries`);
      
      results.totalResources = entries.length;

      // Process each entry
      entries.forEach((entry, index) => {
        const resource = get(entry, 'resource');
        
        if(!resource || !resource.resourceType) {
          console.warn(`Entry ${index} has no valid resource`);
          results.errors.push(`Entry ${index}: No valid resource`);
          results.skipped++;
          return;
        }

        // Track resource counts
        const resourceType = resource.resourceType;
        results.resourceCounts[resourceType] = (results.resourceCounts[resourceType] || 0) + 1;

        // Import the resource
        const recordId = this.importResource(resource);
        
        if(recordId) {
          results.imported++;
        } else {
          results.skipped++;
        }
      });

    } else if(parsedBundle.resourceType) {
      // Handle single resource
      console.log(`Found single ${parsedBundle.resourceType} resource`);
      results.totalResources = 1;
      results.resourceCounts[parsedBundle.resourceType] = 1;
      
      const recordId = this.importResource(parsedBundle);
      
      if(recordId) {
        results.imported++;
      } else {
        results.skipped++;
      }
    } else {
      return { 
        success: false, 
        error: 'Input is not a valid FHIR Bundle or Resource' 
      };
    }

    // Summary
    console.log('Import Summary:', {
      total: results.totalResources,
      imported: results.imported,
      skipped: results.skipped,
      resourceTypes: results.resourceCounts
    });

    return results;
  },

  /**
   * Import NDJSON (newline-delimited JSON) data
   * @param {string} ndjsonData - The NDJSON string
   * @returns {Object} Import results
   */
  importNDJSON: function(ndjsonData) {
    console.log('ClientLibrarian.importNDJSON()');
    
    if(!Meteor.isClient) {
      console.error('ClientLibrarian is designed for client-side use only');
      return { success: false, error: 'Client-side only' };
    }

    const results = {
      success: true,
      totalResources: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      resourceCounts: {}
    };

    // Split by newlines and parse each line
    const lines = ndjsonData.split('\n').filter(line => line.trim());
    results.totalResources = lines.length;

    lines.forEach((line, index) => {
      try {
        const resource = JSON.parse(line);
        
        if(!resource || !resource.resourceType) {
          console.warn(`Line ${index + 1} is not a valid FHIR resource`);
          results.errors.push(`Line ${index + 1}: Invalid resource`);
          results.skipped++;
          return;
        }

        // Track resource counts
        results.resourceCounts[resource.resourceType] = 
          (results.resourceCounts[resource.resourceType] || 0) + 1;

        // Import the resource
        const recordId = this.importResource(resource);
        
        if(recordId) {
          results.imported++;
        } else {
          results.skipped++;
        }
        
      } catch(error) {
        console.error(`Error parsing line ${index + 1}:`, error);
        results.errors.push(`Line ${index + 1}: ${error.message}`);
        results.skipped++;
      }
    });

    console.log('NDJSON Import Summary:', {
      total: results.totalResources,
      imported: results.imported,
      skipped: results.skipped,
      resourceTypes: results.resourceCounts
    });

    return results;
  },

  /**
   * Check if a resource belongs to a specific patient
   * @param {Object} resource - The FHIR resource to check
   * @param {string} patientId - The patient ID to match against
   * @returns {boolean} True if resource belongs to patient
   */
  isPatientResource: function(resource, patientId) {
    if(!resource || !patientId) return false;

    // Direct patient match
    if(resource.resourceType === 'Patient') {
      return resource.id === patientId || resource._id === patientId;
    }

    // Check common patient reference patterns
    const patientRef = `Patient/${patientId}`;
    
    // Check subject.reference (Observation, Condition, etc.)
    if(get(resource, 'subject.reference') === patientRef) return true;
    if(get(resource, 'subject.reference', '').endsWith(`/${patientId}`)) return true;
    
    // Check patient.reference (Encounter, etc.)
    if(get(resource, 'patient.reference') === patientRef) return true;
    if(get(resource, 'patient.reference', '').endsWith(`/${patientId}`)) return true;
    
    // Check for.reference (CarePlan, etc.)
    if(get(resource, 'for.reference') === patientRef) return true;
    if(get(resource, 'for.reference', '').endsWith(`/${patientId}`)) return true;
    
    // Check beneficiary.reference (Coverage, etc.)
    if(get(resource, 'beneficiary.reference') === patientRef) return true;
    if(get(resource, 'beneficiary.reference', '').endsWith(`/${patientId}`)) return true;
    
    // Check individual.reference (RelatedPerson, etc.)
    if(get(resource, 'individual.reference') === patientRef) return true;
    if(get(resource, 'individual.reference', '').endsWith(`/${patientId}`)) return true;

    // Check participants array (Encounter, etc.)
    const participants = get(resource, 'participant', []);
    for(const participant of participants) {
      if(get(participant, 'individual.reference') === patientRef) return true;
      if(get(participant, 'individual.reference', '').endsWith(`/${patientId}`)) return true;
    }

    // Check performer array (Procedure, etc.)
    const performers = get(resource, 'performer', []);
    for(const performer of performers) {
      if(get(performer, 'actor.reference') === patientRef) return true;
      if(get(performer, 'actor.reference', '').endsWith(`/${patientId}`)) return true;
    }

    return false;
  },

  /**
   * Get list of FHIR collections in the system
   * @returns {Array} Array of collection info objects
   */
  getAvailableCollections: function() {
    const collections = [];
    const fhirResourceTypes = [
      'AllergyIntolerances', 'Appointments', 'AuditEvents', 'Binaries', 'BodyStructures',
      'Bundles', 'CapabilityStatements', 'CarePlans', 'CareTeams', 'Claims',
      'ClinicalImpressions', 'CodeSystems', 'Communications', 'CommunicationRequests',
      'Compositions', 'Conditions', 'Consents', 'Contracts', 'Coverages',
      'Devices', 'DiagnosticReports', 'DocumentReferences', 'Encounters', 
      'Endpoints', 'ExplanationOfBenefits', 'FamilyMemberHistories', 'Goals',
      'Groups', 'HealthcareServices', 'ImagingStudies', 'Immunizations',
      'Libraries', 'Lists', 'Locations', 'Measures', 'MeasureReports',
      'Medications', 'MedicationAdministrations', 'MedicationDispenses',
      'MedicationRequests', 'MedicationStatements', 'MessageHeaders',
      'NutritionOrders', 'Observations', 'Organizations', 'Patients',
      'Practitioners', 'PractitionerRoles', 'Procedures', 'Provenances',
      'Questionnaires', 'QuestionnaireResponses', 'RelatedPersons',
      'RequestGroups', 'ResearchStudies', 'ResearchSubjects', 'RiskAssessments',
      'Schedules', 'SearchParameters', 'ServiceRequests', 'Slots', 'Specimens',
      'StructureDefinitions', 'StructureMaps', 'Subscriptions', 'Substances',
      'Tasks', 'ValueSets'
    ];

    fhirResourceTypes.forEach(collectionName => {
      if(window[collectionName] && window[collectionName]._collection) {
        collections.push({
          name: collectionName,
          collection: window[collectionName],
          hasSubscription: this.hasActiveSubscription(collectionName)
        });
      }
    });

    return collections;
  },

  /**
   * Export patient data from client-side collections into a FHIR Bundle
   * @param {string} patientId - The patient ID to filter resources
   * @param {Object} options - Export options
   * @returns {Object} FHIR Bundle containing patient resources
   */
  exportPatientBundle: function(patientId, options = {}) {
    log.debug('exportPatientBundle for patient', { patientId });
    
    if(!Meteor.isClient) {
      console.error('ClientLibrarian is designed for client-side use only');
      return null;
    }

    if(!patientId) {
      console.error('Patient ID is required'); // phi-audit: ok
      return null;
    }

    const {
      includeUnsubscribed = true,  // Include data from collections without active subscriptions
      includeMetadata = true,       // Include metadata about data source
      resourceTypes = null          // Array of specific resource types to include (null = all)
    } = options;

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [],
      meta: {
        tag: [{
          system: 'https://honeycomb.fhir.org/export',
          code: 'client-export',
          display: 'Exported from client-side collections'
        }]
      }
    };

    const exportSummary = {
      totalResources: 0,
      resourceCounts: {},
      collectionsScanned: 0,
      collectionsWithData: 0,
      subscriptionStatus: {}
    };

    // Get all available collections
    const collections = this.getAvailableCollections();
    
    collections.forEach(({name, collection, hasSubscription}) => {
      // Skip if not in requested resource types
      if(resourceTypes && !resourceTypes.includes(name)) {
        return;
      }

      exportSummary.collectionsScanned++;
      exportSummary.subscriptionStatus[name] = hasSubscription ? 'active' : 'none';

      // Skip unsubscribed collections if requested
      if(!includeUnsubscribed && !hasSubscription) {
        console.log(`Skipping ${name} - no active subscription`);
        return;
      }

      try {
        // Fetch all resources from the collection
        const resources = collection._collection.find({}).fetch();
        
        if(resources.length === 0) {
          return;
        }

        let patientResourceCount = 0;

        resources.forEach(resource => {
          // Check if this resource belongs to the patient
          if(this.isPatientResource(resource, patientId)) {
            patientResourceCount++;
            
            // Create bundle entry
            const entry = {
              resource: resource,
              fullUrl: `urn:uuid:${resource.id || resource._id}`
            };

            // Add metadata if requested
            if(includeMetadata) {
              entry.search = {
                mode: hasSubscription ? 'match' : 'include',
                score: hasSubscription ? 1 : 0.5
              };
              entry.meta = {
                tag: [{
                  system: 'https://honeycomb.fhir.org/subscription-status',
                  code: hasSubscription ? 'subscribed' : 'local-only',
                  display: hasSubscription ? 'From active subscription' : 'Local data only'
                }]
              };
            }

            bundle.entry.push(entry);
            exportSummary.totalResources++;
          }
        });

        if(patientResourceCount > 0) {
          exportSummary.collectionsWithData++;
          exportSummary.resourceCounts[name] = patientResourceCount;
          log.debug('Found resources for patient', { count: patientResourceCount, resourceName: name, patientId });
        }

      } catch(error) {
        console.error(`Error processing collection ${name}:`, error);
      }
    });

    // Update bundle total
    bundle.total = bundle.entry.length;

    // Add export summary to bundle meta
    if(includeMetadata) {
      bundle.meta.extension = [{
        url: 'https://honeycomb.fhir.org/export-summary',
        valueString: JSON.stringify(exportSummary, null, 2)
      }];
    }

    console.log('Export Summary:', exportSummary);

    return bundle;
  },

  /**
   * Export patient data as NDJSON format
   * @param {string} patientId - The patient ID to filter resources
   * @param {Object} options - Export options (same as exportPatientBundle)
   * @returns {string} NDJSON string of patient resources
   */
  exportPatientNDJSON: function(patientId, options = {}) {
    log.debug('exportPatientNDJSON for patient', { patientId });
    
    const bundle = this.exportPatientBundle(patientId, options);
    if(!bundle || !bundle.entry) {
      return '';
    }

    // Convert bundle entries to NDJSON
    const ndjsonLines = bundle.entry.map(entry => {
      return JSON.stringify(entry.resource);
    });

    return ndjsonLines.join('\n');
  }
};

export default ClientLibrarian;
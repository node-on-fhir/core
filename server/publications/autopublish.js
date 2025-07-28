// server/publications/autopublish.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import all collections that might need autopublishing
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';

// Map of collection names to collection objects
const collectionsMap = {
  'Conditions': Conditions,
  'Patients': Patients,
  'Practitioners': Practitioners,
  'Encounters': Encounters,
  'Observations': Observations,
  'Procedures': Procedures,
  'Immunizations': Immunizations,
  'AllergyIntolerances': AllergyIntolerances,
  'CarePlans': CarePlans,
  'Goals': Goals,
  'Medications': Medications,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'DocumentReferences': DocumentReferences,
  'Locations': Locations,
  'Organizations': Organizations,
  'ServiceRequests': ServiceRequests
};

// Check if we're in production
const isProduction = get(Meteor, 'settings.public.environment') === 'production';
const isDevelopment = !isProduction && (get(Meteor, 'settings.public.environment') === 'development' || process.env.NODE_ENV === 'development' || !get(Meteor, 'settings.public.environment'));

// Initialize autopublish if enabled AND not in production
const autopublishEnabled = get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isDevelopment;

if (autopublishEnabled) {
  console.log('Autopublish is ENABLED for development. Setting up automatic publications...');
} else if (get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false) && isProduction) {
  console.error('ERROR: Autopublish is not allowed in production. Ignoring autopublishSubscriptions setting.');
}

if (autopublishEnabled) {

  // Create publications for each collection
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];
    
    if (collection && collection._collection) {
      // Check if this collection should be published based on settings
      const resourceConfig = get(Meteor, `settings.private.fhir.rest.${collectionName.slice(0, -1)}`, {});
      const shouldPublish = get(resourceConfig, 'publication', true);
      
      if (shouldPublish) {
        const publicationName = `autopublish.${collectionName}`;
        
        Meteor.publish(publicationName, function(query, options) {
          // Default empty query and options
          query = query || {};
          options = options || {};
          
          // In development, we can be more permissive
          options.limit = options.limit || 1000;
          
          // Add user-based filtering if needed
          if (this.userId) {
            // For patient-specific resources, filter by patient
            if (['Conditions', 'Observations', 'Procedures', 'Immunizations', 'AllergyIntolerances'].includes(collectionName)) {
              // Only return records for patients the user has access to
              // This is a simplified example - you'd want more sophisticated access control
              query['subject.reference'] = { $exists: true };
            }
          } else {
            // If not logged in, return nothing
            return this.ready();
          }
          
          console.log(`Publishing ${collectionName} with query:`, query, 'options:', options);
          return collection.find(query, options);
        });
        
        console.log(`Created autopublish publication: ${publicationName}`);
      }
    }
  });
  
  // Also create a simple "all" publication for each collection for development
  Object.keys(collectionsMap).forEach(function(collectionName) {
    const collection = collectionsMap[collectionName];
    
    if (collection && collection._collection) {
      const publicationName = `${collectionName.toLowerCase()}.all`;
      
      Meteor.publish(publicationName, function() {
        if (!this.userId) {
          return this.ready();
        }
        
        console.log(`Publishing all ${collectionName} for development`);
        return collection.find({});
      });
      
      console.log(`Created development publication: ${publicationName}`);
    }
  });
} else {
  console.log('Autopublish is DISABLED. Publications must be set up manually.');
}

// Export the publication status for other modules to check
export { autopublishEnabled };
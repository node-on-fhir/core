// /packages/pacio-core/server/methods/fetchPatientEverything.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { fetch } from 'meteor/fetch';
import moment from 'moment';

const log = (Meteor.Logger ? Meteor.Logger.for('fetchPatientEverything') : console);

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

// Helper function to process a single bundle
async function processBundleEntries(bundle, resourceCounts, totalProcessed) {
  let resourcesProcessed = 0;
  let patientResource = null;
  
  if (bundle.entry && Array.isArray(bundle.entry)) {
    for (const entry of bundle.entry) {
      const resource = entry.resource;
      
      if (!resource || !resource.resourceType) {
        console.warn('Skipping entry without resource');
        continue;
      }
      
      // Track resource counts
      resourceCounts[resource.resourceType] = (resourceCounts[resource.resourceType] || 0) + 1;
      
      // Handle Patient resource specially
      if (resource.resourceType === 'Patient') {
        patientResource = resource;
        
        // Get the collection
        const PatientCollection = await global.Collections.Patients;
        if (PatientCollection) {
          // Check if patient exists
          const existingPatient = await PatientCollection.findOneAsync({ id: resource.id });
          
          if (existingPatient) {
            // Update existing patient
            await PatientCollection.updateAsync(
              { id: resource.id },
              { $set: resource }
            );
            log.debug('Updated patient', { id: resource.id });
          } else {
            // Insert new patient
            await PatientCollection.insertAsync(resource);
            log.debug('Inserted new patient', { id: resource.id });
          }
        }
      } else {
        // Handle other resources
        const collectionName = resource.resourceType + 's';
        const Collection = await global.Collections[collectionName];
        
        if (Collection) {
          try {
            // Check if resource exists
            const existingResource = await Collection.findOneAsync({ id: resource.id });
            
            if (existingResource) {
              // Update existing resource
              await Collection.updateAsync(
                { id: resource.id },
                { $set: resource }
              );
            } else {
              // Insert new resource
              await Collection.insertAsync(resource);
            }
            
            resourcesProcessed++;
          } catch (err) {
            console.error(`Error processing ${resource.resourceType} ${resource.id}:`, err);
          }
        } else {
          console.warn(`No collection found for resource type: ${resource.resourceType}`);
        }
      }
    }
  }
  
  return { resourcesProcessed, patientResource };
}

// Helper function to fetch and process all pages
async function fetchAllPages(initialUrl, includeDetails = false) {
  let currentUrl = initialUrl;
  let pageNumber = 1;
  let totalEntries = 0;
  let totalProcessed = 0;
  let patientResource = null;
  const resourceCounts = {};
  const resourceDetails = [];
  const allEntries = [];
  
  while (currentUrl) {
    console.log(`Fetching page ${pageNumber} from: ${currentUrl}`);
    
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json'
      }
    });
    
    if (!response.ok) {
      throw new Meteor.Error('fetch-failed', `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const bundle = await response.json();
    
    if (!bundle || bundle.resourceType !== 'Bundle') {
      throw new Meteor.Error('invalid-response', 'Expected a FHIR Bundle resource');
    }
    
    const entriesInPage = bundle.entry?.length || 0;
    console.log(`Page ${pageNumber}: Received ${entriesInPage} entries`);
    totalEntries += entriesInPage;
    
    // Store all entries for the complete bundle
    if (bundle.entry && Array.isArray(bundle.entry)) {
      allEntries.push(...bundle.entry);
      
      // Collect resource details if requested
      if (includeDetails) {
        bundle.entry.forEach(entry => {
          if (entry.resource && entry.resource.resourceType && entry.resource.id) {
            resourceDetails.push({
              resourceType: entry.resource.resourceType,
              id: entry.resource.id
            });
          }
        });
      }
    }
    
    // Process entries in this bundle
    const result = await processBundleEntries(bundle, resourceCounts, totalProcessed);
    totalProcessed += result.resourcesProcessed;
    
    if (result.patientResource) {
      patientResource = result.patientResource;
    }
    
    // Look for next link
    currentUrl = null;
    if (bundle.link && Array.isArray(bundle.link)) {
      const nextLink = bundle.link.find(link => link.relation === 'next');
      if (nextLink && nextLink.url) {
        currentUrl = nextLink.url;
        pageNumber++;
      }
    }
    
    if (!currentUrl) {
      console.log('No more pages to fetch');
    }
  }
  
  // Create a complete bundle with all entries
  const completeBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: totalEntries,
    entry: allEntries
  };
  
  return {
    totalEntries,
    totalProcessed,
    resourceCounts,
    patientResource,
    pagesFetched: pageNumber,
    resourceDetails: includeDetails ? resourceDetails : undefined,
    bundle: completeBundle
  };
}

Meteor.ServerMethods.define('pacio.fetchPatientEverything', {
  description: 'Fetch and persist a Patient $everything Bundle from a remote FHIR server',
  phi: true,
  positionalParams: ['url', 'patientId'],
  schemaObject: {
    type: 'object',
    properties: { url: { type: 'string' }, patientId: { type: 'string' } },
    required: ['url', 'patientId']
  }
}, async function(params, context) {
    const url = params.url;
    const patientId = params.patientId;

    log.phi('Starting patient data fetch from', { url }, { action: 'read' });
    
    try {
      // Fetch all pages recursively
      // Only include details if we have a reasonable number of resources (< 100)
      const includeDetails = true; // Could make this configurable
      const result = await fetchAllPages(url, includeDetails);
      
      console.log('=== Fetch Summary ===');
      console.log(`Total pages fetched: ${result.pagesFetched}`);
      console.log(`Total entries received: ${result.totalEntries}`);
      console.log(`Total resources processed: ${result.totalProcessed}`);
      console.log('Resource counts:', result.resourceCounts);
      
      // Save the bundle to the Bundles collection
      if (result.bundle && result.bundle.entry && result.bundle.entry.length > 0) {
        try {
          const BundlesCollection = await global.Collections.Bundles;
          if (BundlesCollection) {
            // Add metadata to the bundle
            const bundleToSave = {
              ...result.bundle,
              id: Random.id(),
              _patientId: patientId,  // Add patient ID for easy filtering
              meta: {
                ...result.bundle.meta,
                lastUpdated: new Date().toISOString(),
                tag: [
                  ...(result.bundle.meta?.tag || []),
                  {
                    system: 'https://honeycomb.fhir.org/bundle-source',
                    code: 'patient-everything',
                    display: `Patient $everything operation for ${patientId}`
                  }
                ]
              },
              // Add identifier for easy retrieval
              identifier: [{
                system: 'https://honeycomb.fhir.org/bundle-identifier',
                value: `patient-everything-${patientId}-${Date.now()}`
              }],
              // Add extension with fetch details
              extension: [{
                url: 'https://honeycomb.fhir.org/fetch-details',
                valueCode: JSON.stringify({
                  sourceUrl: url,
                  patientId: patientId,
                  fetchedAt: new Date().toISOString(),
                  fetchedBy: context.userId,
                  pagesFetched: result.pagesFetched,
                  resourceCounts: result.resourceCounts
                })
              }]
            };
            
            const bundleId = await BundlesCollection.insertAsync(bundleToSave);
            log.debug('Saved patient $everything bundle', { bundleId });
            
            // Add bundle ID to result
            result.bundleId = bundleId;
          } else {
            console.warn('Bundles collection not found - bundle will not be persisted');
          }
        } catch (bundleError) {
          console.error('Error saving bundle to Bundles collection:', bundleError);
          // Don't throw - we still want to return the results even if bundle saving fails
        }
      }
      
      // Find and save the Patient resource specifically
      if (result.bundle && result.bundle.entry) {
        try {
          // Find the Patient resource in the bundle
          const patientEntry = result.bundle.entry.find(entry => 
            entry.resource && entry.resource.resourceType === 'Patient'
          );
          
          if (patientEntry && patientEntry.resource) {
            const PatientsCollection = await global.Collections.Patients;
            if (PatientsCollection) {
              const patientResource = patientEntry.resource;
              
              // Check if patient already exists
              const existingPatient = await PatientsCollection.findOneAsync({ id: patientResource.id });
              
              if (existingPatient) {
                // Update existing patient
                await PatientsCollection.updateAsync(
                  { id: patientResource.id },
                  { $set: patientResource }
                );
                log.debug('Updated Patient resource', { id: patientResource.id });
              } else {
                // Insert new patient
                await PatientsCollection.insertAsync(patientResource);
                log.debug('Inserted new Patient resource', { id: patientResource.id });
              }
              
              // Update the result with the patient resource
              result.patientResource = patientResource;
            } else {
              console.warn('Patients collection not found'); // phi-audit: ok
            }
          } else {
            console.warn('No Patient resource found in bundle'); // phi-audit: ok
          }
        } catch (patientError) {
          log.error('Error saving Patient resource', { error: patientError?.message });
          // Don't throw - continue with the response
        }
      }
      
      // Limit resource details to prevent overwhelming the UI
      const maxDetailsToShow = 100;
      const resourceDetails = result.resourceDetails && result.resourceDetails.length > maxDetailsToShow 
        ? result.resourceDetails.slice(0, maxDetailsToShow) 
        : result.resourceDetails;
      
      return {
        success: true,
        resourceCount: result.totalEntries,
        resourcesProcessed: result.totalProcessed,
        resourceCounts: result.resourceCounts,
        pagesFetched: result.pagesFetched,
        patientId: result.patientResource?.id || patientId,
        patientResource: result.patientResource,
        timestamp: new Date(),
        resourceDetails: resourceDetails,
        bundle: result.bundle,
        bundleId: result.bundleId || null
      };
      
    } catch (error) {
      log.error('Error in fetchPatientEverything', { error: error?.message });
      throw new Meteor.Error('fetch-error', error.message || 'Failed to fetch patient data');
    }
});
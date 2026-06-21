// /packages/pacio-core/server/methods/syncPatientRecord.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';
import { PatientSyncStatus } from '../../lib/collections/PacioCollections';

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

Meteor.methods({
  'pacio.syncPatientRecord': async function(patientId, resourceTypes) {
    check(patientId, String);
    check(resourceTypes, Match.Maybe([String]));
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Default resource types for Pseudo EHR
    const defaultResourceTypes = [
      'DocumentReference',
      'Composition', 
      'List',
      'Goal',
      'NutritionOrder',
      'ServiceRequest',
      'QuestionnaireResponse',
      'Observation',
      'Condition',
      'Procedure',
      'MedicationStatement',
      'AllergyIntolerance'
    ];
    
    const resourcesToSync = resourceTypes || defaultResourceTypes;
    
    // Update sync status to in-progress
    await PatientSyncStatus.updateAsync(
      { patientId },
      {
        $set: {
          syncStatus: 'in-progress',
          lastSyncDate: new Date()
        }
      },
      { upsert: true }
    );
    
    try {
      // Get FHIR client
      const fhirClient = await FhirUtilities.getFhirClient();
      if (!fhirClient) {
        throw new Meteor.Error('no-fhir-client', 'FHIR client not available');
      }
      
      let totalResourcesUpdated = 0;
      const resourceCounts = {};
      const errors = [];
      
      // Sync each resource type
      for (const resourceType of resourcesToSync) {
        try {
          console.log(`Syncing ${resourceType} for patient ${patientId}`);
          
          // Search for resources
          const searchParams = {
            patient: patientId,
            _count: 100
          };
          
          // Special handling for certain resource types
          if (resourceType === 'DocumentReference') {
            searchParams.type = 'http://loinc.org|42348-3'; // Advance directives
          } else if (resourceType === 'Composition') {
            searchParams.type = '18776-5,34133-9'; // TOC documents
          } else if (resourceType === 'List') {
            searchParams.code = '10160-0,29549-3'; // Medication lists
          }
          
          const bundle = await fhirClient.request({
            url: `${resourceType}?${new URLSearchParams(searchParams)}`,
            method: 'GET'
          });
          
          let resourceCount = 0;
          
          if (bundle && bundle.entry) {
            for (const entry of bundle.entry) {
              const resource = entry.resource;
              
              // Get the appropriate collection
              const Collection = Meteor.Collections && Meteor.Collections[resourceType];
              if (Collection) {
                // Upsert the resource
                await Collection.upsertAsync(
                  { id: resource.id },
                  { $set: resource }
                );
                resourceCount++;
                totalResourcesUpdated++;
              }
            }
          }
          
          resourceCounts[resourceType] = resourceCount;
          console.log(`Synced ${resourceCount} ${resourceType} resources`);
          
          // Handle pagination if needed
          if (bundle && bundle.link) {
            const nextLink = bundle.link.find(function(link) {
              return link.relation === 'next';
            });
            
            if (nextLink) {
              console.log(`Additional pages available for ${resourceType}, implement pagination`);
            }
          }
          
        } catch (error) {
          console.error(`Error syncing ${resourceType}:`, error);
          errors.push({
            resourceType,
            message: error.message
          });
        }
      }
      
      // Update sync status to completed
      await PatientSyncStatus.updateAsync(
        { patientId },
        {
          $set: {
            syncStatus: 'completed',
            resourcesSynced: resourceCounts,
            errors: errors
          }
        }
      );
      
      return {
        success: true,
        totalResourcesUpdated,
        resourceCounts,
        errors,
        timestamp: new Date()
      };
      
    } catch (error) {
      // Update sync status to failed
      await PatientSyncStatus.updateAsync(
        { patientId },
        {
          $set: {
            syncStatus: 'failed',
            errors: [{
              message: error.message
            }]
          }
        }
      );
      
      throw new Meteor.Error('sync-failed', error.message);
    }
  },
  
  'pacio.getPatientSyncStatus': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    return await PatientSyncStatus.findOneAsync({ patientId });
  },
  
  'pacio.clearPatientCache': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const resourceTypes = [
      'DocumentReference',
      'Composition', 
      'List',
      'Goal',
      'NutritionOrder',
      'ServiceRequest',
      'QuestionnaireResponse'
    ];
    
    let totalRemoved = 0;
    
    for (const resourceType of resourceTypes) {
      const Collection = Meteor.Collections && Meteor.Collections[resourceType];
      if (Collection) {
        const removed = await Collection.removeAsync({
          'patient.reference': `Patient/${patientId}`
        });
        totalRemoved += removed;
      }
    }
    
    // Clear sync status
    await PatientSyncStatus.removeAsync({ patientId });
    
    return {
      success: true,
      resourcesRemoved: totalRemoved
    };
  }
});
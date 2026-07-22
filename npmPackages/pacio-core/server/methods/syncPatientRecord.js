// /packages/pacio-core/server/methods/syncPatientRecord.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';
import { PatientSyncStatus } from '../../lib/collections/PacioCollections';

let FhirUtilities;
Meteor.startup(function(){
  FhirUtilities = Meteor.FhirUtilities;
});

Meteor.ServerMethods.define('pacio.syncPatientRecord', {
  description: 'Sync a patient record from the upstream FHIR server into local collections',
  phi: true,
  positionalParams: ['patientId', 'resourceTypes'],
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      resourceTypes: { type: 'array', items: { type: 'string' } }
    },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;
    const resourceTypes = params.resourceTypes;
    const log = context.log;

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
          log.debug('Syncing resource for patient', { resourceType, patientId });
          
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
});

Meteor.ServerMethods.define('pacio.getPatientSyncStatus', {
  description: 'Read the sync status record for a patient',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;
    return await PatientSyncStatus.findOneAsync({ patientId });
});

Meteor.ServerMethods.define('pacio.clearPatientCache', {
  description: 'Remove locally-cached FHIR resources and sync status for a patient',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context) {
    const patientId = params.patientId;

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
});
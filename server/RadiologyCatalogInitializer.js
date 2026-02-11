// server/RadiologyCatalogInitializer.js
// Auto-populate PlanDefinitions from RADIOLOGY_CATALOG at startup
// Follows pattern from SearchParametersEngine initialization

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Import the radiology catalog from shared lib
import { RADIOLOGY_CATALOG } from '../packages/order-catalog/lib/RadiologyCatalog';

export const RadiologyCatalogInitializer = {

  /**
   * Initialize radiology catalog by populating PlanDefinitions
   * Called at startup if environment variable or setting is true
   */
  async initializeRadiologyCatalog() {
    console.log('[RadiologyCatalog] Checking initialization...');

    const PlanDefinitions = global.Collections.PlanDefinitions;
    if (!PlanDefinitions) {
      console.warn('[RadiologyCatalog] PlanDefinitions collection not found, skipping initialization');
      return { success: false, error: 'Collection not found' };
    }

    try {
      // Check if already populated
      const existingCount = await PlanDefinitions.find({
        'type.coding.code': 'order-set',
        'useContext.code.code': 'imaging'
      }).countAsync();

      if (existingCount > 0) {
        console.log(`[RadiologyCatalog] Already initialized (${existingCount} imaging order sets found)`);
        return { success: true, skipped: true, existing: existingCount };
      }

      console.log(`[RadiologyCatalog] Populating ${RADIOLOGY_CATALOG.length} procedures from catalog...`);

      let insertedCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const item of RADIOLOGY_CATALOG) {
        try {
          const planDefinition = {
            resourceType: 'PlanDefinition',
            id: Random.id(),
            _id: Random.id(),

            // Identifiers
            identifier: [{
              system: 'http://loinc.org',
              value: item.code,
              use: 'official'
            }],

            // Basic metadata
            status: 'active',
            name: item.id,
            title: item.display,
            description: item.longName || item.display,
            date: new Date().toISOString(),
            publisher: 'Honeycomb EHR',

            // Type: order-set
            type: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/plan-definition-type',
                code: 'order-set',
                display: 'Order Set'
              }]
            },

            // Use context: imaging
            useContext: [{
              code: {
                system: 'http://terminology.hl7.org/CodeSystem/usage-context-type',
                code: 'imaging',
                display: 'Imaging'
              },
              valueCodeableConcept: {
                coding: [{
                  system: 'http://snomed.info/sct',
                  code: '363679005',
                  display: 'Imaging'
                }]
              }
            }],

            // Topic: radiology procedure
            topic: [{
              coding: [{
                system: 'http://loinc.org',
                code: item.code,
                display: item.display
              }],
              text: item.display
            }],

            // Action: create ServiceRequest
            action: [{
              title: `Order ${item.display}`,
              description: item.longName || item.display,

              // Code for the procedure
              code: [{
                coding: [{
                  system: 'http://loinc.org',
                  code: item.code,
                  display: item.display
                }]
              }],

              // Definition: what resource to create
              definitionCanonical: `ServiceRequest/${item.id}`,

              // Extensions for catalog metadata
              extension: [
                {
                  url: 'http://honeycomb3.io/fhir/StructureDefinition/imaging-modality',
                  valueCodeableConcept: {
                    coding: [{
                      system: 'http://dicom.nema.org/resources/ontology/DCM',
                      code: item.modality,
                      display: item.modalityDisplay
                    }],
                    text: item.modalityDisplay
                  }
                },
                {
                  url: 'http://honeycomb3.io/fhir/StructureDefinition/imaging-category',
                  valueString: item.category
                },
                {
                  url: 'http://honeycomb3.io/fhir/StructureDefinition/body-part',
                  valueCodeableConcept: {
                    text: item.bodyPart
                  }
                },
                {
                  url: 'http://honeycomb3.io/fhir/StructureDefinition/turnaround-time',
                  valueString: item.turnaround
                }
              ]
            }]
          };

          // Add contrast info if present
          if (item.contrast) {
            planDefinition.action[0].extension.push({
              url: 'http://honeycomb3.io/fhir/StructureDefinition/contrast',
              valueString: item.contrast
            });
          }

          // Add laterality if present
          if (item.laterality) {
            planDefinition.action[0].extension.push({
              url: 'http://honeycomb3.io/fhir/StructureDefinition/laterality',
              valueCode: item.laterality
            });
          }

          // Add views if present
          if (item.views) {
            planDefinition.action[0].extension.push({
              url: 'http://honeycomb3.io/fhir/StructureDefinition/views',
              valueString: item.views
            });
          }

          await PlanDefinitions.insertAsync(planDefinition);
          insertedCount++;

          if (insertedCount % 10 === 0) {
            console.log(`[RadiologyCatalog] Progress: ${insertedCount}/${RADIOLOGY_CATALOG.length} procedures inserted...`);
          }

        } catch (error) {
          console.error(`[RadiologyCatalog] Error inserting ${item.display}:`, error.message);
          errorCount++;
          errors.push({ procedure: item.display, error: error.message });
        }
      }

      console.log(`[RadiologyCatalog] ✅ Initialization complete: ${insertedCount} inserted, ${errorCount} errors`);

      if (errorCount > 0) {
        console.warn(`[RadiologyCatalog] ⚠️  Errors encountered:`, errors.slice(0, 5));
      }

      return {
        success: true,
        inserted: insertedCount,
        errors: errorCount,
        total: RADIOLOGY_CATALOG.length
      };

    } catch (error) {
      console.error('[RadiologyCatalog] ❌ Fatal error during initialization:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear all radiology PlanDefinitions (for re-initialization)
   */
  async clearRadiologyCatalog() {
    console.log('[RadiologyCatalog] Clearing existing radiology order sets...');

    const PlanDefinitions = global.Collections.PlanDefinitions;
    if (!PlanDefinitions) {
      console.warn('[RadiologyCatalog] PlanDefinitions collection not found');
      return { success: false, error: 'Collection not found' };
    }

    try {
      const result = await PlanDefinitions.removeAsync({
        'type.coding.code': 'order-set',
        'useContext.code.code': 'imaging'
      });

      console.log(`[RadiologyCatalog] ✅ Cleared ${result} radiology order sets`);
      return { success: true, removed: result };

    } catch (error) {
      console.error('[RadiologyCatalog] ❌ Error clearing catalog:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get statistics about the radiology catalog
   */
  async getCatalogStats() {
    const PlanDefinitions = global.Collections.PlanDefinitions;
    if (!PlanDefinitions) {
      return { error: 'Collection not found' };
    }

    try {
      const total = await PlanDefinitions.find({
        'type.coding.code': 'order-set',
        'useContext.code.code': 'imaging'
      }).countAsync();

      const byCategory = {};
      const procedures = await PlanDefinitions.find({
        'type.coding.code': 'order-set',
        'useContext.code.code': 'imaging'
      }).fetchAsync();

      procedures.forEach(proc => {
        const category = get(proc, 'action[0].extension', []).find(
          ext => ext.url === 'http://honeycomb3.io/fhir/StructureDefinition/imaging-category'
        );
        if (category) {
          const cat = category.valueString;
          byCategory[cat] = (byCategory[cat] || 0) + 1;
        }
      });

      return {
        total,
        byCategory,
        catalogSize: RADIOLOGY_CATALOG.length,
        initialized: total > 0
      };

    } catch (error) {
      return { error: error.message };
    }
  }

};

// Export for Meteor methods
Meteor.methods({
  'radiologyCatalog.initialize': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    return await RadiologyCatalogInitializer.initializeRadiologyCatalog();
  },

  'radiologyCatalog.clear': async function() {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    return await RadiologyCatalogInitializer.clearRadiologyCatalog();
  },

  'radiologyCatalog.stats': async function() {
    return await RadiologyCatalogInitializer.getCatalogStats();
  }
});

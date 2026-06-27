// packages/order-catalog/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// =============================================================================
// SERVER METHODS
// =============================================================================

Meteor.methods({
  
  // ---------------------------------------------------------------------------
  // SUBMIT ORDERS - ONC Compliant
  // ---------------------------------------------------------------------------
  
  'orderCatalog.submitOrders': async function(orderData) {
    console.log('orderCatalog.submitOrders', orderData);
    
    // Check authorization
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to submit orders');
    }
    
    // Validate inputs
    check(orderData, {
      patientId: String,
      orders: [Object],
      orderType: Match.Where(function(type) {
        check(type, String);
        return ['laboratory', 'medication', 'radiology'].includes(type);
      }),
      authorId: String,
      encounterId: Match.Optional(String)
    });

    // FHIR ServiceRequest.encounter / MedicationRequest.encounter are 0..1.
    // Reference the active encounter when the client supplied one; otherwise
    // omit the field entirely (Session is client-only — never read it here).
    const encounterReference = orderData.encounterId
      ? { reference: `Encounter/${orderData.encounterId}` }
      : undefined;
    
    try {
      // Get FHIR collections
      const ServiceRequests = await global.Collections.ServiceRequests;
      const MedicationRequests = await global.Collections.MedicationRequests;
      const AuditEvents = await global.Collections.AuditEvents;
      const Patients = await global.Collections.Patients;
      
      // Verify patient exists.
      // Session may hold either the MongoDB _id or the FHIR id (for imported
      // patients these differ — selectedPatientId is typically the FHIR id).
      // Look up by _id first, then fall back to the FHIR id. Sequential
      // fallback only — never $or/|| (see .claude/rules/anti-patterns/id-lookup.md).
      let patient = null;
      let patientFhirId = orderData.patientId;
      let patientDisplay = 'Unknown Patient';

      if (Patients) {
        patient = await Patients.findOneAsync({ _id: orderData.patientId });
        if (!patient) {
          patient = await Patients.findOneAsync({ id: orderData.patientId });
        }
        if (!patient) {
          throw new Meteor.Error('patient-not-found', `Patient not found with id or _id: ${orderData.patientId}`);
        }
        // Get FHIR id for reference
        patientFhirId = get(patient, 'id', orderData.patientId);

        // Assemble patient display name using FhirUtilities.
        // FhirUtilities is exposed on the SERVER as global.FhirUtilities
        // (server/main.js); Meteor.FhirUtilities is client-only (App.jsx).
        // Guard the host global per the load-order rule (npmPackages/CLAUDE.md),
        // with a small inline fallback so a missing global degrades gracefully.
        if (patient.name && patient.name.length > 0) {
          const FhirUtilities = global.FhirUtilities || Meteor.FhirUtilities;
          patientDisplay = (FhirUtilities && typeof FhirUtilities.assembleName === 'function')
            ? FhirUtilities.assembleName(patient.name[0])
            : [
                get(patient, 'name[0].given[0]', ''),
                get(patient, 'name[0].family', get(patient, 'name[0].text', ''))
              ].join(' ').trim() || 'Unknown Patient';
        }

        console.log('✓ Patient found:', {
          _id: patient._id,
          fhirId: patientFhirId,
          display: patientDisplay
        });
      }

      // Get current user for practitioner display
      const currentUser = await Meteor.users.findOneAsync({ _id: this.userId });
      let practitionerDisplay = 'Unknown Provider';

      // Try to get name from user profile
      if (currentUser) {
        if (get(currentUser, 'profile.name')) {
          practitionerDisplay = get(currentUser, 'profile.name');
        } else if (get(currentUser, 'username')) {
          practitionerDisplay = get(currentUser, 'username');
        }
      }

      console.log('✓ Practitioner found:', {
        userId: this.userId,
        display: practitionerDisplay
      });
      
      const results = [];
      const timestamp = new Date().toISOString();
      
      // Process each order
      for (const order of orderData.orders) {
        let resource = null;
        let collection = null;
        
        if (orderData.orderType === 'laboratory') {
          // Create FHIR ServiceRequest for lab orders
          resource = {
            resourceType: 'ServiceRequest',
            id: Random.id(),
            status: 'active',
            intent: 'order',
            priority: order.priority || 'routine',
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: order.code,
                display: order.display
              }],
              text: order.display
            },
            subject: {
              reference: `Patient/${patientFhirId}`,
              display: patientDisplay
            },
            encounter: encounterReference,
            occurrenceDateTime: timestamp,
            authoredOn: timestamp,
            requester: {
              reference: `Practitioner/${this.userId}`,
              display: practitionerDisplay
            },
            category: [{
              coding: [{
                system: 'http://snomed.info/sct',
                code: '108252007',
                display: 'Laboratory procedure'
              }]
            }],
            note: order.notes ? [{
              text: order.notes,
              time: timestamp,
              authorReference: {
                reference: `Practitioner/${this.userId}`
              }
            }] : undefined
          };
          
          collection = ServiceRequests;
          
        } else if (orderData.orderType === 'medication') {
          // Create FHIR MedicationRequest for medication orders
          resource = {
            resourceType: 'MedicationRequest',
            id: Random.id(),
            status: 'active',
            intent: 'order',
            priority: order.priority || 'routine',
            medicationCodeableConcept: {
              coding: [{
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: order.code,
                display: order.display
              }],
              text: order.display
            },
            subject: {
              reference: `Patient/${patientFhirId}`,
              display: patientDisplay
            },
            encounter: encounterReference,
            authoredOn: timestamp,
            requester: {
              reference: `Practitioner/${this.userId}`,
              display: practitionerDisplay
            },
            dosageInstruction: [{
              text: `${order.quantity || 1} ${order.form || 'unit'} ${order.frequency || 'daily'} for ${order.duration || 'as directed'}`,
              timing: {
                repeat: {
                  frequency: order.frequency === 'daily' ? 1 : 
                           order.frequency === 'bid' ? 2 :
                           order.frequency === 'tid' ? 3 :
                           order.frequency === 'qid' ? 4 : 1,
                  period: 1,
                  periodUnit: 'd'
                }
              },
              route: {
                coding: [{
                  system: 'http://snomed.info/sct',
                  code: order.route === 'PO' ? '26643006' :
                        order.route === 'IV' ? '47625008' :
                        order.route === 'IM' ? '78421000' :
                        order.route === 'SubQ' ? '34206005' : '26643006',
                  display: order.route || 'Oral'
                }]
              },
              doseAndRate: [{
                doseQuantity: {
                  value: parseFloat(order.strength) || 0,
                  unit: 'mg',
                  system: 'http://unitsofmeasure.org'
                }
              }]
            }],
            dispenseRequest: {
              quantity: {
                value: parseInt(order.quantity) || 30,
                unit: order.form || 'tablet'
              },
              expectedSupplyDuration: {
                value: parseInt(order.duration) || 30,
                unit: 'days',
                system: 'http://unitsofmeasure.org'
              }
            },
            note: order.notes ? [{
              text: order.notes,
              time: timestamp
            }] : undefined
          };

          collection = MedicationRequests;

        } else if (orderData.orderType === 'radiology') {
          // Create FHIR ServiceRequest for radiology/imaging orders
          // ONC §170.315(a)(3) - CPOE Diagnostic Imaging
          resource = {
            resourceType: 'ServiceRequest',
            id: Random.id(),
            status: 'active',
            intent: 'order',
            priority: order.priority || 'routine',

            // Main code: LOINC procedure code from RSNA Radiology Playbook
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: order.code,
                display: order.display
              }],
              text: order.display
            },

            // Category: Imaging (SNOMED CT)
            category: [{
              coding: [{
                system: 'http://snomed.info/sct',
                code: '363679005',
                display: 'Imaging'
              }],
              text: 'Imaging'
            }],

            // Order detail: Modality (DICOM code)
            orderDetail: [{
              coding: [{
                system: 'http://dicom.nema.org/resources/ontology/DCM',
                code: order.modality,
                display: order.modalityDisplay
              }],
              text: order.modalityDisplay
            }],

            // Body site
            bodySite: order.bodyPart ? [{
              text: order.bodyPart,
              ...(order.bodyPartCode && {
                coding: [{
                  system: 'http://snomed.info/sct',
                  code: order.bodyPartCode,
                  display: order.bodyPart
                }]
              })
            }] : undefined,

            // Reason for order (ONC optional field for §170.315(a)(3))
            reasonCode: order.reasonForOrder ? [{
              text: order.reasonForOrder
            }] : undefined,

            // Patient reference (use FHIR id for reference)
            subject: {
              reference: `Patient/${patientFhirId}`,
              display: patientDisplay
            },

            // Encounter reference (0..1 — present only when supplied)
            encounter: encounterReference,

            // Timing
            occurrenceDateTime: timestamp,
            authoredOn: timestamp,

            // Requester (ordering provider)
            requester: {
              reference: `Practitioner/${this.userId}`,
              display: practitionerDisplay
            },

            // Supporting info: contrast, laterality, views as extensions
            extension: [],

            // Notes
            note: order.notes ? [{
              text: order.notes,
              time: timestamp,
              authorReference: {
                reference: `Practitioner/${this.userId}`
              }
            }] : undefined
          };

          // Add laterality extension if applicable
          if (order.selectedLaterality && order.selectedLaterality !== 'bilateral') {
            resource.extension.push({
              url: 'http://hl7.org/fhir/StructureDefinition/bodySite-laterality',
              valueCodeableConcept: {
                coding: [{
                  system: 'http://snomed.info/sct',
                  code: order.selectedLaterality === 'left' ? '7771000' : '24028007',
                  display: order.selectedLaterality === 'left' ? 'Left' : 'Right'
                }]
              }
            });
          }

          // Add contrast as extension
          if (order.contrast) {
            resource.extension.push({
              url: 'http://honeycomb3.io/fhir/StructureDefinition/contrast',
              valueString: order.contrast
            });
          }

          // Add views as extension
          if (order.views) {
            resource.extension.push({
              url: 'http://honeycomb3.io/fhir/StructureDefinition/views',
              valueString: order.views
            });
          }

          collection = ServiceRequests;
        }

        // Insert the resource
        if (collection && resource) {
          const insertId = await collection.insertAsync(resource);
          results.push({
            id: insertId,
            resourceId: resource.id,
            resourceType: resource.resourceType
          });
          
          // Create audit event for ONC compliance
          if (AuditEvents) {
            await AuditEvents.insertAsync({
              resourceType: 'AuditEvent',
              type: {
                system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
                code: 'rest',
                display: 'RESTful Operation'
              },
              subtype: [{
                system: 'http://hl7.org/fhir/restful-interaction',
                code: 'create',
                display: 'create'
              }],
              action: 'C',
              recorded: timestamp,
              outcome: '0',
              outcomeDesc: 'Order created successfully',
              agent: [{
                who: {
                  reference: `Practitioner/${this.userId}`,
                  display: get(currentUser, 'profile.name', practitionerDisplay)
                },
                requestor: true
              }],
              source: {
                observer: {
                  display: 'Order Catalog CPOE System'
                },
                type: [{
                  system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
                  code: '4',
                  display: 'Application Server'
                }]
              },
              entity: [{
                what: {
                  reference: `${resource.resourceType}/${resource.id}`
                },
                type: {
                  system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
                  code: '2',
                  display: 'System Object'
                }
              }]
            });
          }
        }
      }
      
      console.log('Orders submitted successfully:', results.length);
      return {
        success: true,
        message: `${results.length} orders submitted successfully`,
        orders: results
      };
      
    } catch (error) {
      console.error('Error in orderCatalog.submitOrders:', error);
      throw new Meteor.Error('submit-failed', 'Failed to submit orders');
    }
  },
  
  // ---------------------------------------------------------------------------
  // CHECK DRUG INTERACTIONS - ONC §170.315(a)(4) Compliance
  // ---------------------------------------------------------------------------
  
  'orderCatalog.checkDrugInteractions': async function(medicationCodes) {
    console.log('orderCatalog.checkDrugInteractions', medicationCodes);
    
    check(medicationCodes, [String]);
    
    // Simplified interaction check for demonstration
    // In production, this would call a real drug interaction database
    const interactions = [];
    
    // Example known interactions
    const knownInteractions = [
      { drugs: ['308459', '312289'], severity: 'major', description: 'Increased risk of respiratory depression' },
      { drugs: ['314076', '310429'], severity: 'moderate', description: 'May increase risk of hypotension' }
    ];
    
    // Check for interactions
    knownInteractions.forEach(interaction => {
      const hasAll = interaction.drugs.every(drug => medicationCodes.includes(drug));
      if (hasAll) {
        interactions.push(interaction);
      }
    });
    
    return {
      hasInteractions: interactions.length > 0,
      interactions: interactions,
      checkedAt: new Date().toISOString()
    };
  },
  
  // ---------------------------------------------------------------------------
  // GET CATALOG ITEMS
  // ---------------------------------------------------------------------------
  
  'orderCatalog.getCatalogItems': async function(catalogType) {
    console.log('orderCatalog.getCatalogItems', catalogType);
    
    check(catalogType, Match.Where(function(type) {
      check(type, String);
      return ['laboratory', 'medication'].includes(type);
    }));
    
    // In production, this would fetch from actual FHIR PlanDefinition resources
    // For now, returning sample data structure
    return {
      catalogType: catalogType,
      items: [],
      lastUpdated: new Date().toISOString()
    };
  }
});
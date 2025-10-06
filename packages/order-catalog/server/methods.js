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
        return ['laboratory', 'medication'].includes(type);
      }),
      authorId: String
    });
    
    try {
      // Get FHIR collections
      const ServiceRequests = await global.Collections.ServiceRequests;
      const MedicationRequests = await global.Collections.MedicationRequests;
      const AuditEvents = await global.Collections.AuditEvents;
      const Patients = await global.Collections.Patients;
      
      // Verify patient exists
      let patient = null;
      if (Patients) {
        patient = await Patients.findOneAsync({ id: orderData.patientId });
        if (!patient) {
          throw new Meteor.Error('patient-not-found', 'Patient not found');
        }
      }
      
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
              reference: `Patient/${orderData.patientId}`,
              display: get(patient, 'name[0].text', 'Unknown Patient')
            },
            encounter: {
              reference: `Encounter/${Session.get('currentEncounterId') || 'unknown'}`
            },
            occurrenceDateTime: timestamp,
            authoredOn: timestamp,
            requester: {
              reference: `Practitioner/${this.userId}`,
              display: get(Meteor.user(), 'profile.name', 'Unknown Provider')
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
              reference: `Patient/${orderData.patientId}`,
              display: get(patient, 'name[0].text', 'Unknown Patient')
            },
            encounter: {
              reference: `Encounter/${Session.get('currentEncounterId') || 'unknown'}`
            },
            authoredOn: timestamp,
            requester: {
              reference: `Practitioner/${this.userId}`,
              display: get(Meteor.user(), 'profile.name', 'Unknown Provider')
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
                  display: get(Meteor.user(), 'profile.name', 'Unknown Provider')
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
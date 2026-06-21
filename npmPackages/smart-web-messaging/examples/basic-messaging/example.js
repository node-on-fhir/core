// packages/smart-web-messaging/examples/basic-messaging/example.js

/**
 * Basic SMART Web Messaging Example
 * Demonstrates simple message exchange between SMART app and EHR
 */

import { SmartMessagingClient } from 'meteor/clinical:smart-web-messaging';

// Initialize when app starts
Meteor.startup(async () => {
  try {
    // Initialize messaging client
    await SmartMessagingClient.initialize({
      debug: true // Enable debug logging
    });
    
    console.log('SMART Web Messaging initialized successfully');
    
    // Example 1: Send a done signal
    $('#done-button').on('click', async () => {
      try {
        await SmartMessagingClient.done({
          status: 'completed',
          data: { 
            patientId: Session.get('patientId'),
            timestamp: new Date()
          }
        });
        console.log('Done signal sent');
      } catch (error) {
        console.error('Failed to send done signal:', error);
      }
    });
    
    // Example 2: Create scratchpad resource
    $('#create-observation').on('click', async () => {
      try {
        const observation = {
          resourceType: 'Observation',
          status: 'draft',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel'
            }]
          },
          effectiveDateTime: new Date().toISOString(),
          component: [
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure'
                }]
              },
              valueQuantity: {
                value: 120,
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            },
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure'
                }]
              },
              valueQuantity: {
                value: 80,
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            }
          ]
        };
        
        const result = await SmartMessagingClient.scratchpad.create(observation);
        console.log('Created scratchpad observation:', result);
        
        // Store ID for later use
        Session.set('scratchpadObservationId', result.id);
        
      } catch (error) {
        console.error('Failed to create observation:', error);
      }
    });
    
    // Example 3: Launch appointment booking activity
    $('#book-appointment').on('click', async () => {
      try {
        const patientId = Session.get('patientId');
        
        const result = await SmartMessagingClient.launchActivity(
          'appointment-book',
          {
            patient: `Patient/${patientId}`,
            practitioner: Session.get('practitionerId')
          }
        );
        
        console.log('Activity result:', result);
        
      } catch (error) {
        console.error('Failed to launch activity:', error);
      }
    });
    
    // Example 4: Make FHIR request through proxy
    $('#fetch-patient').on('click', async () => {
      try {
        const patientId = Session.get('patientId');
        
        const patient = await SmartMessagingClient.fhir.get(`/Patient/${patientId}`);
        console.log('Fetched patient:', patient);
        
        // Display patient name
        const name = patient.name?.[0];
        const displayName = name ? `${name.given?.join(' ')} ${name.family}` : 'Unknown';
        $('#patient-name').text(displayName);
        
      } catch (error) {
        console.error('Failed to fetch patient:', error);
      }
    });
    
    // Example 5: Listen for custom messages
    SmartMessagingClient.onMessage('custom.refresh', (message, event) => {
      console.log('Received refresh request:', message);
      // Refresh your UI here
      location.reload();
    });
    
  } catch (error) {
    console.error('Failed to initialize SMART Web Messaging:', error);
  }
});

// Example helper: Handle activity requests from parent
$(document).on('smart:activity:appointment-book', (event, data) => {
  console.log('Appointment booking requested:', data);
  
  // Show appointment booking UI
  const { parameters, context, callback } = data;
  
  // Simulate appointment booking
  setTimeout(() => {
    // Return result
    callback({
      resource: {
        resourceType: 'Appointment',
        id: Random.id(),
        status: 'booked',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
        participant: [
          {
            actor: { reference: parameters.patient },
            status: 'accepted'
          }
        ]
      }
    });
  }, 1000);
});
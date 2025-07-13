// /client/test-audit-event.js
// Test file to verify AuditEvent logging

import { Meteor } from 'meteor/meteor';

// Test the audit event logging
window.testAuditEvent = function() {
  console.log('Testing AuditEvent logging...');
  
  Meteor.call('auditEvents.log', 'test', Meteor.userId(), 'Test/123', 
    'Test audit event from console', {
      action: 'CREATE',
      entity: [{
        what: {
          reference: 'Test/123',
          display: 'Test Resource'
        },
        type: {
          system: 'http://hl7.org/fhir/resource-types',
          code: 'Test',
          display: 'Test'
        }
      }]
    }, (error, result) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Success! Created audit event:', result);
        
        // Now check if it's in the collection
        setTimeout(() => {
          const events = window.Collections.AuditEvents.find({}, { sort: { recorded: -1 }, limit: 5 }).fetch();
          console.log('Recent AuditEvents:', events);
        }, 1000);
      }
    }
  );
};

console.log('Test function available: window.testAuditEvent()');
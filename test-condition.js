// test-condition.js
// Run this in the browser console to create a test condition

if (typeof Conditions !== 'undefined' && Meteor.userId()) {
  const testCondition = {
    resourceType: 'Condition',
    subject: {
      reference: 'Patient/test',
      display: 'Test Patient'
    },
    asserter: {
      reference: 'Practitioner/test',
      display: 'Test Doctor'
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '195967001',
        display: 'Asthma'
      }],
      text: 'Asthma'
    },
    clinicalStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
        display: 'Active'
      }]
    },
    verificationStatus: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
        display: 'Confirmed'
      }]
    },
    recordedDate: new Date(),
    onsetDateTime: new Date()
  };
  
  Meteor.call('conditions.create', testCondition, function(err, result) {
    if (err) {
      console.error('Error creating condition:', err);
    } else {
      console.log('Created condition with ID:', result);
      
      // Now test getting it back
      Meteor.call('conditions.get', result, function(err2, condition) {
        if (err2) {
          console.error('Error getting condition:', err2);
        } else {
          console.log('Retrieved condition:', condition);
        }
      });
    }
  });
} else {
  console.error('Conditions collection not available or user not logged in');
}
// /Volumes/SonicMagic/Code/honeycomb-public-release/test-intervention-flow.js

// Comprehensive test for the intervention approval workflow
// This tests the complete flow from intervention execution through approval and back

async function testCompleteInterventionFlow() {
  console.group('🧬 Testing Complete Intervention Flow');
  
  const Collections = Meteor.Collections;
  const ServiceRequests = Collections?.ServiceRequests;
  const Communications = Collections?.Communications;
  
  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Step 1: Create a test intervention
  console.log('\n1️⃣ Creating test intervention...');
  
  const interventionId = Random.id();
  const testIntervention = {
    id: interventionId,
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: 'routine',
    code: {
      coding: [{
        system: 'http://honeycomb.ai/intervention-protocols',
        code: 'anaphylaxis-protocol',
        display: 'Anaphylaxis Emergency Protocol'
      }],
      text: 'Anaphylaxis Emergency Protocol'
    },
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    authoredOn: new Date().toISOString(),
    requester: {
      reference: 'Practitioner/test-practitioner',
      display: 'Test Practitioner'
    },
    extension: [{
      url: 'http://honeycomb.ai/fhir/StructureDefinition/protocol-id',
      valueString: 'anaphylaxis-protocol'
    }, {
      url: 'http://honeycomb.ai/fhir/StructureDefinition/completed-steps',
      valueString: JSON.stringify(['patient-assessment'])
    }]
  };
  
  try {
    const result = await Meteor.callAsync('createServiceRequest', testIntervention);
    console.log('✅ Created intervention:', interventionId);
    
    // Verify it exists
    const created = ServiceRequests.findOne({
      $or: [{ _id: interventionId }, { id: interventionId }]
    });
    console.log('✅ Verified in database:', !!created);
    
  } catch (error) {
    console.error('❌ Error creating intervention:', error);
    console.groupEnd();
    return;
  }
  
  // Step 2: Simulate requesting approval for a step
  console.log('\n2️⃣ Simulating approval request for medication step...');
  
  const approvalRequestId = Random.id();
  const approvalRequest = {
    id: approvalRequestId,
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: 'urgent',
    category: [{
      coding: [{
        system: 'http://honeycomb.ai/servicerequest-categories',
        code: 'intervention-approval',
        display: 'Intervention Approval Request'
      }]
    }],
    code: {
      coding: [{
        system: 'http://honeycomb.ai/servicerequest-codes',
        code: 'review-intervention-step',
        display: 'Review Intervention Step'
      }],
      text: 'Review and approve: Epinephrine Administration'
    },
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    authoredOn: new Date().toISOString(),
    requester: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    performer: [{
      reference: 'Practitioner/chief-medical-officer',
      display: 'Chief Medical Officer'
    }],
    reasonCode: [{
      coding: [{
        system: 'http://honeycomb.ai/reason-codes',
        code: 'step-requires-approval',
        display: 'Intervention step requires medical approval'
      }],
      text: 'High-risk medication requires physician approval'
    }],
    supportingInfo: [{
      reference: `ServiceRequest/${interventionId}`,
      display: 'Parent Intervention'
    }],
    extension: [{
      url: 'http://honeycomb.ai/fhir/StructureDefinition/intervention-step-id',
      valueString: 'epinephrine-admin'
    }, {
      url: 'http://honeycomb.ai/fhir/StructureDefinition/protocol-id',
      valueString: 'anaphylaxis-protocol'
    }]
  };
  
  try {
    const result = await Meteor.callAsync('createServiceRequest', approvalRequest);
    console.log('✅ Created approval request:', approvalRequestId);
    
  } catch (error) {
    console.error('❌ Error creating approval request:', error);
  }
  
  // Step 3: Test the approval flow
  console.log('\n3️⃣ Testing approval flow...');
  
  // Test finding the approval request
  const foundApproval = ServiceRequests.findOne({
    $or: [
      { _id: approvalRequestId },
      { id: approvalRequestId }
    ]
  });
  
  if (foundApproval) {
    console.log('✅ Found approval request in database');
    
    // Test updating it (simulating approval)
    try {
      await Meteor.callAsync('updateServiceRequest', approvalRequestId, {
        status: 'completed',
        note: [{
          text: 'Approved by test script',
          time: new Date().toISOString()
        }]
      });
      console.log('✅ Successfully approved the request');
      
    } catch (error) {
      console.error('❌ Error approving request:', error);
    }
  }
  
  // Step 4: Verify the workflow URLs
  console.log('\n4️⃣ Workflow URLs:');
  console.log('   Interventions List:', window.location.origin + '/interventions');
  console.log('   Intervention Execution:', window.location.origin + `/intervention-execution?protocol=anaphylaxis-protocol&interventionId=${interventionId}`);
  console.log('   Approval Page:', window.location.origin + `/intervention-approval/${approvalRequestId}`);
  
  // Step 5: Summary
  console.log('\n📊 Test Summary:');
  
  const stats = {
    totalServiceRequests: ServiceRequests.find().count(),
    activeInterventions: ServiceRequests.find({
      status: 'active',
      $or: [
        { 'category': { $exists: false } },
        { 'category.0.coding.0.code': { $ne: 'intervention-approval' } }
      ]
    }).count(),
    pendingApprovals: ServiceRequests.find({
      status: 'active',
      'category.0.coding.0.code': 'intervention-approval'
    }).count(),
    completedApprovals: ServiceRequests.find({
      status: 'completed',
      'category.0.coding.0.code': 'intervention-approval'
    }).count()
  };
  
  console.table(stats);
  
  console.log('\n✅ Workflow test complete!');
  console.log('   To navigate to the approval page, use:');
  console.log(`   window.location.href = '/intervention-approval/${approvalRequestId}'`);
  
  console.groupEnd();
  
  return {
    interventionId,
    approvalRequestId,
    stats
  };
}

// Helper function to clean up test data
async function cleanupTestData() {
  console.group('🧹 Cleaning up test data...');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  
  if (!ServiceRequests) {
    console.error('ServiceRequests collection not available');
    console.groupEnd();
    return;
  }
  
  // Find test service requests
  const testRequests = ServiceRequests.find({
    $or: [
      { 'subject.reference': 'Patient/test-patient' },
      { 'requester.reference': 'Practitioner/test-practitioner' }
    ]
  }).fetch();
  
  console.log(`Found ${testRequests.length} test requests to remove`);
  
  for (const request of testRequests) {
    try {
      await Meteor.callAsync('removeServiceRequest', request._id || request.id);
      console.log(`✅ Removed: ${request.code?.text || 'Unknown'}`);
    } catch (error) {
      console.error(`❌ Error removing ${request._id || request.id}:`, error);
    }
  }
  
  console.groupEnd();
}

// Export functions for console use
window.testInterventionFlow = testCompleteInterventionFlow;
window.cleanupTestData = cleanupTestData;

console.log('🧪 Intervention flow test loaded!');
console.log('   Run: testInterventionFlow()');
console.log('   Cleanup: cleanupTestData()');
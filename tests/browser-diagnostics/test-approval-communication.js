// /Volumes/SonicMagic/Code/honeycomb-public-release/test-approval-communication.js

// Test script to verify Communication handling in the approval workflow
// Run this in the browser console

async function testApprovalCommunicationFlow() {
  console.group('📬 Testing Approval Communication Flow');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  const Communications = Meteor.Collections?.Communications;
  
  if (!ServiceRequests || !Communications) {
    console.error('❌ Collections not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Count initial communications
  const initialCommCount = Communications.find().count();
  console.log(`📊 Initial Communication count: ${initialCommCount}`);
  
  // Step 2: Create a test Communication
  console.log('\n1️⃣ Creating test Communication...');
  
  const testComm = {
    resourceType: 'Communication',
    status: 'in-progress',
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    sent: new Date().toISOString(),
    sender: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    recipient: [{
      reference: 'Practitioner/chief-medical-officer',
      display: 'Chief Medical Officer'
    }],
    payload: [{
      contentString: 'Test approval request for medication administration'
    }],
    category: [{
      coding: [{
        system: 'http://honeycomb.ai/communication-categories',
        code: 'intervention-approval',
        display: 'Intervention Approval Request'
      }]
    }]
  };
  
  let commId;
  try {
    commId = await Meteor.callAsync('createInterventionApprovalCommunication', testComm);
    console.log('✅ Created Communication:', commId);
    
    // Verify it exists
    const created = Communications.findOne(commId);
    console.log('✅ Verified in database:', !!created);
    
  } catch (error) {
    console.error('❌ Error creating Communication:', error);
    console.groupEnd();
    return;
  }
  
  // Step 3: Create a ServiceRequest that references this Communication
  console.log('\n2️⃣ Creating ServiceRequest with Communication reference...');
  
  const testServiceRequest = {
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
      text: 'Review and approve: Test Medication'
    },
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    authoredOn: new Date().toISOString(),
    supportingInfo: [{
      reference: `Communication/${commId}`,
      display: 'Approval Request Communication'
    }],
    replaces: [{
      reference: `Communication/${commId}`,
      display: 'Approval Request Communication'
    }]
  };
  
  let serviceRequestId;
  try {
    serviceRequestId = await Meteor.callAsync('createServiceRequest', testServiceRequest);
    console.log('✅ Created ServiceRequest:', serviceRequestId);
    
    const createdSR = ServiceRequests.findOne({
      $or: [{ _id: serviceRequestId }, { id: serviceRequestId }]
    });
    console.log('✅ Verified ServiceRequest with replaces field:', createdSR?.replaces);
    
  } catch (error) {
    console.error('❌ Error creating ServiceRequest:', error);
  }
  
  // Step 4: Test Communication deletion
  console.log('\n3️⃣ Testing Communication deletion...');
  
  try {
    await Meteor.callAsync('communications.removeById', { _id: commId });
    console.log('✅ Communication deleted successfully');
    
    // Verify it's gone
    const deleted = Communications.findOne(commId);
    console.log('✅ Verified deletion:', !deleted);
    
  } catch (error) {
    console.error('❌ Error deleting Communication:', error);
  }
  
  // Step 5: Final count
  const finalCommCount = Communications.find().count();
  console.log(`\n📊 Final Communication count: ${finalCommCount}`);
  console.log(`   Communications created: 1`);
  console.log(`   Communications deleted: 1`);
  console.log(`   Net change: ${finalCommCount - initialCommCount}`);
  
  // Step 6: Show active approval requests
  console.log('\n4️⃣ Active approval requests:');
  const approvalRequests = ServiceRequests.find({
    status: 'active',
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  approvalRequests.forEach((req, i) => {
    const hasComm = req.replaces?.some(r => r.reference?.includes('Communication/'));
    console.log(`${i + 1}. ${req.code?.text || 'Unknown'} - Has Communication ref: ${hasComm}`);
  });
  
  console.groupEnd();
  
  return {
    communicationId: commId,
    serviceRequestId: serviceRequestId
  };
}

// Run the test
console.log('🚀 Running approval communication test...');
console.log('   To run again, call: testApprovalCommunicationFlow()');
testApprovalCommunicationFlow();
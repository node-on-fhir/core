// /Volumes/SonicMagic/Code/honeycomb-public-release/test-approval-workflow.js

// Test script to verify the intervention approval workflow
// Run this in the browser console to test the complete flow

async function testApprovalWorkflow() {
  console.group('🧪 Testing Intervention Approval Workflow');
  
  // Step 1: Check if user is logged in
  const currentUser = Meteor.user();
  if (!currentUser) {
    console.error('❌ User not logged in. Please log in first.');
    console.groupEnd();
    return;
  }
  console.log('✅ Current user:', currentUser.username);
  
  // Step 2: Check collections
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  const Communications = Meteor.Collections?.Communications;
  
  if (!ServiceRequests || !Communications) {
    console.error('❌ Collections not available');
    console.groupEnd();
    return;
  }
  console.log('✅ Collections available');
  
  // Step 3: Find an active approval request
  const approvalRequests = ServiceRequests.find({
    status: 'active',
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`📋 Found ${approvalRequests.length} approval requests`);
  
  if (approvalRequests.length === 0) {
    console.warn('⚠️ No approval requests found. Creating a test request...');
    
    // Create a test approval request
    try {
      const testRequest = {
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
          text: 'Review and approve: Test Medication Administration'
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
        extension: [{
          url: 'http://honeycomb.ai/fhir/StructureDefinition/intervention-step-id',
          valueString: 'test-step-1'
        }, {
          url: 'http://honeycomb.ai/fhir/StructureDefinition/protocol-id',
          valueString: 'test-protocol'
        }]
      };
      
      const result = await Meteor.callAsync('createServiceRequest', testRequest);
      console.log('✅ Created test approval request:', result);
      
      // Refresh the query
      const newRequest = ServiceRequests.findOne(result);
      if (newRequest) {
        approvalRequests.push(newRequest);
      }
    } catch (error) {
      console.error('❌ Error creating test request:', error);
    }
  }
  
  if (approvalRequests.length > 0) {
    const request = approvalRequests[0];
    console.log('🔍 Testing with approval request:', {
      id: request._id || request.id,
      code: request.code?.text,
      status: request.status,
      category: request.category?.[0]?.coding?.[0]?.code
    });
    
    // Step 4: Test the update method
    console.log('\n📝 Testing updateServiceRequest method...');
    try {
      const updateResult = await Meteor.callAsync('updateServiceRequest', 
        request._id || request.id, 
        {
          note: [{
            text: `Test update at ${new Date().toISOString()}`,
            time: new Date().toISOString()
          }]
        }
      );
      console.log('✅ Update successful:', updateResult);
      
      // Verify the update
      const updated = ServiceRequests.findOne({
        $or: [
          { _id: request._id || request.id },
          { id: request._id || request.id }
        ]
      });
      
      if (updated && updated.note && updated.note.length > 0) {
        console.log('✅ Update verified in database');
      } else {
        console.warn('⚠️ Update not reflected in database');
      }
      
    } catch (error) {
      console.error('❌ Update failed:', error);
    }
    
    // Step 5: Show navigation URL
    const approvalUrl = `/intervention-approval/${request._id || request.id}`;
    console.log('\n🔗 To test the approval UI, navigate to:', approvalUrl);
    console.log('   Or click here:', window.location.origin + approvalUrl);
    
  }
  
  // Step 6: Check for active interventions
  console.log('\n🏥 Checking active interventions...');
  const activeInterventions = ServiceRequests.find({
    status: { $in: ['active', 'on-hold'] },
    $or: [
      { 'category': { $exists: false } },
      { 'category.0.coding.0.code': { $ne: 'intervention-approval' } }
    ]
  }).fetch();
  
  console.log(`📋 Found ${activeInterventions.length} active interventions`);
  activeInterventions.slice(0, 3).forEach((intervention, i) => {
    console.log(`  ${i + 1}. ${intervention.code?.text || 'Unknown'} (${intervention.status})`);
  });
  
  console.groupEnd();
}

// Run the test
console.log('🚀 Running approval workflow test...');
console.log('   To run again, call: testApprovalWorkflow()');
testApprovalWorkflow();
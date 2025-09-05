// /Volumes/SonicMagic/Code/honeycomb-public-release/test-approval-debug.js

// Debug script for approval workflow issues
// Run this in the browser console

async function debugApprovalWorkflow() {
  console.group('🔍 Debugging Approval Workflow');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  const Communications = Meteor.Collections?.Communications;
  
  if (!ServiceRequests || !Communications) {
    console.error('❌ Collections not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Check current approval requests
  console.log('\n1️⃣ Current Approval Requests:');
  const approvalRequests = ServiceRequests.find({
    status: 'active',
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Found ${approvalRequests.length} active approval requests`);
  approvalRequests.forEach((req, i) => {
    console.log(`\n${i + 1}. Approval Request:`, {
      _id: req._id,
      id: req.id,
      status: req.status,
      code: req.code?.text,
      supportingInfo: req.supportingInfo,
      replaces: req.replaces
    });
    
    // Check for Communication references
    const commRefs = [];
    req.supportingInfo?.forEach(si => {
      if (si.reference?.includes('Communication/')) {
        commRefs.push(si.reference);
      }
    });
    req.replaces?.forEach(r => {
      if (r.reference?.includes('Communication/')) {
        commRefs.push(r.reference);
      }
    });
    
    console.log('   Communication references found:', commRefs);
    
    // Try to find the Communications
    commRefs.forEach(ref => {
      const commId = ref.split('/')[1];
      const comm = Communications.findOne({
        $or: [
          { _id: commId },
          { id: commId }
        ]
      });
      console.log(`   Communication ${commId}:`, comm ? 'FOUND' : 'NOT FOUND');
      if (comm) {
        console.log('     Communication details:', {
          _id: comm._id,
          id: comm.id,
          status: comm.status,
          category: comm.category?.[0]?.coding?.[0]?.code
        });
      }
    });
  });
  
  // Step 2: Test updating a ServiceRequest
  if (approvalRequests.length > 0) {
    console.log('\n2️⃣ Testing ServiceRequest Update:');
    const testReq = approvalRequests[0];
    const testId = testReq._id || testReq.id;
    
    console.log('Attempting to update ServiceRequest:', testId);
    
    try {
      // Try updating with a test note
      const result = await Meteor.callAsync('updateServiceRequest', testId, {
        note: [{
          text: `Debug test at ${new Date().toISOString()}`,
          time: new Date().toISOString()
        }]
      });
      console.log('✅ Update successful:', result);
      
      // Check if it was actually updated
      const updated = ServiceRequests.findOne({
        $or: [
          { _id: testId },
          { id: testId }
        ]
      });
      console.log('Updated ServiceRequest:', {
        _id: updated?._id,
        status: updated?.status,
        noteAdded: updated?.note?.length > 0
      });
      
    } catch (error) {
      console.error('❌ Update failed:', error);
      console.error('Error details:', error.reason || error.message);
    }
  }
  
  // Step 3: Check completed approval requests
  console.log('\n3️⃣ Completed Approval Requests:');
  const completedApprovals = ServiceRequests.find({
    status: 'completed',
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Found ${completedApprovals.length} completed approval requests`);
  completedApprovals.slice(0, 3).forEach((req, i) => {
    console.log(`${i + 1}. Completed:`, {
      _id: req._id,
      code: req.code?.text,
      completedAt: req.meta?.lastUpdated
    });
  });
  
  // Step 4: Communications summary
  console.log('\n4️⃣ Communications Summary:');
  const allComms = Communications.find({}).fetch();
  const approvalComms = allComms.filter(c => 
    c.category?.[0]?.coding?.[0]?.code === 'intervention-approval'
  );
  
  console.log(`Total Communications: ${allComms.length}`);
  console.log(`Approval Communications: ${approvalComms.length}`);
  
  approvalComms.forEach((comm, i) => {
    console.log(`${i + 1}. Communication:`, {
      _id: comm._id,
      id: comm.id,
      status: comm.status,
      sent: comm.sent
    });
  });
  
  console.groupEnd();
}

// Function to manually approve a request for testing
async function testApproveRequest(requestId) {
  console.group('🧪 Testing Manual Approval');
  
  try {
    console.log('Updating ServiceRequest to completed...');
    await Meteor.callAsync('updateServiceRequest', requestId, {
      status: 'completed',
      note: [{
        text: 'Manually approved for testing',
        time: new Date().toISOString()
      }]
    });
    
    console.log('✅ ServiceRequest updated');
    
    // Check if it's still in active list
    const stillActive = Meteor.Collections.ServiceRequests.findOne({
      $or: [
        { _id: requestId },
        { id: requestId }
      ],
      status: 'active'
    });
    
    console.log('Still shows as active?', !!stillActive);
    
    // Check if it's in completed list
    const nowCompleted = Meteor.Collections.ServiceRequests.findOne({
      $or: [
        { _id: requestId },
        { id: requestId }
      ],
      status: 'completed'
    });
    
    console.log('Shows as completed?', !!nowCompleted);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

// Export functions
window.debugApprovalWorkflow = debugApprovalWorkflow;
window.testApproveRequest = testApproveRequest;

console.log('🔍 Debug script loaded!');
console.log('   Run: debugApprovalWorkflow()');
console.log('   Approve test: testApproveRequest(requestId)');
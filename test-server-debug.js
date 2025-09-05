// /Volumes/SonicMagic/Code/honeycomb-public-release/test-server-debug.js

// Server-side debug tools for Communications
// Run this in the browser console

async function debugServerCommunications() {
  console.group('🔍 Server-side Communications Debug');
  
  try {
    // List all approval communications on server
    console.log('\n1️⃣ Listing approval communications from server...');
    const approvalComms = await Meteor.callAsync('debug.listApprovalCommunications');
    console.log('Approval Communications:', approvalComms);
    
    // Show in table format
    if (approvalComms.length > 0) {
      console.table(approvalComms);
    }
    
    return approvalComms;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

async function testServerDelete(commId) {
  console.group('🗑️ Testing server-side deletion');
  
  try {
    console.log('Attempting to delete:', commId);
    const result = await Meteor.callAsync('debug.deleteCommunicationDirect', commId);
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Successfully deleted on server');
      
      // Check if it's still in client collection
      const stillInClient = Meteor.Collections.Communications.findOne(commId);
      console.log('Still in client collection?', !!stillInClient);
    } else {
      console.error('❌ Deletion failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

async function cleanupOrphanedCommunications() {
  console.group('🧹 Cleaning up orphaned approval communications');
  
  try {
    const result = await Meteor.callAsync('debug.cleanupApprovalCommunications');
    console.log('Cleanup result:', result);
    
    // Refresh the list
    const remaining = await Meteor.callAsync('debug.listApprovalCommunications');
    console.log(`Remaining approval communications: ${remaining.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

// Function to trace the full approval workflow
async function traceApprovalWorkflow() {
  console.group('🔄 Tracing Approval Workflow');
  
  // Check client-side collections
  const clientComms = Meteor.Collections.Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Client-side approval communications: ${clientComms.length}`);
  
  // Check server-side
  const serverComms = await Meteor.callAsync('debug.listApprovalCommunications');
  console.log(`Server-side approval communications: ${serverComms.length}`);
  
  // Compare
  console.log('\n📊 Comparison:');
  clientComms.forEach(comm => {
    const onServer = serverComms.find(s => s._id === comm._id);
    console.log(`Communication ${comm._id}:`, {
      clientStatus: comm.status,
      serverStatus: onServer?.status || 'NOT FOUND ON SERVER',
      recipient: comm.recipient?.[0]?.reference
    });
  });
  
  console.groupEnd();
}

// Export functions
window.debugServerCommunications = debugServerCommunications;
window.testServerDelete = testServerDelete;
window.cleanupOrphanedCommunications = cleanupOrphanedCommunications;
window.traceApprovalWorkflow = traceApprovalWorkflow;

console.log('🔍 Server debug tools loaded!');
console.log('   List server comms: debugServerCommunications()');
console.log('   Test deletion: testServerDelete(commId)');
console.log('   Cleanup orphaned: cleanupOrphanedCommunications()');
console.log('   Trace workflow: traceApprovalWorkflow()');
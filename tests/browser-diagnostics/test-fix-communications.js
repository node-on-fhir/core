// /Volumes/SonicMagic/Code/honeycomb-public-release/test-fix-communications.js

// Script to fix Communication ID mismatches and clean up orphaned Communications
// Run this in the browser console

async function fixCommunicationReferences() {
  console.group('🔧 Fixing Communication References');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  const Communications = Meteor.Collections?.Communications;
  
  if (!ServiceRequests || !Communications) {
    console.error('❌ Collections not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Find all approval ServiceRequests
  const approvalRequests = ServiceRequests.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Found ${approvalRequests.length} approval ServiceRequests`);
  
  let fixed = 0;
  let notFound = 0;
  
  for (const request of approvalRequests) {
    console.log(`\nChecking ServiceRequest ${request._id || request.id}:`);
    
    // Get the Communication reference
    const commRef = request.supportingInfo?.find(si => si.reference?.includes('Communication/')) ||
                   request.replaces?.find(r => r.reference?.includes('Communication/'));
    
    if (!commRef) {
      console.log('  No Communication reference found');
      continue;
    }
    
    const commId = commRef.reference.split('/')[1];
    console.log(`  Communication reference: ${commRef.reference}`);
    
    // Try to find the Communication
    let comm = Communications.findOne({
      $or: [
        { _id: commId },
        { id: commId }
      ]
    });
    
    if (!comm) {
      console.log('  ❌ Communication not found by ID');
      
      // Try to find by matching content
      const allComms = Communications.find({
        'category.0.coding.0.code': 'intervention-approval'
      }).fetch();
      
      // Look for a Communication that matches this ServiceRequest
      comm = allComms.find(c => {
        const payload = c.payload?.[0]?.contentString || '';
        return payload.includes(request.code?.text) || 
               payload.includes(request.subject?.display);
      });
      
      if (comm) {
        console.log(`  ✅ Found matching Communication by content: ${comm._id}`);
        console.log('  TODO: Update ServiceRequest to reference correct Communication ID');
        fixed++;
      } else {
        console.log('  ❌ No matching Communication found');
        notFound++;
      }
    } else {
      console.log('  ✅ Communication found with correct reference');
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total approval requests: ${approvalRequests.length}`);
  console.log(`  Correctly referenced: ${approvalRequests.length - fixed - notFound}`);
  console.log(`  Fixed by content match: ${fixed}`);
  console.log(`  Communication not found: ${notFound}`);
  
  console.groupEnd();
}

// Function to clean up orphaned Communications
async function cleanupOrphanedCommunications() {
  console.group('🧹 Cleaning up orphaned Communications');
  
  try {
    const result = await Meteor.callAsync('debug.cleanupApprovalCommunications');
    console.log('Cleanup result:', result);
    
    // Refresh the UI
    if (result.deleted > 0) {
      console.log('✅ Communications cleaned up. Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

// Function to manually delete a specific Communication
async function deleteSpecificCommunication(commId) {
  console.group('🗑️ Deleting specific Communication');
  
  try {
    // First try the validated method
    console.log('Attempting to delete:', commId);
    const result = await Meteor.callAsync('communications.removeById', { _id: commId });
    console.log('✅ Delete successful:', result);
    
  } catch (error) {
    console.error('❌ Error with validated method:', error);
    
    // Try the debug method
    console.log('Trying debug method...');
    try {
      const debugResult = await Meteor.callAsync('debug.deleteCommunicationDirect', commId);
      console.log('Debug result:', debugResult);
    } catch (debugError) {
      console.error('❌ Debug method also failed:', debugError);
    }
  }
  
  console.groupEnd();
}

// Function to show all approval Communications
function showApprovalCommunications() {
  console.group('📋 Approval Communications');
  
  const Communications = Meteor.Collections?.Communications;
  if (!Communications) {
    console.error('Communications collection not available');
    console.groupEnd();
    return;
  }
  
  const approvalComms = Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Found ${approvalComms.length} approval Communications:`);
  
  approvalComms.forEach((comm, i) => {
    console.log(`\n${i + 1}. Communication ${comm._id}:`);
    console.log('  Status:', comm.status);
    console.log('  Sent:', comm.sent);
    console.log('  Recipient:', comm.recipient?.[0]?.reference);
    console.log('  Payload:', comm.payload?.[0]?.contentString?.substring(0, 100) + '...');
  });
  
  console.groupEnd();
}

// Export functions
window.fixCommunicationReferences = fixCommunicationReferences;
window.cleanupOrphanedCommunications = cleanupOrphanedCommunications;
window.deleteSpecificCommunication = deleteSpecificCommunication;
window.showApprovalCommunications = showApprovalCommunications;

console.log('🔧 Communication fix tools loaded!');
console.log('   Fix references: fixCommunicationReferences()');
console.log('   Cleanup orphaned: cleanupOrphanedCommunications()');
console.log('   Delete specific: deleteSpecificCommunication(commId)');
console.log('   Show all: showApprovalCommunications()');
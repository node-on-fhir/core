// /Volumes/SonicMagic/Code/honeycomb-public-release/test-communication-delete.js

// Test script to verify Communication deletion is working
// Run this in the browser console

async function testCommunicationDelete() {
  console.group('🗑️ Testing Communication Deletion');
  
  const Communications = Meteor.Collections?.Communications;
  
  if (!Communications) {
    console.error('❌ Communications collection not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Create a test Communication
  console.log('\n1️⃣ Creating test Communication...');
  
  const testComm = {
    resourceType: 'Communication',
    status: 'in-progress',
    subject: {
      reference: 'Patient/test-delete',
      display: 'Test Delete Patient'
    },
    sent: new Date().toISOString(),
    sender: {
      reference: 'Patient/test-delete',
      display: 'Test Delete Patient'
    },
    recipient: [{
      reference: 'Practitioner/chief-medical-officer',
      display: 'Chief Medical Officer'
    }],
    payload: [{
      contentString: 'Test communication for deletion'
    }],
    category: [{
      coding: [{
        system: 'http://honeycomb.ai/communication-categories',
        code: 'intervention-approval',
        display: 'Intervention Approval Request'
      }]
    }]
  };
  
  let createdId;
  try {
    createdId = await Meteor.callAsync('createInterventionApprovalCommunication', testComm);
    console.log('✅ Created Communication with ID:', createdId);
    
    // Verify it exists
    const created = Communications.findOne(createdId);
    console.log('✅ Verified in database:', {
      _id: created?._id,
      id: created?.id,
      exists: !!created
    });
    
  } catch (error) {
    console.error('❌ Error creating Communication:', error);
    console.groupEnd();
    return;
  }
  
  // Step 2: Try to delete it
  console.log('\n2️⃣ Attempting to delete Communication...');
  
  try {
    const result = await Meteor.callAsync('communications.removeById', { _id: createdId });
    console.log('✅ Delete method returned:', result);
    
    // Verify it's gone
    const stillExists = Communications.findOne(createdId);
    console.log('Verification after delete:', {
      stillExists: !!stillExists,
      details: stillExists
    });
    
    if (!stillExists) {
      console.log('✅ Communication successfully deleted!');
    } else {
      console.error('❌ Communication still exists after deletion!');
    }
    
  } catch (error) {
    console.error('❌ Error deleting Communication:', error);
    console.error('Error details:', error.reason || error.message);
  }
  
  // Step 3: Check Recent Alerts
  console.log('\n3️⃣ Checking Recent Alerts...');
  
  const recentAlerts = Communications.find({
    'category.0.coding.0.code': 'intervention-approval',
    status: { $ne: 'completed' }
  }).fetch();
  
  console.log(`Found ${recentAlerts.length} approval communications in Recent Alerts`);
  recentAlerts.forEach((comm, i) => {
    console.log(`${i + 1}. Communication:`, {
      _id: comm._id,
      status: comm.status,
      sent: comm.sent
    });
  });
  
  console.groupEnd();
}

// Function to manually delete a specific Communication
async function deleteCommunication(commId) {
  console.group('🗑️ Manually deleting Communication');
  
  try {
    console.log('Attempting to delete:', commId);
    const result = await Meteor.callAsync('communications.removeById', { _id: commId });
    console.log('✅ Delete successful:', result);
    
    // Verify
    const stillExists = Meteor.Collections.Communications.findOne(commId);
    console.log('Still exists?', !!stillExists);
    
  } catch (error) {
    console.error('❌ Delete failed:', error);
  }
  
  console.groupEnd();
}

// Function to clean up all test Communications
async function cleanupTestCommunications() {
  console.group('🧹 Cleaning up test Communications');
  
  const Communications = Meteor.Collections?.Communications;
  const testComms = Communications.find({
    $or: [
      { 'subject.reference': 'Patient/test-delete' },
      { 'subject.reference': 'Patient/test-patient' }
    ]
  }).fetch();
  
  console.log(`Found ${testComms.length} test Communications to delete`);
  
  for (const comm of testComms) {
    try {
      await Meteor.callAsync('communications.removeById', { _id: comm._id });
      console.log(`✅ Deleted: ${comm._id}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${comm._id}:`, error.reason);
    }
  }
  
  console.groupEnd();
}

// Export functions
window.testCommunicationDelete = testCommunicationDelete;
window.deleteCommunication = deleteCommunication;
window.cleanupTestCommunications = cleanupTestCommunications;

console.log('🗑️ Communication delete test loaded!');
console.log('   Test deletion: testCommunicationDelete()');
console.log('   Delete specific: deleteCommunication(commId)');
console.log('   Cleanup: cleanupTestCommunications()');
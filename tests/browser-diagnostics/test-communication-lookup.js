// /Volumes/SonicMagic/Code/honeycomb-public-release/test-communication-lookup.js

// Test script to debug Communication lookup issues
// Run this in the browser console

async function testCommunicationLookup() {
  console.group('🔍 Testing Communication Lookup');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  const Communications = Meteor.Collections?.Communications;
  
  if (!ServiceRequests || !Communications) {
    console.error('❌ Collections not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Find all Communications
  console.log('\n1️⃣ All Communications in database:');
  const allComms = Communications.find({}).fetch();
  console.log(`Total Communications: ${allComms.length}`);
  
  // Show the IDs and categories
  allComms.forEach((comm, i) => {
    console.log(`${i + 1}. Communication:`, {
      _id: comm._id,
      id: comm.id,
      hasId: !!comm.id,
      category: comm.category?.[0]?.coding?.[0]?.code,
      status: comm.status
    });
  });
  
  // Step 2: Find approval Communications
  console.log('\n2️⃣ Approval Communications:');
  const approvalComms = Communications.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  console.log(`Found ${approvalComms.length} approval Communications`);
  approvalComms.forEach((comm, i) => {
    console.log(`${i + 1}. Approval Communication:`, {
      _id: comm._id,
      id: comm.id,
      status: comm.status,
      recipient: comm.recipient?.[0]?.reference
    });
  });
  
  // Step 3: Check ServiceRequests that reference Communications
  console.log('\n3️⃣ ServiceRequests with Communication references:');
  const approvalRequests = ServiceRequests.find({
    'category.0.coding.0.code': 'intervention-approval'
  }).fetch();
  
  approvalRequests.forEach((req, i) => {
    console.log(`\n${i + 1}. ServiceRequest ${req._id || req.id}:`);
    
    // Check supportingInfo
    req.supportingInfo?.forEach(si => {
      if (si.reference?.includes('Communication/')) {
        const commId = si.reference.split('/')[1];
        console.log(`   supportingInfo references: ${si.reference}`);
        console.log(`   Extracted ID: ${commId}`);
        
        // Try to find it
        const found = Communications.findOne({
          $or: [
            { _id: commId },
            { id: commId }
          ]
        });
        console.log(`   Communication found: ${found ? 'YES' : 'NO'}`);
        if (found) {
          console.log(`   Found with _id: ${found._id}`);
        }
      }
    });
    
    // Check replaces
    req.replaces?.forEach(r => {
      if (r.reference?.includes('Communication/')) {
        const commId = r.reference.split('/')[1];
        console.log(`   replaces references: ${r.reference}`);
        console.log(`   Extracted ID: ${commId}`);
        
        // Try to find it
        const found = Communications.findOne({
          $or: [
            { _id: commId },
            { id: commId }
          ]
        });
        console.log(`   Communication found: ${found ? 'YES' : 'NO'}`);
        if (found) {
          console.log(`   Found with _id: ${found._id}`);
        }
      }
    });
  });
  
  // Step 4: Test direct removal
  if (approvalComms.length > 0) {
    console.log('\n4️⃣ Testing direct Communication removal:');
    const testComm = approvalComms[0];
    console.log('Test Communication:', {
      _id: testComm._id,
      id: testComm.id
    });
    
    console.log('Try removing with _id:', testComm._id);
    try {
      const result = await Meteor.callAsync('communications.removeById', { _id: testComm._id });
      console.log('✅ Removal successful:', result);
    } catch (error) {
      console.error('❌ Removal failed:', error);
      console.error('Error details:', error.reason || error.message);
    }
  }
  
  console.groupEnd();
}

// Run the test
console.log('🚀 Running Communication lookup test...');
console.log('   To run again, call: testCommunicationLookup()');
testCommunicationLookup();
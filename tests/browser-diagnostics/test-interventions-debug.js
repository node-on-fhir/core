// /Volumes/SonicMagic/Code/honeycomb-public-release/test-interventions-debug.js

// Debug script to check intervention ServiceRequests
// Run this in the browser console

function debugInterventions() {
  console.group('🔍 Debugging Interventions');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  
  if (!ServiceRequests) {
    console.error('❌ ServiceRequests collection not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Show ALL ServiceRequests
  console.log('\n1️⃣ ALL ServiceRequests in collection:');
  const allRequests = ServiceRequests.find({}).fetch();
  console.log(`Total: ${allRequests.length}`);
  
  allRequests.forEach((req, i) => {
    console.log(`\n${i + 1}. ServiceRequest:`, {
      _id: req._id,
      id: req.id,
      status: req.status,
      category: req.category?.[0]?.coding?.[0]?.code || 'NO CATEGORY',
      code: req.code?.text,
      createdAt: req.authoredOn
    });
  });
  
  // Step 2: Separate by type
  const approvalRequests = allRequests.filter(r => 
    r.category?.[0]?.coding?.[0]?.code === 'intervention-approval'
  );
  const interventionRequests = allRequests.filter(r => 
    !r.category || r.category?.[0]?.coding?.[0]?.code !== 'intervention-approval'
  );
  
  console.log(`\n📊 Summary:`);
  console.log(`  Approval requests: ${approvalRequests.length}`);
  console.log(`  Intervention requests: ${interventionRequests.length}`);
  
  // Step 3: Show intervention requests
  console.log('\n2️⃣ INTERVENTION ServiceRequests (non-approval):');
  if (interventionRequests.length === 0) {
    console.warn('⚠️ No intervention ServiceRequests found!');
    console.log('This explains why Active Interventions is empty.');
  } else {
    interventionRequests.forEach((req, i) => {
      console.log(`\n${i + 1}. Intervention:`, {
        _id: req._id,
        status: req.status,
        code: req.code?.text,
        protocol: req.extension?.find(e => e.url.includes('protocol-id'))?.valueString,
        subject: req.subject?.display
      });
    });
  }
  
  // Step 4: Check query results
  console.log('\n3️⃣ Testing Active Interventions query:');
  const activeQuery = {
    resourceType: 'ServiceRequest',
    status: { $in: ['active', 'on-hold'] },
    $or: [
      { 'category': { $exists: false } },
      { 'category.0.coding.0.code': { $ne: 'intervention-approval' } }
    ]
  };
  
  const activeInterventions = ServiceRequests.find(activeQuery).fetch();
  console.log(`Query found ${activeInterventions.length} active interventions`);
  
  console.groupEnd();
}

// Function to manually create a test intervention
async function createTestIntervention() {
  console.group('🧪 Creating Test Intervention');
  
  const testIntervention = {
    id: Random.id(),
    resourceType: 'ServiceRequest',
    status: 'active',
    intent: 'order',
    priority: 'routine',
    code: {
      coding: [{
        system: 'http://honeycomb.ai/intervention-protocols',
        code: 'test-protocol',
        display: 'Test Intervention Protocol'
      }],
      text: 'Test Intervention Protocol'
    },
    subject: {
      reference: 'Patient/test-patient',
      display: 'Test Patient'
    },
    authoredOn: new Date().toISOString(),
    requester: {
      reference: `Practitioner/${Meteor.userId()}`,
      display: Meteor.user()?.username || 'Current User'
    },
    extension: [{
      url: 'http://honeycomb.ai/fhir/StructureDefinition/protocol-id',
      valueString: 'test-protocol'
    }]
  };
  
  try {
    console.log('Creating intervention:', testIntervention);
    const result = await Meteor.callAsync('createServiceRequest', testIntervention);
    console.log('✅ Created intervention:', result);
    
    // Check if it appears in Active Interventions
    setTimeout(() => {
      debugInterventions();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error creating intervention:', error);
  }
  
  console.groupEnd();
}

// Function to check intervention creation in execution page
function checkInterventionCreation() {
  console.group('🔍 Checking Intervention Creation');
  
  // Check Session for current intervention ID
  const currentInterventionId = Session.get('currentInterventionId');
  console.log('Current intervention ID in Session:', currentInterventionId);
  
  if (currentInterventionId) {
    const ServiceRequests = Meteor.Collections?.ServiceRequests;
    const intervention = ServiceRequests?.findOne({
      $or: [
        { _id: currentInterventionId },
        { id: currentInterventionId }
      ]
    });
    
    if (intervention) {
      console.log('✅ Found intervention:', {
        _id: intervention._id,
        id: intervention.id,
        status: intervention.status,
        category: intervention.category,
        code: intervention.code?.text
      });
    } else {
      console.error('❌ Intervention not found in collection!');
    }
  } else {
    console.warn('⚠️ No current intervention ID in Session');
  }
  
  console.groupEnd();
}

// Export functions
window.debugInterventions = debugInterventions;
window.createTestIntervention = createTestIntervention;
window.checkInterventionCreation = checkInterventionCreation;

console.log('🔍 Intervention debug tools loaded!');
console.log('   Debug all: debugInterventions()');
console.log('   Create test: createTestIntervention()');
console.log('   Check creation: checkInterventionCreation()');
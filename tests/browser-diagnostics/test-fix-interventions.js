// /Volumes/SonicMagic/Code/honeycomb-public-release/test-fix-interventions.js

// Script to diagnose and fix intervention visibility issues
// Run this in the browser console

async function diagnoseInterventions() {
  console.group('🔍 Diagnosing Intervention Visibility');
  
  const ServiceRequests = Meteor.Collections?.ServiceRequests;
  if (!ServiceRequests) {
    console.error('ServiceRequests collection not available');
    console.groupEnd();
    return;
  }
  
  // Step 1: Show ALL ServiceRequests
  console.log('\n1️⃣ ALL ServiceRequests:');
  const allRequests = ServiceRequests.find({}).fetch();
  console.log(`Total: ${allRequests.length}`);
  
  // Step 2: Check for interventions without category
  console.log('\n2️⃣ Interventions without category:');
  const noCategoryRequests = allRequests.filter(r => !r.category);
  console.log(`Found ${noCategoryRequests.length} ServiceRequests without category`);
  
  noCategoryRequests.forEach(req => {
    console.log('No-category ServiceRequest:', {
      _id: req._id,
      status: req.status,
      code: req.code?.text,
      resourceType: req.resourceType,
      subject: req.subject?.display
    });
  });
  
  // Step 3: Test the exact query from InterventionsListPage
  console.log('\n3️⃣ Testing Active Interventions query:');
  const activeQuery = {
    resourceType: 'ServiceRequest',
    status: { $in: ['active', 'on-hold'] },
    $and: [
      {
        $or: [
          { 'category': { $exists: false } },
          { 'category.0.coding.0.code': { $ne: 'intervention-approval' } }
        ]
      }
    ]
  };
  
  const activeInterventions = ServiceRequests.find(activeQuery).fetch();
  console.log(`Query found ${activeInterventions.length} active interventions`);
  
  // Step 4: Check current intervention in Session
  const currentInterventionId = Session.get('currentInterventionId');
  if (currentInterventionId) {
    console.log('\n4️⃣ Current intervention from Session:', currentInterventionId);
    const currentIntervention = ServiceRequests.findOne({
      $or: [
        { _id: currentInterventionId },
        { id: currentInterventionId }
      ]
    });
    
    if (currentIntervention) {
      console.log('Found current intervention:', {
        _id: currentIntervention._id,
        status: currentIntervention.status,
        category: currentIntervention.category,
        resourceType: currentIntervention.resourceType
      });
      
      // Check why it might not appear in active
      const reasons = [];
      if (currentIntervention.resourceType !== 'ServiceRequest') {
        reasons.push('resourceType is not ServiceRequest');
      }
      if (!['active', 'on-hold'].includes(currentIntervention.status)) {
        reasons.push(`status is ${currentIntervention.status}, not active/on-hold`);
      }
      if (currentIntervention.category?.[0]?.coding?.[0]?.code === 'intervention-approval') {
        reasons.push('has intervention-approval category');
      }
      
      if (reasons.length > 0) {
        console.warn('❌ Intervention not appearing because:', reasons);
      } else {
        console.log('✅ Intervention should appear in Active Interventions');
      }
    } else {
      console.error('❌ Current intervention not found in collection!');
    }
  }
  
  console.groupEnd();
}

// Function to manually fix an intervention to appear in Active list
async function fixIntervention(interventionId) {
  console.group('🔧 Fixing Intervention');
  
  try {
    // Update the intervention to ensure it appears
    const update = {
      status: 'active',
      resourceType: 'ServiceRequest',
      // Remove category if it exists
      $unset: { category: '' }
    };
    
    console.log('Updating intervention:', interventionId);
    const result = await Meteor.callAsync('updateServiceRequest', interventionId, update);
    console.log('✅ Update result:', result);
    
    // Refresh the page
    console.log('Refreshing page...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

// Function to ensure current intervention is active
async function ensureCurrentInterventionActive() {
  const currentId = Session.get('currentInterventionId');
  if (currentId) {
    console.log('Ensuring current intervention is active:', currentId);
    await fixIntervention(currentId);
  } else {
    console.warn('No current intervention ID in Session');
  }
}

// Export functions
window.diagnoseInterventions = diagnoseInterventions;
window.fixIntervention = fixIntervention;
window.ensureCurrentInterventionActive = ensureCurrentInterventionActive;

console.log('🔧 Intervention fix tools loaded!');
console.log('   Diagnose: diagnoseInterventions()');
console.log('   Fix specific: fixIntervention(interventionId)');
console.log('   Fix current: ensureCurrentInterventionActive()');
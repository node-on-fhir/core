// /Volumes/SonicMagic/Code/honeycomb-public-release/client/debug-interventions.js

// Debug functions for interventions
// These will be automatically available in the browser console

if (Meteor.isClient) {
  window.debugInterventions = function() {
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
    
    // Step 2: Check current intervention in Session
    const currentInterventionId = Session.get('currentInterventionId');
    console.log('\n2️⃣ Current intervention ID in Session:', currentInterventionId);
    
    if (currentInterventionId) {
      const intervention = ServiceRequests.findOne({
        $or: [
          { _id: currentInterventionId },
          { id: currentInterventionId }
        ]
      });
      
      if (intervention) {
        console.log('✅ Found current intervention:', intervention);
      } else {
        console.log('❌ Current intervention not found in collection!');
      }
    }
    
    console.groupEnd();
  };
  
  window.fixInterventionId = async function() {
    console.group('🔧 Fixing Intervention ID Issue');
    
    const currentId = Session.get('currentInterventionId');
    if (!currentId) {
      console.error('No current intervention ID in Session');
      console.groupEnd();
      return;
    }
    
    console.log('Current ID in Session:', currentId);
    
    // Check if this is a custom ID that needs to be mapped to MongoDB _id
    const ServiceRequests = Meteor.Collections?.ServiceRequests;
    if (!ServiceRequests) {
      console.error('ServiceRequests collection not available');
      console.groupEnd();
      return;
    }
    
    // Find by custom id field
    const intervention = ServiceRequests.findOne({ id: currentId });
    if (intervention && intervention._id !== currentId) {
      console.log('Found intervention with different _id:', intervention._id);
      console.log('Updating Session to use MongoDB _id...');
      Session.set('currentInterventionId', intervention._id);
      console.log('✅ Session updated with correct _id');
    } else if (!intervention) {
      console.error('❌ No intervention found with id:', currentId);
    } else {
      console.log('✅ ID is already correct');
    }
    
    console.groupEnd();
  };
  
  console.log('🔍 Intervention debug tools loaded!');
  console.log('   Debug all: debugInterventions()');
  console.log('   Fix ID issue: fixInterventionId()');
}
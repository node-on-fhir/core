// /Volumes/SonicMagic/Code/honeycomb-public-release/test-server-interventions.js

// Client-side script to debug interventions using server methods
// Run this in the browser console

async function debugServerInterventions() {
  console.group('🔍 Server-Side Intervention Debug');
  
  try {
    // Call server method to show all ServiceRequests
    const result = await Meteor.callAsync('debug.showAllServiceRequests');
    console.log('Server debug result:', result);
    
    // Check specific intervention if we have one in Session
    const currentInterventionId = Session.get('currentInterventionId');
    if (currentInterventionId) {
      console.log('\n📍 Checking current intervention:', currentInterventionId);
      const intervention = await Meteor.callAsync('debug.checkInterventionById', currentInterventionId);
      console.log('Current intervention details:', intervention);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

async function createServerTestIntervention() {
  console.group('🧪 Creating Test Intervention on Server');
  
  try {
    const result = await Meteor.callAsync('debug.createTestIntervention');
    console.log('✅ Test intervention created:', result);
    
    // Refresh the page after a moment
    if (result.insertedId) {
      console.log('Refreshing page in 2 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.groupEnd();
}

// Export functions
window.debugServerInterventions = debugServerInterventions;
window.createServerTestIntervention = createServerTestIntervention;

console.log('🔍 Server intervention debug tools loaded!');
console.log('   Debug all: debugServerInterventions()');
console.log('   Create test: createServerTestIntervention()');
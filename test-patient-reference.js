// test-patient-reference.js
// Quick test to debug patient reference issues

// Run this in the browser console to check patient data
if (typeof Patients !== 'undefined' && typeof Session !== 'undefined') {
  console.log('=== Patient Reference Debug ===');
  
  const selectedPatientId = Session.get('selectedPatientId');
  const selectedPatient = Session.get('selectedPatient');
  
  console.log('Session selectedPatientId:', selectedPatientId);
  console.log('Session selectedPatient:', selectedPatient);
  
  if (selectedPatient) {
    console.log('Patient FHIR id:', selectedPatient.id);
    console.log('Patient MongoDB _id:', selectedPatient._id);
    console.log('Patient name:', selectedPatient.name);
  }
  
  // Find test patients
  const testPatients = Patients.find({
    $or: [
      { 'name.0.text': { $regex: 'John.*Doe' } },
      { 'name.0.family': 'Doe' }
    ]
  }).fetch();
  
  console.log(`Found ${testPatients.length} test patients`);
  testPatients.forEach((p, i) => {
    console.log(`Patient ${i + 1}:`, {
      _id: p._id,
      id: p.id,
      name: p.name?.[0]?.text || `${p.name?.[0]?.given?.[0]} ${p.name?.[0]?.family}`,
      identifier: p.identifier?.[0]?.value
    });
  });
  
  // Check document references
  if (typeof DocumentReferences !== 'undefined') {
    const docs = DocumentReferences.find({}).fetch();
    console.log(`\nTotal DocumentReferences: ${docs.length}`);
    
    // Group by patient reference
    const byPatient = {};
    docs.forEach(doc => {
      const ref = doc.subject?.reference || 'No reference';
      byPatient[ref] = (byPatient[ref] || 0) + 1;
    });
    
    console.log('Documents by patient reference:');
    Object.entries(byPatient).forEach(([ref, count]) => {
      console.log(`  ${ref}: ${count} documents`);
    });
  }
} else {
  console.log('Patients or Session not available');
}
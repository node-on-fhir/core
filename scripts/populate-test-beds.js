#!/usr/bin/env node

// Script to populate test bed data
// Run this from the Meteor shell: meteor shell < scripts/populate-test-beds.js

// First, let's check if we have any beds
const bedCount = Beds.find({}).count();
console.log(`Current bed count: ${bedCount}`);

if (bedCount === 0) {
  console.log('No beds found. Creating sample beds...');
  
  // Create 16 beds for the medical home
  const sampleBeds = [];
  for (let i = 1; i <= 16; i++) {
    const bedId = `B${i.toString().padStart(2, '0')}`;
    const roomNumber = `${Math.floor((i-1)/2 + 101)}`;
    const ward = i <= 8 ? 'Medical' : 'Rehab';
    const floor = i <= 8 ? '1' : '2';
    
    let status = 'available';
    if (i <= 14) {
      status = 'occupied';
    } else if (i === 16) {
      status = 'cleaning';
    }
    
    const bed = {
      bedId: bedId,
      roomNumber: roomNumber,
      ward: ward,
      floor: floor,
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: status,
      bedType: 'standard',
      features: ['adjustable', 'call button'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add extra features for some beds
    if (i % 3 === 0) {
      bed.features.push('oxygen port');
    }
    if (i % 5 === 0) {
      bed.features.push('cardiac monitor');
    }
    
    sampleBeds.push(bed);
  }
  
  // Insert all beds
  sampleBeds.forEach(bed => {
    const bedId = Beds.insert(bed);
    console.log(`Created bed ${bed.bedId} with ID: ${bedId}`);
  });
  
  console.log(`Successfully created ${sampleBeds.length} beds`);
  
  // Now let's assign some patients to the occupied beds
  const occupiedBeds = Beds.find({ status: 'occupied' }).fetch();
  const patients = Patients.find({}, { limit: occupiedBeds.length }).fetch();
  
  if (patients.length > 0) {
    console.log(`\nAssigning ${Math.min(patients.length, occupiedBeds.length)} patients to beds...`);
    
    const physicians = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Maria Rodriguez', 'Dr. David Thompson'];
    const nurses = ['RN Jessica Smith', 'RN Michael Brown', 'RN Patricia Davis', 'RN Robert Johnson'];
    
    occupiedBeds.forEach((bed, index) => {
      if (index < patients.length) {
        const patient = patients[index];
        const patientName = patient.name?.[0]?.text || 
                           `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim() ||
                           `Patient ${index + 1}`;
        
        const update = {
          patientId: patient._id,
          patientName: patientName,
          patientMRN: patient.identifier?.[0]?.value || `MRN-${patient._id.substring(0, 6)}`,
          admissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          expectedDischargeDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          attendingPhysician: physicians[Math.floor(Math.random() * physicians.length)],
          primaryNurse: nurses[Math.floor(Math.random() * nurses.length)],
          updatedAt: new Date()
        };
        
        Beds.update(bed._id, { $set: update });
        console.log(`Assigned ${patientName} to bed ${bed.bedId}`);
      }
    });
    
    console.log('Patient assignment complete!');
  } else {
    console.log('\nNo patients found in the database. Beds created but not assigned.');
  }
} else {
  console.log(`Found ${bedCount} existing beds. To reset, run: Beds.remove({}) first.`);
}

// Display current bed statistics
const stats = {
  total: Beds.find({}).count(),
  occupied: Beds.find({ status: 'occupied' }).count(),
  available: Beds.find({ status: 'available' }).count(),
  cleaning: Beds.find({ status: 'cleaning' }).count(),
  maintenance: Beds.find({ status: 'maintenance' }).count()
};

console.log('\nBed Statistics:');
console.log(`Total beds: ${stats.total}`);
console.log(`Occupied: ${stats.occupied}`);
console.log(`Available: ${stats.available}`);
console.log(`Cleaning: ${stats.cleaning}`);
console.log(`Maintenance: ${stats.maintenance}`);
console.log(`Occupancy rate: ${((stats.occupied / stats.total) * 100).toFixed(1)}%`);
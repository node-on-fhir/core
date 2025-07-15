// /packages/pacio-core/server/sampleData/initializeBeds.js

import { Meteor } from 'meteor/meteor';
import { Beds } from '../../lib/collections/BedsCollection';

export async function initializeSampleBeds() {
  try {
    // Check if beds already exist
    const existingBeds = await Beds.find({}).countDocuments();
    
    if (existingBeds > 0) {
      console.log(`Beds collection already has ${existingBeds} beds. Skipping initialization.`);
      return;
    }

  console.log('Initializing sample bed data...');

  const sampleBeds = [
    // Occupied beds (14 out of 16)
    {
      bedId: 'B01',
      roomNumber: '101',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port']
    },
    {
      bedId: 'B02',
      roomNumber: '102',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port']
    },
    {
      bedId: 'B03',
      roomNumber: '103',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port', 'cardiac monitor']
    },
    {
      bedId: 'B04',
      roomNumber: '104',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B05',
      roomNumber: '105',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'bariatric',
      features: ['adjustable', 'call button', 'reinforced frame']
    },
    {
      bedId: 'B06',
      roomNumber: '106',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B07',
      roomNumber: '107',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port']
    },
    {
      bedId: 'B08',
      roomNumber: '108',
      ward: 'Medical',
      floor: '1',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B09',
      roomNumber: '201',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'trapeze bar']
    },
    {
      bedId: 'B10',
      roomNumber: '202',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'trapeze bar']
    },
    {
      bedId: 'B11',
      roomNumber: '203',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B12',
      roomNumber: '204',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port']
    },
    {
      bedId: 'B13',
      roomNumber: '205',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B14',
      roomNumber: '206',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'occupied',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    // Available beds
    {
      bedId: 'B15',
      roomNumber: '207',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'available',
      bedType: 'standard',
      features: ['adjustable', 'call button']
    },
    {
      bedId: 'B16',
      roomNumber: '208',
      ward: 'Rehab',
      floor: '2',
      building: 'Main',
      facilityId: 'mh-001',
      facilityName: "Rainbow's End Medical Home",
      status: 'cleaning',
      bedType: 'standard',
      features: ['adjustable', 'call button', 'oxygen port']
    }
  ];

  // Insert all beds
  for (const bed of sampleBeds) {
    try {
      await Beds.insert({
        ...bed,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created bed ${bed.bedId}`);
    } catch (error) {
      console.error(`Error creating bed ${bed.bedId}:`, error);
    }
  }

  console.log(`Successfully initialized ${sampleBeds.length} sample beds`);
  } catch (error) {
    console.error('Error initializing sample beds:', error);
  }
}

// Method to assign sample patients to occupied beds
export async function assignSamplePatientsToBeds() {
  const Patients = Meteor.Collections?.Patients;
  
  if (!Patients) {
    console.warn('Patients collection not available. Skipping patient assignment.');
    return;
  }

  // Get all occupied beds without patient assignments
  const occupiedBeds = await Beds.find({ 
    status: 'occupied',
    patientId: { $exists: false }
  }).fetch();

  if (occupiedBeds.length === 0) {
    console.log('No unassigned occupied beds found.');
    return;
  }

  // Get available patients
  const patients = await Patients.find({}, { limit: occupiedBeds.length }).fetch();
  
  if (patients.length === 0) {
    console.warn('No patients found in the database.');
    return;
  }

  console.log(`Assigning ${Math.min(patients.length, occupiedBeds.length)} patients to beds...`);

  // Assign patients to beds
  for (let i = 0; i < Math.min(patients.length, occupiedBeds.length); i++) {
    const bed = occupiedBeds[i];
    const patient = patients[i];
    
    const patientName = patient.name?.[0]?.text || 
                       `${patient.name?.[0]?.given?.[0] || ''} ${patient.name?.[0]?.family || ''}`.trim() ||
                       'Unknown Patient';
    
    const patientMRN = patient.identifier?.[0]?.value || `MRN-${patient._id.substring(0, 6)}`;
    
    const physicians = ['Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Maria Rodriguez', 'Dr. David Thompson'];
    const nurses = ['RN Jessica Smith', 'RN Michael Brown', 'RN Patricia Davis', 'RN Robert Johnson'];
    
    try {
      // Generate stable mock data for this patient
      const vitals = {
        bp: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)}`,
        hr: 60 + Math.floor(Math.random() * 40),
        temp: (97.5 + Math.random() * 2).toFixed(1),
        o2: 94 + Math.floor(Math.random() * 6),
        rr: 12 + Math.floor(Math.random() * 8),
        lastChecked: new Date(Date.now() - Math.floor(Math.random() * 60) * 60 * 1000)
      };
      
      const medications = {
        nextDue: new Date(Date.now() + Math.floor(Math.random() * 240) * 60 * 1000),
        count: Math.floor(Math.random() * 5) + 2
      };
      
      const labs = {
        pending: Math.floor(Math.random() * 3),
        critical: Math.random() > 0.8 ? 1 : 0
      };
      
      const tasks = {
        pending: Math.floor(Math.random() * 5),
        overdue: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0
      };
      
      await Beds.update(
        { _id: bed._id },
        {
          $set: {
            patientId: patient._id,
            patientName: patientName,
            patientMRN: patientMRN,
            patientAge: patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            admissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            expectedDischargeDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within next 7 days
            attendingPhysician: physicians[Math.floor(Math.random() * physicians.length)],
            primaryCondition: get(patient, 'condition[0].code.text', 'General Care'),
            acuityLevel: 'Stable',
            vitals: vitals,
            medications: medications,
            labs: labs,
            tasks: tasks,
            fallRisk: Math.random() > 0.6,
            isolation: Math.random() > 0.85,
            dietRestrictions: Math.random() > 0.5 ? ['NPO', 'Low Sodium', 'Diabetic', 'Pureed'][Math.floor(Math.random() * 4)] : null,
            primaryNurse: nurses[Math.floor(Math.random() * nurses.length)],
            updatedAt: new Date()
          }
        }
      );
      console.log(`Assigned patient ${patientName} to bed ${bed.bedId}`);
    } catch (error) {
      console.error(`Error assigning patient to bed ${bed.bedId}:`, error);
    }
  }
  
  console.log('Patient assignment complete.');
}
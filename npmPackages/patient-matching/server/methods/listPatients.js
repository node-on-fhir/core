// packages/patient-matching/server/methods/listPatients.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

const log = (Meteor.Logger ? Meteor.Logger.for('listPatients') : console);

Meteor.methods({
  async 'PatientMatching.listPatientIds'() {
    // Only allow logged in users
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }
    
    const Patients = Meteor.Collections?.Patients;
    if (!Patients) {
      throw new Meteor.Error(500, 'Patients collection not available');
    }
    
    try {
      // Get a few patient IDs for testing
      const patients = await Patients.find({}, {
        limit: 10,
        fields: { 
          _id: 1, 
          id: 1, 
          'name': 1,
          'birthDate': 1,
          'identifier': 1
        }
      }).fetchAsync();
      
      console.log(`Found ${patients.length} patients for listing`); // phi-audit: ok
      
      // Return simplified patient info
      return patients.map(patient => ({
        id: patient.id || patient._id,
        _id: patient._id,
        name: patient.name?.[0]?.text || 
              `${patient.name?.[0]?.given?.join(' ') || ''} ${patient.name?.[0]?.family || ''}`.trim() || 
              'Unknown',
        birthDate: patient.birthDate,
        identifier: patient.identifier?.[0]?.value
      }));
    } catch (error) {
      log.error('Error listing patients', { error: error?.message });
      throw new Meteor.Error(500, 'Failed to list patients');
    }
  }
});
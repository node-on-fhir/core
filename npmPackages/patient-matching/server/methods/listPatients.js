// packages/patient-matching/server/methods/listPatients.js
//
// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Legacy 'PatientMatching.listPatientIds'
// renamed to 'patientMatching.listPatientIds' + alias. The `if (!this.userId)
// throw` guard is deleted in favor of requireAuth (default true). phi: true —
// returns patient names/DOB/identifiers.
import { Meteor } from 'meteor/meteor';

Meteor.ServerMethods.define('patientMatching.listPatientIds', {
  description: 'List a small sample of patient ids/names/DOB for match-testing UI',
  aliases: ['PatientMatching.listPatientIds'],
  phi: true
}, async function(params, context){
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

    context.log.info('Found patients for listing', { count: patients.length });

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
    context.log.error('Error listing patients', { error: error?.message });
    throw new Meteor.Error(500, 'Failed to list patients');
  }
});

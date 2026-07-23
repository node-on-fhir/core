// /imports/api/practitionerRoles/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { PractitionerRoles } from '../../lib/schemas/SimpleSchemas/PractitionerRoles';

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitionerRoles.create', {
  description: 'Create a new FHIR PractitionerRole from whitelisted fields',
  schemaObject: { type: 'object' }   // arbitrary PractitionerRole payload; whitelisted field-by-field below
}, async function(params, context) {
  const practitionerRoleData = params;

  // Clean up the practitioner role data
  const cleanPractitionerRole = {
    resourceType: 'PractitionerRole',
    id: practitionerRoleData.id || Random.id(),
    active: practitionerRoleData.active !== undefined ? practitionerRoleData.active : true
  };

  // Set _id to match id (Meteor string ID)
  cleanPractitionerRole._id = cleanPractitionerRole.id;
  context.log.info('[practitionerRoles.create] Using Meteor string ID', { id: cleanPractitionerRole._id });

  // Handle practitioner reference
  if (practitionerRoleData.practitioner) {
    cleanPractitionerRole.practitioner = {
      reference: get(practitionerRoleData, 'practitioner.reference', ''),
      display: get(practitionerRoleData, 'practitioner.display', '')
    };
  }

  // Handle organization reference
  if (practitionerRoleData.organization) {
    cleanPractitionerRole.organization = {
      reference: get(practitionerRoleData, 'organization.reference', ''),
      display: get(practitionerRoleData, 'organization.display', '')
    };
  }

  // Handle code array (roles)
  if (practitionerRoleData.code && practitionerRoleData.code.length > 0) {
    cleanPractitionerRole.code = practitionerRoleData.code.map(c => ({
      coding: get(c, 'coding', []),
      text: get(c, 'text', '')
    }));
  } else if (practitionerRoleData.roleCode) {
    // Simple role code input
    cleanPractitionerRole.code = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/practitioner-role',
        code: practitionerRoleData.roleCode,
        display: practitionerRoleData.roleDisplay || practitionerRoleData.roleCode
      }],
      text: practitionerRoleData.roleDisplay || practitionerRoleData.roleCode
    }];
  }

  // Handle specialty array
  if (practitionerRoleData.specialty && practitionerRoleData.specialty.length > 0) {
    cleanPractitionerRole.specialty = practitionerRoleData.specialty.map(s => ({
      coding: get(s, 'coding', []),
      text: get(s, 'text', '')
    }));
  } else if (practitionerRoleData.specialtyCode) {
    // Simple specialty code input
    cleanPractitionerRole.specialty = [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: practitionerRoleData.specialtyCode,
        display: practitionerRoleData.specialtyDisplay || practitionerRoleData.specialtyCode
      }],
      text: practitionerRoleData.specialtyDisplay || practitionerRoleData.specialtyCode
    }];
  }

  // Handle location array
  if (practitionerRoleData.location && practitionerRoleData.location.length > 0) {
    cleanPractitionerRole.location = practitionerRoleData.location.map(l => ({
      reference: get(l, 'reference', ''),
      display: get(l, 'display', '')
    }));
  }

  // Handle healthcareService array
  if (practitionerRoleData.healthcareService && practitionerRoleData.healthcareService.length > 0) {
    cleanPractitionerRole.healthcareService = practitionerRoleData.healthcareService.map(h => ({
      reference: get(h, 'reference', ''),
      display: get(h, 'display', '')
    }));
  }

  // Handle period
  if (practitionerRoleData.period) {
    cleanPractitionerRole.period = {
      start: get(practitionerRoleData, 'period.start', ''),
      end: get(practitionerRoleData, 'period.end', '')
    };
  }

  // Handle telecom array
  if (practitionerRoleData.telecom && practitionerRoleData.telecom.length > 0) {
    cleanPractitionerRole.telecom = practitionerRoleData.telecom.filter(t => t.value).map(t => ({
      system: t.system || 'phone',
      value: t.value,
      use: t.use || 'work'
    }));
  }

  // Handle identifier array
  if (practitionerRoleData.identifier && practitionerRoleData.identifier.length > 0) {
    cleanPractitionerRole.identifier = practitionerRoleData.identifier.map(id => ({
      use: id.use || 'official',
      value: id.value || '',
      system: id.system || ''
    })).filter(id => id.value);
  }

  // Handle availabilityExceptions
  if (practitionerRoleData.availabilityExceptions) {
    cleanPractitionerRole.availabilityExceptions = practitionerRoleData.availabilityExceptions;
  }

  try {
    context.log.info('[practitionerRoles.create] Inserting practitioner role', { practitionerRole: cleanPractitionerRole });
    const result = await PractitionerRoles.insertAsync(cleanPractitionerRole);
    context.log.info('[practitionerRoles.create] Created practitioner role', { id: result });
    return result;
  } catch (error) {
    context.log.error('[practitionerRoles.create] Error', { message: error.message, details: error.details });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitionerRoles.update', {
  description: 'Update an existing PractitionerRole with whitelisted fields',
  positionalParams: ['practitionerRoleId', 'practitionerRoleData'],
  schemaObject: {
    type: 'object',
    properties: { practitionerRoleId: { type: 'string' }, practitionerRoleData: { type: 'object' } },
    required: ['practitionerRoleId', 'practitionerRoleData']
  }
}, async function(params, context) {
  const practitionerRoleId = params.practitionerRoleId;
  const practitionerRoleData = params.practitionerRoleData;

  // Build clean update object with proper FHIR structure (same as create)
  const cleanPractitionerRole = {
    active: practitionerRoleData.active !== undefined ? practitionerRoleData.active : true
  };

  // Handle practitioner reference
  if (practitionerRoleData.practitioner) {
    cleanPractitionerRole.practitioner = {
      reference: get(practitionerRoleData, 'practitioner.reference', ''),
      display: get(practitionerRoleData, 'practitioner.display', '')
    };
  }

  // Handle organization reference
  if (practitionerRoleData.organization) {
    cleanPractitionerRole.organization = {
      reference: get(practitionerRoleData, 'organization.reference', ''),
      display: get(practitionerRoleData, 'organization.display', '')
    };
  }

  // Handle code array (roles) - transform roleCode/roleDisplay to proper FHIR structure
  if (practitionerRoleData.code && practitionerRoleData.code.length > 0) {
    cleanPractitionerRole.code = practitionerRoleData.code.map(c => ({
      coding: get(c, 'coding', []),
      text: get(c, 'text', '')
    }));
  } else if (practitionerRoleData.roleCode || practitionerRoleData.roleDisplay) {
    // Simple role code input - convert to FHIR CodeableConcept
    cleanPractitionerRole.code = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/practitioner-role',
        code: practitionerRoleData.roleCode || '',
        display: practitionerRoleData.roleDisplay || practitionerRoleData.roleCode || ''
      }],
      text: practitionerRoleData.roleDisplay || practitionerRoleData.roleCode || ''
    }];
  }

  // Handle specialty array
  if (practitionerRoleData.specialty && practitionerRoleData.specialty.length > 0) {
    cleanPractitionerRole.specialty = practitionerRoleData.specialty.map(s => ({
      coding: get(s, 'coding', []),
      text: get(s, 'text', '')
    }));
  } else if (practitionerRoleData.specialtyCode || practitionerRoleData.specialtyDisplay) {
    // Simple specialty code input
    cleanPractitionerRole.specialty = [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: practitionerRoleData.specialtyCode || '',
        display: practitionerRoleData.specialtyDisplay || practitionerRoleData.specialtyCode || ''
      }],
      text: practitionerRoleData.specialtyDisplay || practitionerRoleData.specialtyCode || ''
    }];
  }

  // Handle telecom array
  if (practitionerRoleData.telecom && practitionerRoleData.telecom.length > 0) {
    cleanPractitionerRole.telecom = practitionerRoleData.telecom.filter(t => t.value).map(t => ({
      system: t.system || 'phone',
      value: t.value,
      use: t.use || 'work'
    }));
  }

  // Handle period
  if (practitionerRoleData.period) {
    cleanPractitionerRole.period = {
      start: get(practitionerRoleData, 'period.start', ''),
      end: get(practitionerRoleData, 'period.end', '')
    };
  }

  // Handle availabilityExceptions
  if (practitionerRoleData.availabilityExceptions) {
    cleanPractitionerRole.availabilityExceptions = practitionerRoleData.availabilityExceptions;
  }

  try {
    context.log.info('[practitionerRoles.update] Updating practitioner role', { id: practitionerRoleId, practitionerRole: cleanPractitionerRole });
    const result = await PractitionerRoles.updateAsync(
      { _id: practitionerRoleId },
      { $set: cleanPractitionerRole }
    );
    context.log.info('[practitionerRoles.update] Updated practitioner role', { result: result });
    return result;
  } catch (error) {
    context.log.error('[practitionerRoles.update] Error', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitionerRoles.remove', {
  description: 'Remove a PractitionerRole by MongoDB _id',
  positionalParams: ['practitionerRoleId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerRoleId: { type: 'string' } },
    required: ['practitionerRoleId']
  }
}, async function(params, context) {
  const practitionerRoleId = params.practitionerRoleId;

  try {
    const result = await PractitionerRoles.removeAsync({ _id: practitionerRoleId });
    context.log.info('[practitionerRoles.remove] Removed practitioner role', { result: result });
    return result;
  } catch (error) {
    context.log.error('[practitionerRoles.remove] Error', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('practitionerRoles.findOne', {
  description: 'Fetch a single PractitionerRole by MongoDB _id',
  positionalParams: ['practitionerRoleId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerRoleId: { type: 'string' } },
    required: ['practitionerRoleId']
  }
}, async function(params, context) {
  const practitionerRoleId = params.practitionerRoleId;

  try {
    const practitionerRole = await PractitionerRoles.findOneAsync({ _id: practitionerRoleId });
    return practitionerRole;
  } catch (error) {
    context.log.error('[practitionerRoles.findOne] Error', { message: error.message });
    throw new Meteor.Error('find-failed', error.message);
  }
});

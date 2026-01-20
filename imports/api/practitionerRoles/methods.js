// /imports/api/practitionerRoles/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { PractitionerRoles } from '../../lib/schemas/SimpleSchemas/PractitionerRoles';

Meteor.methods({
  async 'practitionerRoles.create'(practitionerRoleData) {
    check(practitionerRoleData, Object);

    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create practitioner roles');
    }

    // Clean up the practitioner role data
    const cleanPractitionerRole = {
      resourceType: 'PractitionerRole',
      id: practitionerRoleData.id || Random.id(),
      active: practitionerRoleData.active !== undefined ? practitionerRoleData.active : true
    };

    // Set _id to match id (Meteor string ID)
    cleanPractitionerRole._id = cleanPractitionerRole.id;
    console.log('[practitionerRoles.create] Using Meteor string ID:', cleanPractitionerRole._id);

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
      console.log('[practitionerRoles.create] Inserting practitioner role:', JSON.stringify(cleanPractitionerRole, null, 2));
      const result = await PractitionerRoles.insertAsync(cleanPractitionerRole);
      console.log('[practitionerRoles.create] Created practitioner role with ID:', result);
      return result;
    } catch (error) {
      console.error('[practitionerRoles.create] Error:', error);
      console.error('[practitionerRoles.create] Error details:', error.details);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  async 'practitionerRoles.update'(practitionerRoleId, practitionerRoleData) {
    check(practitionerRoleId, String);
    check(practitionerRoleData, Object);

    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update practitioner roles');
    }

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
      console.log('[practitionerRoles.update] Updating practitioner role:', practitionerRoleId, JSON.stringify(cleanPractitionerRole, null, 2));
      const result = await PractitionerRoles.updateAsync(
        { _id: practitionerRoleId },
        { $set: cleanPractitionerRole }
      );
      console.log('[practitionerRoles.update] Updated practitioner role:', result);
      return result;
    } catch (error) {
      console.error('[practitionerRoles.update] Error:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  async 'practitionerRoles.remove'(practitionerRoleId) {
    check(practitionerRoleId, String);

    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove practitioner roles');
    }

    try {
      const result = await PractitionerRoles.removeAsync({ _id: practitionerRoleId });
      console.log('[practitionerRoles.remove] Removed practitioner role:', result);
      return result;
    } catch (error) {
      console.error('[practitionerRoles.remove] Error:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },

  async 'practitionerRoles.findOne'(practitionerRoleId) {
    check(practitionerRoleId, String);

    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view practitioner roles');
    }

    try {
      const practitionerRole = await PractitionerRoles.findOneAsync({ _id: practitionerRoleId });
      return practitionerRole;
    } catch (error) {
      console.error('[practitionerRoles.findOne] Error:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});

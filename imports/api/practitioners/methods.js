// /imports/api/practitioners/methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';

Meteor.methods({
  async 'practitioners.create'(practitionerData) {
    check(practitionerData, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create practitioners');
    }
    
    // Clean up the practitioner data
    const cleanPractitioner = {
      resourceType: 'Practitioner',
      id: practitionerData.id || Random.id(),
      active: practitionerData.active !== undefined ? practitionerData.active : true
    };
    
    // Set _id to match id (Meteor string ID)
    cleanPractitioner._id = cleanPractitioner.id;
    console.log('[practitioners.create] Using Meteor string ID:', cleanPractitioner._id);
    
    // Handle name - ensure it's an array with at least one entry
    if (practitionerData.name && practitionerData.name.length > 0) {
      cleanPractitioner.name = practitionerData.name.map(n => ({
        use: n.use || 'official',
        text: n.text || '',
        family: n.family || '',
        given: Array.isArray(n.given) ? n.given : [n.given || ''],
        prefix: Array.isArray(n.prefix) ? n.prefix : n.prefix ? [n.prefix] : [],
        suffix: Array.isArray(n.suffix) ? n.suffix : n.suffix ? [n.suffix] : []
      }));
    } else {
      throw new Meteor.Error('invalid-practitioner', 'Practitioner must have a name');
    }
    
    // Handle single value fields
    if (practitionerData.gender) cleanPractitioner.gender = practitionerData.gender;
    if (practitionerData.birthDate) cleanPractitioner.birthDate = practitionerData.birthDate;
    
    // Handle telecom array
    if (practitionerData.telecom && practitionerData.telecom.length > 0) {
      cleanPractitioner.telecom = practitionerData.telecom.filter(t => t.value).map(t => ({
        system: t.system || 'phone',
        value: t.value,
        use: t.use || 'work'
      }));
    }
    
    // Handle address array
    if (practitionerData.address && practitionerData.address.length > 0) {
      cleanPractitioner.address = practitionerData.address.map(a => ({
        use: a.use || 'work',
        type: a.type || 'both',
        line: Array.isArray(a.line) ? a.line.filter(l => l) : a.line ? [a.line] : [],
        city: a.city || '',
        state: a.state || '',
        postalCode: a.postalCode || '',
        country: a.country || ''
      }));
    }
    
    // Handle identifier array (NPI, etc.)
    if (practitionerData.identifier && practitionerData.identifier.length > 0) {
      cleanPractitioner.identifier = practitionerData.identifier.map(id => ({
        use: id.use || 'official',
        value: id.value || '',
        system: id.system || 'http://hl7.org/fhir/sid/us-npi',
        type: id.type
      })).filter(id => id.value);
    }
    
    // Handle qualification
    if (practitionerData.qualification && practitionerData.qualification.length > 0) {
      cleanPractitioner.qualification = practitionerData.qualification.filter(q => 
        get(q, 'code.coding[0].code') || get(q, 'code.text')
      );
    }
    
    // Handle communication
    if (practitionerData.communication && practitionerData.communication.length > 0) {
      cleanPractitioner.communication = practitionerData.communication;
    }
    
    // Handle practitionerRole (for specialty)
    if (practitionerData.practitionerRole && practitionerData.practitionerRole.length > 0) {
      cleanPractitioner.practitionerRole = practitionerData.practitionerRole;
    }
    
    // Validate required fields
    if (!get(cleanPractitioner, 'name[0].family') || !get(cleanPractitioner, 'name[0].given[0]')) {
      throw new Meteor.Error('invalid-practitioner', 'Practitioner must have a name');
    }
    
    try {
      console.log('[practitioners.create] Inserting practitioner:', JSON.stringify(cleanPractitioner, null, 2));
      const result = await Practitioners.insertAsync(cleanPractitioner);
      console.log('[practitioners.create] Created practitioner with ID:', result);
      return result;
    } catch (error) {
      console.error('[practitioners.create] Error:', error);
      console.error('[practitioners.create] Error details:', error.details);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },
  
  async 'practitioners.update'(practitionerId, practitionerData) {
    check(practitionerId, String);
    check(practitionerData, Object);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update practitioners');
    }
    
    // Clean the data similar to create
    const cleanPractitioner = { ...practitionerData };
    
    // Remove _id from update data to prevent conflicts
    delete cleanPractitioner._id;
    
    try {
      console.log('[practitioners.update] Updating practitioner:', practitionerId, cleanPractitioner);
      const result = await Practitioners.updateAsync(
        { $or: [{ id: practitionerId }, { _id: practitionerId }] },
        { $set: cleanPractitioner }
      );
      console.log('[practitioners.update] Updated practitioner:', result);
      return result;
    } catch (error) {
      console.error('[practitioners.update] Error:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },
  
  async 'practitioners.remove'(practitionerId) {
    check(practitionerId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove practitioners');
    }
    
    // TODO: Add role-based access control (RBAC) here in the future
    // For now, only authentication is required
    // Example future implementation:
    // if (!Roles.userIsInRole(this.userId, ['admin', 'practitioner-manager'])) {
    //   throw new Meteor.Error('not-authorized', 'User does not have permission to delete practitioners');
    // }
    
    try {
      const result = await Practitioners.removeAsync({
        $or: [
          { id: practitionerId },
          { _id: practitionerId }
        ]
      });
      console.log('[practitioners.remove] Removed practitioner:', result);
      return result;
    } catch (error) {
      console.error('[practitioners.remove] Error:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  },
  
  async 'practitioners.findOne'(practitionerId) {
    check(practitionerId, String);
    
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view practitioners');
    }
    
    try {
      const practitioner = await Practitioners.findOneAsync({
        $or: [
          { id: practitionerId },
          { _id: practitionerId }
        ]
      });
      return practitioner;
    } catch (error) {
      console.error('[practitioners.findOne] Error:', error);
      throw new Meteor.Error('find-failed', error.message);
    }
  }
});
// /imports/api/organizations/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';

Meteor.methods({
  async 'organizations.create'(organizationData) {
    check(organizationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create organizations');
    }

    console.log('=== organizations.create called ===');
    console.log('User ID:', this.userId);
    console.log('Organization data received:', JSON.stringify(organizationData, null, 2));

    // Generate FHIR id if not provided
    const fhirId = organizationData.id || Random.id();

    // Add metadata - set _id to match id for consistent lookups
    const organization = {
      ...organizationData,
      _id: fhirId,  // Set _id explicitly to match FHIR id
      id: fhirId,
      resourceType: 'Organization',
      meta: {
        lastUpdated: new Date(),
        versionId: '1'
      }
    };

    console.log('Organization to insert:', JSON.stringify(organization, null, 2));

    // Insert and return the new organization
    const organizationId = await Organizations._collection.insertAsync(organization);
    console.log('Successfully inserted organization with _id:', organizationId);

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Organization created', {
        userId: this.userId,
        organizationId: organizationId,
        fhirId: fhirId,
        timestamp: new Date()
      });
    }

    return organizationId;
  },

  async 'organizations.update'(organizationId, organizationData) {
    check(organizationId, String);
    check(organizationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update organizations');
    }

    // Check if organization exists - try _id first, then id
    let existingOrganization = await Organizations.findOneAsync({ _id: organizationId });
    if (!existingOrganization) {
      existingOrganization = await Organizations.findOneAsync({ id: organizationId });
    }
    if (!existingOrganization) {
      throw new Meteor.Error('not-found', 'Organization not found');
    }

    // Update metadata
    const updatedOrganization = {
      ...organizationData,
      _id: existingOrganization._id,  // Use the actual _id from the found organization
      id: existingOrganization.id,    // Preserve the FHIR id
      resourceType: 'Organization',
      meta: {
        ...get(organizationData, 'meta', {}),
        lastUpdated: new Date(),
        versionId: String(parseInt(get(existingOrganization, 'meta.versionId', '0')) + 1)
      }
    };

    // Update the organization using the actual _id
    const result = await Organizations._collection.updateAsync(
      { _id: existingOrganization._id },
      { $set: updatedOrganization }
    );

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Organization updated', {
        userId: this.userId,
        organizationId: organizationId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'organizations.remove'(organizationId) {
    check(organizationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to remove organizations');
    }

    // Check if organization exists - try _id first, then id
    let existingOrganization = await Organizations.findOneAsync({ _id: organizationId });
    if (!existingOrganization) {
      existingOrganization = await Organizations.findOneAsync({ id: organizationId });
    }
    if (!existingOrganization) {
      throw new Meteor.Error('not-found', 'Organization not found');
    }

    // Remove the organization using the actual _id
    const result = await Organizations._collection.removeAsync({ _id: existingOrganization._id });

    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Organization removed', {
        userId: this.userId,
        organizationId: organizationId,
        timestamp: new Date()
      });
    }

    return result;
  },

  async 'organizations.get'(organizationId) {
    check(organizationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to view organizations');
    }

    console.log('=== organizations.get called with organizationId:', organizationId);

    // Try to find by _id first, then by id
    let organization = await Organizations.findOneAsync({ _id: organizationId });

    if (!organization) {
      console.log('Not found by _id, trying by FHIR id...');
      // Try finding by FHIR id
      organization = await Organizations.findOneAsync({ id: organizationId });
    }

    if (!organization) {
      console.log('Organization not found with _id or id:', organizationId);
      // Let's also log what organizations exist to help debug
      const allOrganizations = await Organizations.find({}, { limit: 5 }).fetchAsync();
      console.log('Sample organizations in DB:', allOrganizations.map(o => ({ _id: o._id, id: o.id })));
      throw new Meteor.Error('not-found', 'Organization not found');
    }

    console.log('Found organization:', { _id: organization._id, id: organization.id });
    return organization;
  }
});

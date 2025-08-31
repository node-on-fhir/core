// /imports/api/serviceRequests/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/ServiceRequests';

// Get the correct ServiceRequests collection reference
function getServiceRequests() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.ServiceRequests || global.ServiceRequests;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.ServiceRequests;
  }
}

Meteor.methods({
  async 'createServiceRequest'(serviceRequestData) {
    check(serviceRequestData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create service requests');
    }
    
    // Add metadata
    const now = new Date();
    const serviceRequest = {
      ...serviceRequestData,
      resourceType: 'ServiceRequest',
      status: serviceRequestData.status || 'active',
      intent: serviceRequestData.intent || 'order',
      priority: serviceRequestData.priority || 'routine',
      authoredOn: serviceRequestData.authoredOn || now.toISOString(),
      meta: {
        lastUpdated: now,
        versionId: '1'
      }
    };
    
    // Check if this is an intervention approval request and set performer from settings
    if (Meteor.isServer && 
        serviceRequest.category?.[0]?.coding?.[0]?.code === 'intervention-approval') {
      const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer', {
        reference: 'Practitioner/chief-medical-officer',
        display: 'Chief Medical Officer'
      });
      console.log('Setting Chief Medical Officer from private settings:', chiefMedicalOfficer);
      serviceRequest.performer = [chiefMedicalOfficer];
    }
    
    // Insert and return the new service request
    const ServiceRequests = getServiceRequests();
    const serviceRequestId = await ServiceRequests.insertAsync(serviceRequest);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ServiceRequest created', {
        userId: this.userId,
        serviceRequestId: serviceRequestId,
        timestamp: new Date()
      });
    }
    
    return serviceRequestId;
  },

  async 'updateServiceRequest'(_id, update) {
    check(_id, String);
    check(update, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update service requests');
    }
    
    // Get current service request to increment version
    const ServiceRequests = getServiceRequests();
    
    console.log('updateServiceRequest - looking for ID:', _id);
    
    // Try both _id and id fields
    const currentServiceRequest = await ServiceRequests.findOneAsync({
      $or: [
        { _id: _id },
        { id: _id }
      ]
    });
    
    if (!currentServiceRequest) {
      console.error('ServiceRequest not found for ID:', _id);
      // Try to see what's in the collection
      const sample = await ServiceRequests.findOneAsync({ 'category.0.coding.0.code': 'intervention-approval' });
      if (sample) {
        console.log('Sample approval request IDs:', { _id: sample._id, id: sample.id });
      }
      throw new Meteor.Error('not-found', 'Service request not found');
    }
    
    console.log('Found ServiceRequest:', { _id: currentServiceRequest._id, id: currentServiceRequest.id, status: currentServiceRequest.status });
    
    // Update metadata
    const now = new Date();
    update.meta = update.meta || {};
    update.meta.lastUpdated = now;
    
    // Increment version
    const currentVersion = parseInt(get(currentServiceRequest, 'meta.versionId', '0'));
    update.meta.versionId = String(currentVersion + 1);
    
    // Ensure resourceType is maintained
    update.resourceType = 'ServiceRequest';
    
    // Perform the update using the actual _id from the found document
    const actualId = currentServiceRequest._id;
    console.log('Updating ServiceRequest with _id:', actualId);
    console.log('Update data:', update);
    
    const result = await ServiceRequests.updateAsync(actualId, { $set: update });
    
    console.log('Update result:', result);
    
    // Verify the update
    if (Meteor.isServer) {
      const updated = await ServiceRequests.findOneAsync(actualId);
      console.log('Verified updated ServiceRequest:', { 
        _id: updated?._id, 
        status: updated?.status,
        category: updated?.category?.[0]?.coding?.[0]?.code 
      });
    }
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ServiceRequest updated', {
        userId: this.userId,
        serviceRequestId: _id,
        timestamp: new Date()
      });
    }
    
    return result;
  },

  async 'removeServiceRequest'(_id) {
    check(_id, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete service requests');
    }
    
    const ServiceRequests = getServiceRequests();
    const result = await ServiceRequests.removeAsync(_id);
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('ServiceRequest removed', {
        userId: this.userId,
        serviceRequestId: _id,
        timestamp: new Date()
      });
    }
    
    return result;
  },

  async 'serviceRequests.get'(_id) {
    check(_id, String);
    
    const ServiceRequests = getServiceRequests();
    const serviceRequest = await ServiceRequests.findOneAsync(_id);
    
    if (!serviceRequest) {
      throw new Meteor.Error('not-found', 'Service request not found');
    }
    
    return serviceRequest;
  },

  async 'serviceRequests.create'(serviceRequestData) {
    // Alias for consistency with component expectations
    return Meteor.call('createServiceRequest', serviceRequestData);
  },

  async 'serviceRequests.update'(_id, update) {
    // Alias for consistency with component expectations
    return Meteor.call('updateServiceRequest', _id, update);
  },

  async 'serviceRequests.remove'(_id) {
    // Alias for consistency with component expectations
    return Meteor.call('removeServiceRequest', _id);
  },

  async 'serviceRequests.list'(query = {}, options = {}) {
    check(query, Object);
    check(options, Object);
    
    // Apply default options
    options.limit = options.limit || 100;
    options.sort = options.sort || { 'meta.lastUpdated': -1 };
    
    const ServiceRequests = getServiceRequests();
    const serviceRequests = await ServiceRequests.find(query, options).fetchAsync();
    
    return serviceRequests;
  },

  async 'serviceRequests.search'(searchText, patientId, status) {
    check(searchText, Match.Maybe(String));
    check(patientId, Match.Maybe(String));
    check(status, Match.Maybe(String));
    
    const query = {};
    
    if (searchText) {
      query.$or = [
        { 'code.text': { $regex: searchText, $options: 'i' } },
        { 'code.coding.display': { $regex: searchText, $options: 'i' } },
        { 'requester.display': { $regex: searchText, $options: 'i' } },
        { 'performer.display': { $regex: searchText, $options: 'i' } },
        { 'note.text': { $regex: searchText, $options: 'i' } }
      ];
    }
    
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    if (status) {
      query.status = status;
    }
    
    const ServiceRequests = getServiceRequests();
    const serviceRequests = await ServiceRequests.find(query, { limit: 100 }).fetchAsync();
    
    return serviceRequests;
  },

  async 'serviceRequests.getActiveInterventions'(practitionerId) {
    check(practitionerId, Match.Maybe(String));
    
    try {
      // Query for active intervention ServiceRequests
      // These are the initial intervention requests, NOT approval requests
      const query = {
        status: 'active',
        $and: [
          {
            $or: [
              { 'category.0.coding.0.code': { $ne: 'intervention-approval' } },
              { 'category.0.coding.0.code': { $exists: false } }
            ]
          }
        ]
      };
      
      // If practitioner ID provided, filter by performer
      if (practitionerId) {
        query['performer.reference'] = `Practitioner/${practitionerId}`;
      }
      
      const ServiceRequests = getServiceRequests();
      const activeInterventions = await ServiceRequests.find(query, {
        sort: { authoredOn: -1 },
        limit: 20
      }).fetchAsync();
      
      console.log('Active interventions found:', activeInterventions.length);
      
      return activeInterventions;
    } catch (error) {
      console.error('Error finding active interventions:', error);
      throw new Meteor.Error('query-failed', 'Failed to find active interventions');
    }
  }
});
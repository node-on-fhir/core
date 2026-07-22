// /imports/api/serviceRequests/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

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

Meteor.ServerMethods.define('serviceRequests.create', {
  description: 'Create a new FHIR ServiceRequest with default status/intent/priority and version metadata',
  aliases: ['createServiceRequest'],
  phi: true,
  schemaObject: { type: 'object' }   // the ServiceRequest resource payload itself
}, async function(params, context) {
  const serviceRequestData = params;

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
  if (serviceRequest.category?.[0]?.coding?.[0]?.code === 'intervention-approval') {
    const chiefMedicalOfficer = get(Meteor.settings, 'private.pacio.chiefMedicalOfficer', {
      reference: 'Practitioner/chief-medical-officer',
      display: 'Chief Medical Officer'
    });
    context.log.info('Setting Chief Medical Officer from private settings', { chiefMedicalOfficer: chiefMedicalOfficer });
    serviceRequest.performer = [chiefMedicalOfficer];
  }

  // Insert and return the new service request
  const ServiceRequests = getServiceRequests();
  const serviceRequestId = await ServiceRequests.insertAsync(serviceRequest);

  // Log for HIPAA compliance
  context.log.info('ServiceRequest created', {
    userId: context.userId,
    serviceRequestId: serviceRequestId,
    timestamp: new Date()
  });

  return serviceRequestId;
});

Meteor.ServerMethods.define('serviceRequests.update', {
  description: 'Update an existing FHIR ServiceRequest by _id or FHIR id and increment its version',
  aliases: ['updateServiceRequest'],
  phi: true,
  positionalParams: ['_id', 'update'],
  schemaObject: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      update: { type: 'object' }
    },
    required: ['_id', 'update']
  }
}, async function(params, context) {
  const _id = params._id;
  const update = params.update;

  // Get current service request to increment version
  const ServiceRequests = getServiceRequests();

  context.log.debug('serviceRequests.update - looking for ID', { _id: _id });

  // Try both _id and id fields (legacy behavior — approval-workflow callers
  // pass FHIR ids; preserved as-is during the rpc migration)
  const currentServiceRequest = await ServiceRequests.findOneAsync({
    $or: [
      { _id: _id },
      { id: _id }
    ]
  });

  if (!currentServiceRequest) {
    context.log.error('ServiceRequest not found for ID', { _id: _id });
    // Try to see what's in the collection
    const sample = await ServiceRequests.findOneAsync({ 'category.0.coding.0.code': 'intervention-approval' });
    if (sample) {
      context.log.debug('Sample approval request IDs', { _id: sample._id, id: sample.id });
    }
    throw new Meteor.Error('not-found', 'Service request not found');
  }

  context.log.debug('Found ServiceRequest', { _id: currentServiceRequest._id, id: currentServiceRequest.id, status: currentServiceRequest.status });

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
  context.log.debug('Updating ServiceRequest', { _id: actualId });

  const result = await ServiceRequests.updateAsync(actualId, { $set: update });

  // Verify the update
  const updated = await ServiceRequests.findOneAsync(actualId);
  context.log.debug('Verified updated ServiceRequest', {
    _id: updated?._id,
    status: updated?.status,
    category: updated?.category?.[0]?.coding?.[0]?.code
  });

  // Log for HIPAA compliance
  context.log.info('ServiceRequest updated', {
    userId: context.userId,
    serviceRequestId: _id,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('serviceRequests.remove', {
  description: 'Delete a FHIR ServiceRequest by its MongoDB _id',
  aliases: ['removeServiceRequest'],
  phi: true,
  positionalParams: ['_id'],
  schemaObject: {
    type: 'object',
    properties: { _id: { type: 'string' } },
    required: ['_id']
  }
}, async function(params, context) {
  const _id = params._id;

  const ServiceRequests = getServiceRequests();
  const result = await ServiceRequests.removeAsync(_id);

  // Log for HIPAA compliance
  context.log.info('ServiceRequest removed', {
    userId: context.userId,
    serviceRequestId: _id,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('serviceRequests.get', {
  description: 'Fetch a single FHIR ServiceRequest by its MongoDB _id',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  phi: true,
  positionalParams: ['_id'],
  schemaObject: {
    type: 'object',
    properties: { _id: { type: 'string' } },
    required: ['_id']
  }
}, async function(params) {
  const ServiceRequests = getServiceRequests();
  const serviceRequest = await ServiceRequests.findOneAsync(params._id);

  if (!serviceRequest) {
    throw new Meteor.Error('not-found', 'Service request not found');
  }

  return serviceRequest;
});

Meteor.ServerMethods.define('serviceRequests.list', {
  description: 'List FHIR ServiceRequests matching a Mongo query with sort/limit options',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  phi: true,
  positionalParams: ['query', 'options'],
  schemaObject: {
    type: 'object',
    properties: {
      query: { type: 'object' },
      options: { type: 'object' }
    }
  }
}, async function(params) {
  const query = params.query || {};
  const options = params.options || {};

  // Apply default options
  options.limit = options.limit || 100;
  options.sort = options.sort || { 'meta.lastUpdated': -1 };

  const ServiceRequests = getServiceRequests();
  const serviceRequests = await ServiceRequests.find(query, options).fetchAsync();

  return serviceRequests;
});

Meteor.ServerMethods.define('serviceRequests.search', {
  description: 'Search FHIR ServiceRequests by free text, patient id, and status',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  phi: true,
  positionalParams: ['searchText', 'patientId', 'status'],
  schemaObject: {
    type: 'object',
    properties: {
      searchText: { type: ['string', 'null'] },
      patientId: { type: ['string', 'null'] },
      status: { type: ['string', 'null'] }
    }
  }
}, async function(params) {
  const searchText = params.searchText;
  const patientId = params.patientId;
  const status = params.status;

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
});

Meteor.ServerMethods.define('serviceRequests.getActiveInterventions', {
  description: 'List the 20 most recent active intervention ServiceRequests, optionally filtered by performer practitioner',
  // Pre-migration this method had NO auth guard. requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  phi: true,
  positionalParams: ['practitionerId'],
  schemaObject: {
    type: 'object',
    properties: { practitionerId: { type: ['string', 'null'] } }
  }
}, async function(params, context) {
  const practitionerId = params.practitionerId;

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

    context.log.debug('Active interventions found', { count: activeInterventions.length });

    return activeInterventions;
  } catch (error) {
    context.log.error('Error finding active interventions', { error: error.message });
    throw new Meteor.Error('query-failed', 'Failed to find active interventions');
  }
});

// /imports/api/procedures/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Procedures';

// Get the correct Procedures collection reference
function getProcedures() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Procedures || global.Procedures;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Procedures;
  }
}

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('procedures.create', {
  description: 'Create a new FHIR Procedure record with version metadata',
  aliases: ['createProcedure'],
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary Procedure payload
}, async function(params, context) {
  const procedureData = params;

  // Add metadata
  const procedure = {
    ...procedureData,
    resourceType: 'Procedure',
    meta: {
      ...get(procedureData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new procedure
  const Procedures = getProcedures();
  const procedureId = await Procedures.insertAsync(procedure);

  // Log for HIPAA compliance
  context.log.info('Procedure created', {
    userId: context.userId,
    procedureId: procedureId,
    timestamp: new Date()
  });

  return procedureId;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('procedures.update', {
  description: 'Update an existing Procedure record and bump its version',
  aliases: ['updateProcedure'],
  phi: true,
  positionalParams: ['procedureId', 'procedureData'],
  schemaObject: {
    type: 'object',
    properties: { procedureId: { type: 'string' }, procedureData: { type: 'object' } },
    required: ['procedureId', 'procedureData']
  }
}, async function(params, context) {
  const procedureId = params.procedureId;
  const procedureData = params.procedureData;

  const Procedures = getProcedures();

  // Check if procedure exists
  const existingProcedure = await Procedures.findOneAsync({ _id: procedureId });
  if (!existingProcedure) {
    throw new Meteor.Error('not-found', 'Procedure not found');
  }

  // Update metadata
  const updatedProcedure = {
    ...procedureData,
    _id: procedureId,
    resourceType: 'Procedure',
    meta: {
      ...get(procedureData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingProcedure, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the procedure
  const result = await Procedures.updateAsync(
    { _id: procedureId },
    { $set: updatedProcedure }
  );

  // Log for HIPAA compliance
  context.log.info('Procedure updated', {
    userId: context.userId,
    procedureId: procedureId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('procedures.remove', {
  description: 'Remove a Procedure record by MongoDB _id',
  aliases: ['removeProcedure'],
  phi: true,
  positionalParams: ['procedureId'],
  schemaObject: {
    type: 'object',
    properties: { procedureId: { type: 'string' } },
    required: ['procedureId']
  }
}, async function(params, context) {
  const procedureId = params.procedureId;

  const Procedures = getProcedures();

  // Check if procedure exists
  const existingProcedure = await Procedures.findOneAsync({ _id: procedureId });
  if (!existingProcedure) {
    throw new Meteor.Error('not-found', 'Procedure not found');
  }

  // Remove the procedure
  const result = await Procedures.removeAsync({ _id: procedureId });

  // Log for HIPAA compliance
  context.log.info('Procedure removed', {
    userId: context.userId,
    procedureId: procedureId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('procedures.get', {
  description: 'Fetch a single Procedure record by MongoDB _id',
  phi: true,
  positionalParams: ['procedureId'],
  schemaObject: {
    type: 'object',
    properties: { procedureId: { type: 'string' } },
    required: ['procedureId']
  }
}, async function(params, context) {
  const procedureId = params.procedureId;

  const Procedures = getProcedures();
  context.log.debug('procedures.get called', { procedureId: procedureId, hasCollection: !!Procedures });

  // Try both ways to find the procedure
  let procedure = await Procedures.findOneAsync({ _id: procedureId });

  if (!procedure) {
    // Also try without the query object
    procedure = await Procedures.findOneAsync(procedureId);
  }

  if (!procedure) {
    throw new Meteor.Error('not-found', 'Procedure not found');
  }

  return procedure;
});

// /imports/api/research-studies/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/ResearchStudies';

// Get the correct ResearchStudies collection reference
function getResearchStudies() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.ResearchStudies || global.ResearchStudies;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.ResearchStudies;
  }
}

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('researchStudies.create', {
  description: 'Create a new FHIR ResearchStudy record with version metadata',
  schemaObject: { type: 'object' }   // arbitrary ResearchStudy payload
}, async function(params, context) {
  const researchStudyData = params;

  // Add metadata
  const researchStudy = {
    ...researchStudyData,
    resourceType: 'ResearchStudy',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new research study
  const ResearchStudies = getResearchStudies();
  const researchStudyId = await ResearchStudies.insertAsync(researchStudy);

  // Log for HIPAA compliance
  context.log.info('ResearchStudy created', {
    userId: context.userId,
    researchStudyId: researchStudyId,
    timestamp: new Date()
  });

  return researchStudyId;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('researchStudies.update', {
  description: 'Update an existing ResearchStudy record and bump its version',
  positionalParams: ['researchStudyId', 'researchStudyData'],
  schemaObject: {
    type: 'object',
    properties: { researchStudyId: { type: 'string' }, researchStudyData: { type: 'object' } },
    required: ['researchStudyId', 'researchStudyData']
  }
}, async function(params, context) {
  const researchStudyId = params.researchStudyId;
  const researchStudyData = params.researchStudyData;

  const ResearchStudies = getResearchStudies();

  // Check if research study exists
  const existingResearchStudy = await ResearchStudies.findOneAsync({ _id: researchStudyId });
  if (!existingResearchStudy) {
    throw new Meteor.Error('not-found', 'ResearchStudy not found');
  }

  // Update metadata
  const updatedResearchStudy = {
    ...researchStudyData,
    _id: researchStudyId,
    resourceType: 'ResearchStudy',
    meta: {
      ...get(researchStudyData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingResearchStudy, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the research study
  const result = await ResearchStudies.updateAsync(
    { _id: researchStudyId },
    { $set: updatedResearchStudy }
  );

  // Log for HIPAA compliance
  context.log.info('ResearchStudy updated', {
    userId: context.userId,
    researchStudyId: researchStudyId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('researchStudies.remove', {
  description: 'Remove a ResearchStudy record by MongoDB _id',
  positionalParams: ['researchStudyId'],
  schemaObject: {
    type: 'object',
    properties: { researchStudyId: { type: 'string' } },
    required: ['researchStudyId']
  }
}, async function(params, context) {
  const researchStudyId = params.researchStudyId;

  const ResearchStudies = getResearchStudies();

  // Check if research study exists
  const existingResearchStudy = await ResearchStudies.findOneAsync({ _id: researchStudyId });
  if (!existingResearchStudy) {
    throw new Meteor.Error('not-found', 'ResearchStudy not found');
  }

  // Remove the research study
  const result = await ResearchStudies.removeAsync({ _id: researchStudyId });

  // Log for HIPAA compliance
  context.log.info('ResearchStudy removed', {
    userId: context.userId,
    researchStudyId: researchStudyId,
    timestamp: new Date()
  });

  return result;
});

// Pre-migration this method required login — requireAuth default (true).
Meteor.ServerMethods.define('researchStudies.get', {
  description: 'Fetch a single ResearchStudy record by MongoDB _id',
  positionalParams: ['researchStudyId'],
  schemaObject: {
    type: 'object',
    properties: { researchStudyId: { type: 'string' } },
    required: ['researchStudyId']
  }
}, async function(params, context) {
  const researchStudyId = params.researchStudyId;

  const ResearchStudies = getResearchStudies();
  context.log.debug('researchStudies.get called', { researchStudyId: researchStudyId, hasCollection: !!ResearchStudies });

  // Try both ways to find the research study
  let researchStudy = await ResearchStudies.findOneAsync({ _id: researchStudyId });

  if (!researchStudy) {
    // Also try without the query object
    researchStudy = await ResearchStudies.findOneAsync(researchStudyId);
  }

  if (!researchStudy) {
    context.log.warn('ResearchStudy not found', {
      researchStudyId: researchStudyId,
      totalInCollection: await ResearchStudies.countAsync()
    });

    // Log a few research studies to see their ID format
    const sampleResearchStudies = await ResearchStudies.find({}, { limit: 3 }).fetchAsync();
    context.log.debug('Sample research study IDs', { samples: sampleResearchStudies.map(rs => ({ _id: rs._id, type: typeof rs._id })) });

    throw new Meteor.Error('not-found', 'ResearchStudy not found');
  }

  context.log.debug('Found research study', { _id: researchStudy._id });
  return researchStudy;
});

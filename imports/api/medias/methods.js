// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/medias/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Medias';

// Media resources are patient-scoped clinical content (subject reference,
// clinical images/attachments) — PHI-flagged. Legacy non-dotted names
// (createMedia, updateMedia, removeMedia) are preserved as aliases.

// Get the correct Medias collection reference
function getMedias() {
  if (Meteor.isServer) {
    // On server, use the global collection set up in server/main.js
    return Meteor.Collections?.Medias || global.Medias;
  } else {
    // On client, use from Meteor.Collections if available
    return Meteor.Collections?.Medias;
  }
}

// Helper function to generate a new Media id
function generateMediaId() {
  return Random.id();
}

Meteor.ServerMethods.define('medias.create', {
  description: 'Create a FHIR Media resource',
  aliases: ['createMedia'],
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const mediaData = params;

  context.log.debug('medias.create called', { data: mediaData });

  // Clean up the data
  const cleanMedia = {
    ...mediaData,
    resourceType: 'Media'
  };

  // Generate id if not provided
  if (!cleanMedia.id) {
    cleanMedia.id = generateMediaId();
  }

  // Set _id based on environment variable
  if (process.env.USE_MONGO_OBJECTID) {
    // Use MongoDB ObjectID for consistency with existing data
    const { Mongo } = Package.mongo;
    const objectId = new Mongo.ObjectID();
    cleanMedia._id = objectId.toHexString();
    context.log.info('Using MongoDB ObjectID (as hex string)', { _id: cleanMedia._id });
  } else {
    // Default: Set _id to match id (Meteor string ID)
    cleanMedia._id = cleanMedia.id;
    context.log.info('Using Meteor string ID', { _id: cleanMedia._id });
  }

  // Add metadata
  cleanMedia.meta = {
    ...get(cleanMedia, 'meta', {}),
    lastUpdated: new Date(),
    versionId: '1'
  };

  // Ensure status is set
  if (!cleanMedia.status) {
    cleanMedia.status = 'completed';
  }

  // Transform CodeableConcepts if provided as plain text
  if (cleanMedia.type && typeof cleanMedia.type === 'string') {
    cleanMedia.type = {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/media-type",
        code: cleanMedia.type,
        display: cleanMedia.type
      }],
      text: cleanMedia.type
    };
  }

  if (cleanMedia.modality && typeof cleanMedia.modality === 'string') {
    cleanMedia.modality = {
      coding: [{
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: cleanMedia.modality,
        display: cleanMedia.modality
      }],
      text: cleanMedia.modality
    };
  }

  if (cleanMedia.view && typeof cleanMedia.view === 'string') {
    cleanMedia.view = {
      coding: [{
        system: "http://snomed.info/sct",
        code: cleanMedia.view,
        display: cleanMedia.view
      }],
      text: cleanMedia.view
    };
  }

  // Transform reasonCode if provided as plain text
  if (cleanMedia.reasonCode && typeof cleanMedia.reasonCode === 'string') {
    cleanMedia.reasonCode = [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "182836005",
        display: cleanMedia.reasonCode
      }],
      text: cleanMedia.reasonCode
    }];
  }

  // Transform bodySite if provided as plain text
  if (cleanMedia.bodySite && typeof cleanMedia.bodySite === 'string') {
    cleanMedia.bodySite = {
      coding: [{
        system: "http://snomed.info/sct",
        code: cleanMedia.bodySite,
        display: cleanMedia.bodySite
      }],
      text: cleanMedia.bodySite
    };
  }

  // Ensure content object exists
  if (!cleanMedia.content) {
    cleanMedia.content = {};
  }

  context.log.debug('Final media to insert', { media: cleanMedia });

  try {
    // Insert and return the new media
    const Medias = getMedias();

    const mediaId = await Medias.insertAsync(cleanMedia);
    context.log.info('Successfully inserted media', { mediaId: mediaId });

    // Log for HIPAA compliance
    context.log.info('Media created', {
      userId: context.userId,
      mediaId: mediaId,
      timestamp: new Date()
    });

    return mediaId;
  } catch (error) {
    context.log.error('Error inserting media', { message: error.message, details: error.sanitizedError || error });
    throw error;
  }
});

Meteor.ServerMethods.define('medias.update', {
  description: 'Update an existing FHIR Media resource',
  aliases: ['updateMedia'],
  phi: true,
  positionalParams: ['mediaId', 'mediaData'],
  schemaObject: {
    type: 'object',
    properties: {
      mediaId: { type: 'string' },
      mediaData: { type: 'object' }
    },
    required: ['mediaId', 'mediaData']
  }
}, async function(params, context){
  const mediaId = params.mediaId;
  const mediaData = params.mediaData;

  const Medias = getMedias();

  // Check if media exists
  const existingMedia = await Medias.findOneAsync({ _id: mediaId });
  if (!existingMedia) {
    throw new Meteor.Error('not-found', 'Media not found');
  }

  // Clean up the data
  const cleanMedia = {
    ...mediaData,
    resourceType: 'Media',
    _id: mediaId
  };

  // Update metadata
  cleanMedia.meta = {
    ...get(cleanMedia, 'meta', {}),
    lastUpdated: new Date(),
    versionId: String(parseInt(get(existingMedia, 'meta.versionId', '0')) + 1)
  };

  context.log.info('Updating media', { mediaId: mediaId });

  // Update the media
  const result = await Medias.updateAsync(
    { _id: mediaId },
    { $set: cleanMedia }
  );

  // Log for HIPAA compliance
  context.log.info('Media updated', {
    userId: context.userId,
    mediaId: mediaId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('medias.remove', {
  description: 'Delete a FHIR Media resource by id',
  aliases: ['removeMedia'],
  phi: true,
  positionalParams: ['mediaId'],
  schemaObject: {
    type: 'object',
    properties: { mediaId: { type: 'string' } },
    required: ['mediaId']
  }
}, async function(params, context){
  const mediaId = params.mediaId;

  const Medias = getMedias();

  // Check if media exists
  const existingMedia = await Medias.findOneAsync({ _id: mediaId });
  if (!existingMedia) {
    throw new Meteor.Error('not-found', 'Media not found');
  }

  context.log.info('Removing media', { mediaId: mediaId });

  // Remove the media
  const result = await Medias.removeAsync({ _id: mediaId });

  // Log for HIPAA compliance
  context.log.info('Media removed', {
    userId: context.userId,
    mediaId: mediaId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('medias.get', {
  description: 'Fetch a single FHIR Media resource by id',
  phi: true,
  // Pre-migration this method had NO auth guard; requireAuth now applies
  // (default true) — behavior change, noted in the migration report.
  positionalParams: ['mediaId'],
  schemaObject: {
    type: 'object',
    properties: { mediaId: { type: 'string' } },
    required: ['mediaId']
  }
}, async function(params){
  const Medias = getMedias();
  const media = await Medias.findOneAsync({ _id: params.mediaId });

  if (!media) {
    throw new Meteor.Error('not-found', 'Media not found');
  }

  return media;
});

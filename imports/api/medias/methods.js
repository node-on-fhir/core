// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/medias/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/Medias';

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

Meteor.methods({
  async 'createMedia'(mediaData) {
    check(mediaData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to create media');
    }
    
    console.log('=== createMedia called ===');
    console.log('Original data:', JSON.stringify(mediaData, null, 2));
    
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
      console.log('[createMedia] Using MongoDB ObjectID (as hex string):', cleanMedia._id);
    } else {
      // Default: Set _id to match id (Meteor string ID)
      cleanMedia._id = cleanMedia.id;
      console.log('[createMedia] Using Meteor string ID:', cleanMedia._id);
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
    
    console.log('Final media to insert:', JSON.stringify(cleanMedia, null, 2));
    
    try {
      // Insert and return the new media
      const Medias = getMedias();
      console.log('Got Medias collection:', !!Medias);
      
      const mediaId = await Medias.insertAsync(cleanMedia);
      console.log('Successfully inserted media with ID:', mediaId);
      
      // Log for HIPAA compliance
      if (Meteor.isServer) {
        console.log('Media created', {
          userId: this.userId,
          mediaId: mediaId,
          timestamp: new Date()
        });
      }
      
      return mediaId;
    } catch (error) {
      console.error('Error inserting media:', error);
      console.error('Error details:', error.sanitizedError || error);
      throw error;
    }
  },
  
  async 'updateMedia'(mediaId, mediaData) {
    check(mediaId, String);
    check(mediaData, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to update media');
    }
    
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
    
    console.log('Updating media:', mediaId);
    console.log('Update data:', JSON.stringify(cleanMedia, null, 2));
    
    // Update the media
    const result = await Medias.updateAsync(
      { _id: mediaId },
      { $set: cleanMedia }
    );
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Media updated', {
        userId: this.userId,
        mediaId: mediaId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'removeMedia'(mediaId) {
    check(mediaId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in to delete media');
    }
    
    const Medias = getMedias();
    
    // Check if media exists
    const existingMedia = await Medias.findOneAsync({ _id: mediaId });
    if (!existingMedia) {
      throw new Meteor.Error('not-found', 'Media not found');
    }
    
    console.log('Removing media:', mediaId);
    
    // Remove the media
    const result = await Medias.removeAsync({ _id: mediaId });
    
    // Log for HIPAA compliance
    if (Meteor.isServer) {
      console.log('Media removed', {
        userId: this.userId,
        mediaId: mediaId,
        timestamp: new Date()
      });
    }
    
    return result;
  },
  
  async 'medias.get'(mediaId) {
    check(mediaId, String);
    
    const Medias = getMedias();
    const media = await Medias.findOneAsync({ _id: mediaId });
    
    if (!media) {
      throw new Meteor.Error('not-found', 'Media not found');
    }
    
    return media;
  }
});
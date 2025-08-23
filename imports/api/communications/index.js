// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/communications/index.js

import { Meteor } from 'meteor/meteor';

// Export the collection
export { Communications } from '../../lib/schemas/SimpleSchemas/Communications';

// Export the validated methods
export { 
  insertCommunication, 
  updateCommunication, 
  removeCommunicationById,
  getCommunication,
  searchCommunications
} from './methods';

// Export client helpers (only on client)
if (Meteor.isClient) {
  export { CommunicationsClient } from './client';
}
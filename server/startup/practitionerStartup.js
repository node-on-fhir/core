// server/startup/practitionerStartup.js

import { Meteor } from 'meteor/meteor';

// Import practitioner methods
import '../methods/practitionerMethods';

// Import practitioner publications
import '../publications/practitionerCommunications';

Meteor.startup(() => {
  console.log('Practitioner communication system initialized');
  
  // Note: Cannot check Meteor.userId() during server startup
  // User-specific subscriptions should be handled on the client side
});
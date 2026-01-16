// imports/startup/server/simple-accounts-startup.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import the simple auth methods
import '../../accounts/server/simple-auth-methods';

Meteor.startup(() => {
  console.log('Simple accounts startup - methods should be available');
});
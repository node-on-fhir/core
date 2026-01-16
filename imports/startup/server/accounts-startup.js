// imports/startup/server/accounts-startup.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import accounts server module
import '../../accounts/server/startup';

console.log('Accounts server startup loaded');
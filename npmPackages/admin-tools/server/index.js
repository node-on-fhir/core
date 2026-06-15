// packages/admin-tools/server/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import methods
import './methods.js';
import './deletePatientMethods.js';
import './archivePatientMethods.js';
import './renamePatientMethods.js';
import './anonymizePatientMethods.js';

Meteor.startup(async function() {
  console.log('AdminTools: Server startup');

  // Check if package is enabled in settings
  const packageEnabled = get(Meteor, 'settings.public.modules.adminTools.enabled', true);
  if (!packageEnabled) {
    console.log('AdminTools: Package disabled in settings');
    return;
  }

  // Log available collections
  try {
    const collections = global.Collections || Meteor.Collections || {};
    const collectionNames = Object.keys(collections);
    console.log('AdminTools: Found ' + collectionNames.length + ' registered collections');
  } catch (error) {
    console.error('AdminTools: Error accessing collections:', error);
  }

  console.log('AdminTools: Server startup complete');
});

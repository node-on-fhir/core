// /packages/checklist-manifesto/server/index.js

import { Meteor } from 'meteor/meteor';

// Import collections
import '../lib/collections/ChecklistTasks';
import '../lib/collections/ChecklistLists';

// Import methods
import './methods/tasks';
import './methods/lists';
import './methods/protocols';

// Import publications
import './publications/tasks';
import './publications/lists';

// Initialize system templates on startup
Meteor.startup(async function() {
  console.log('Initializing checklist-manifesto package...');
  
  try {
    // Create system templates if they don't exist
    const result = await Meteor.callAsync('checklist.protocols.initializeSystemTemplates');
    console.log(`System templates initialized: ${result.created} created, ${result.updated} updated`);
  } catch (error) {
    console.error('Error initializing system templates:', error);
  }
});
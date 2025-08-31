// server/verify-observations.js
// Server-side verification of Observations setup

import { Meteor } from 'meteor/meteor';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.startup(async function() {
  // Only run this verification in development
  if (Meteor.isDevelopment) {
    console.log('=== Verifying Observations Setup ===');
    
    try {
      // Check if collection exists
      console.log('1. Observations collection exists:', !!Observations);
      console.log('2. Observations._collection exists:', !!Observations._collection);
      
      // Check if methods are registered
      const methodNames = ['observations.create', 'observations.update', 'observations.remove', 'observations.get'];
      console.log('3. Checking registered methods:');
      methodNames.forEach(name => {
        const methodExists = !!Meteor.server.method_handlers[name];
        console.log(`   - ${name}: ${methodExists ? 'REGISTERED' : 'NOT FOUND'}`);
      });
      
      // Check collection count
      const count = await Observations.find().countAsync();
      console.log(`4. Current observation count: ${count}`);
      
      // Check if publications are set up
      const pubNames = ['autopublish.Observations', 'observations.all'];
      console.log('5. Checking publications:');
      pubNames.forEach(name => {
        const pubExists = !!Meteor.server.publish_handlers[name];
        console.log(`   - ${name}: ${pubExists ? 'REGISTERED' : 'NOT FOUND'}`);
      });
      
      console.log('=== Observations Verification Complete ===\n');
      
    } catch (err) {
      console.error('Error during observations verification:', err);
    }
  }
});
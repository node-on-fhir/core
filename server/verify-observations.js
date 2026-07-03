// server/verify-observations.js
// Server-side verification of Observations setup

import { Meteor } from 'meteor/meteor';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

import LoggerModule from '/imports/lib/Logger.js';
const log = LoggerModule.Logger.for('verify-observations');

Meteor.startup(async function() {
  // Only run this verification in development
  if (Meteor.isDevelopment) {
    log.info('=== Verifying Observations Setup ===');

    try {
      // Check if collection exists
      log.info('Observations collection exists', { exists: !!Observations });
      log.info('Observations._collection exists', { exists: !!Observations._collection });

      // Check if methods are registered
      const methodNames = ['observations.create', 'observations.update', 'observations.remove', 'observations.get'];
      log.info('Checking registered methods');
      methodNames.forEach(name => {
        const methodExists = !!Meteor.server.method_handlers[name];
        log.info('Method registration status', { method: name, registered: methodExists });
      });

      // Check collection count
      const count = await Observations.find().countAsync();
      log.info('Current observation count', { count });

      // Check if publications are set up
      const pubNames = ['autopublish.Observations', 'observations.all'];
      log.info('Checking publications');
      pubNames.forEach(name => {
        const pubExists = !!Meteor.server.publish_handlers[name];
        log.info('Publication registration status', { publication: name, registered: pubExists });
      });

      log.info('=== Observations Verification Complete ===');

    } catch (err) {
      log.error('Error during observations verification', { error: err && err.message });
    }
  }
});
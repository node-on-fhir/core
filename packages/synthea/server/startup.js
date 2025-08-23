// /packages/synthea/server/startup.js
import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

Meteor.startup(function() {
  // Check for ENABLE_SYNTHEA_DB_UTILS environment variable
  const enableDbUtils = process.env.ENABLE_SYNTHEA_DB_UTILS === 'true';
  
  // Set the public setting for UI visibility
  set(Meteor, 'settings.public.enableSyntheaDbUtils', enableDbUtils);
  
  // Also set a private setting for server-side checks
  set(Meteor, 'settings.private.enableSyntheaDbUtils', enableDbUtils);
  
  // Log the status for debugging
  if (enableDbUtils) {
    console.log('🔧 Synthea DB Utils: ENABLED - Database conversion tools are active');
    console.warn('⚠️  Warning: Synthea database utilities are enabled. These tools can modify your database.');
    console.log('   To disable, remove ENABLE_SYNTHEA_DB_UTILS environment variable');
  } else {
    console.log('🔒 Synthea DB Utils: DISABLED (default) - Set ENABLE_SYNTHEA_DB_UTILS=true to enable');
  }
});
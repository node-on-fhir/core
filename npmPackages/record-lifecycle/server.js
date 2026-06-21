// npmPackages/record-lifecycle/server.js

// Re-export server methods and hooks for discovery
export * from './server/methods.js';
export * from './server/hooks.js';

// Initialize subscribers (side-effect imports)
import { initHipaaSubscriber } from './server/HipaaSubscriber.js';
import { initFhircastBridge } from './server/FhircastBridge.js';

// Initialize subscribers after EventBus is ready
// (EventBus.initialize() is called by initRecordLifecycleHooks first)
import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
  initHipaaSubscriber();
  initFhircastBridge();
});

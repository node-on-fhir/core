// npmPackages/radiology-workflow/server.js

// Re-export server methods and hooks for discovery
export * from './server/methods.js';
export * from './server/hooks.js';

// Load publications (side-effect import registers Meteor.publish calls)
import './server/publications.js';

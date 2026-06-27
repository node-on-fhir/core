// npmPackages/decision-support/server.js

// Re-export server methods (and the evaluation helpers the hooks use) for discovery
export * from './server/methods.js';

// Register publications (side-effect import)
import './server/publications.js';

// Re-export the hooks initializer for the workflow hooks loader
export { initDecisionSupportHooks } from './server/hooks.js';

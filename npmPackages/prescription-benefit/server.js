// npmPackages/prescription-benefit/server.js

// Re-export server methods for discovery
export * from './server/methods.js';

// Register publications (side-effect import)
import './server/publications.js';

// packages/us-core/server/index.js
//
// Server entry point for US Core package
// Uses ES6 imports to properly resolve module dependencies

// Import ProfileSet for CapabilityStatement (exports as global)
import './ProfileSet.js';

// Import the Patient decorator with proper ES6 module resolution
import { patientDecorator } from '../lib/decorators/PatientDecorator.js';

// Export ProfileDecorators for package discovery pattern
// This needs to be a global variable for Meteor's api.export() to work
ProfileDecorators = {
  Patient: patientDecorator
};

console.log('US Core package loaded - ProfileDecorators registered for Patient');

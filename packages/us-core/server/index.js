// packages/us-core/server/index.js
//
// Server entry point for US Core package
// Uses ES6 imports to properly resolve module dependencies

// Import ProfileSet for CapabilityStatement (exports as global)
import './ProfileSet.js';

// Import decorators with proper ES6 module resolution
import { patientDecorator } from '../lib/decorators/PatientDecorator.js';
import { organizationDecorator } from '../lib/decorators/OrganizationDecorator.js';

// Export ProfileDecorators for package discovery pattern
// This needs to be a global variable for Meteor's api.export() to work
ProfileDecorators = {
  Patient: patientDecorator,
  Organization: organizationDecorator
};

console.log('US Core package loaded - ProfileDecorators registered for Patient, Organization');

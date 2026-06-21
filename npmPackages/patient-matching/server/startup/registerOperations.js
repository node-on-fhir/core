// packages/patient-matching/server/startup/registerOperations.js
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
// FhirUtilities will be accessed from global if available
let FhirUtilities;
Meteor.startup(function() {
  FhirUtilities = global.FhirUtilities || Meteor.FhirUtilities;
});

// Register FHIR operations
Meteor.startup(async function() {
  console.log('PatientMatching: Registering FHIR operations...');
  
  // Check if FHIR operations registry exists
  if (!global.FhirOperations) {
    global.FhirOperations = {};
  }
  
  // Register Patient/$match operation
  global.FhirOperations['Patient/$match'] = {
    name: 'match',
    resourceType: 'Patient',
    level: 'type', // type-level operation
    description: 'Find patient matches using IDI matching algorithm',
    parameters: {
      input: [
        {
          name: 'resource',
          use: 'in',
          min: 1,
          max: '1',
          type: 'Patient',
          documentation: 'The patient resource to match against'
        },
        {
          name: 'onlyCertainMatches',
          use: 'in',
          min: 0,
          max: '1',
          type: 'boolean',
          documentation: 'Return only certain matches (score >= 0.95)'
        },
        {
          name: 'count',
          use: 'in',
          min: 0,
          max: '1',
          type: 'integer',
          documentation: 'Maximum number of matches to return'
        },
        {
          name: 'identityAssuranceLevel',
          use: 'in',
          min: 0,
          max: '1',
          type: 'code',
          documentation: 'Minimum identity assurance level (IAL1, IAL2, IAL3)'
        }
      ],
      output: [
        {
          name: 'return',
          use: 'out',
          min: 1,
          max: '1',
          type: 'Bundle',
          documentation: 'Bundle containing matched patient resources with scores'
        }
      ]
    },
    handler: async function(parameters) {
      console.log('Patient/$match operation called');
      
      try {
        // Extract parameters
        const patientParam = parameters.parameter?.find(p => p.name === 'resource');
        const onlyCertainParam = parameters.parameter?.find(p => p.name === 'onlyCertainMatches');
        const countParam = parameters.parameter?.find(p => p.name === 'count');
        const ialParam = parameters.parameter?.find(p => p.name === 'identityAssuranceLevel');
        
        if (!patientParam?.resource) {
          throw new Meteor.Error(400, 'Missing required parameter: resource');
        }
        
        // Call the idiMatch method
        const matchResult = await Meteor.callAsync('PatientMatching.idiMatch', {
          patient: patientParam.resource,
          onlyCertainMatches: onlyCertainParam?.valueBoolean || false,
          maxResults: countParam?.valueInteger || 10,
          minIAL: ialParam?.valueCode
        });
        
        return matchResult.bundle;
      } catch (error) {
        console.error('Error in Patient/$match operation:', error);
        throw error;
      }
    }
  };
  
  // Register Patient/$verify-identity operation
  global.FhirOperations['Patient/$verify-identity'] = {
    name: 'verify-identity',
    resourceType: 'Patient',
    level: 'instance', // instance-level operation
    description: 'Verify patient identity with additional credentials',
    parameters: {
      input: [
        {
          name: 'level',
          use: 'in',
          min: 0,
          max: '1',
          type: 'code',
          documentation: 'Verification level (basic, standard, enhanced)'
        },
        {
          name: 'credentials',
          use: 'in',
          min: 0,
          max: '*',
          type: 'Identifier',
          documentation: 'Additional identifiers for verification'
        },
        {
          name: 'biometric',
          use: 'in',
          min: 0,
          max: '1',
          type: 'Attachment',
          documentation: 'Biometric data for verification'
        }
      ],
      output: [
        {
          name: 'verified',
          use: 'out',
          min: 1,
          max: '1',
          type: 'boolean',
          documentation: 'Whether identity was verified'
        },
        {
          name: 'assuranceLevel',
          use: 'out',
          min: 0,
          max: '1',
          type: 'code',
          documentation: 'Achieved identity assurance level'
        }
      ]
    },
    handler: async function(parameters, resourceId) {
      console.log(`Patient/${resourceId}/$verify-identity operation called`);
      
      try {
        const levelParam = parameters.parameter?.find(p => p.name === 'level');
        const credentialParams = parameters.parameter?.filter(p => p.name === 'credentials') || [];
        const biometricParam = parameters.parameter?.find(p => p.name === 'biometric');
        
        // Call the verifyIdentity method
        const result = await Meteor.callAsync('PatientMatching.verifyIdentity', {
          patientId: resourceId,
          level: levelParam?.valueCode || 'basic',
          additionalCredentials: credentialParams.map(p => p.valueIdentifier),
          biometricData: biometricParam?.valueAttachment
        });
        
        return {
          resourceType: 'Parameters',
          parameter: [
            {
              name: 'verified',
              valueBoolean: result.verified
            },
            {
              name: 'assuranceLevel',
              valueCode: result.assuranceLevel
            }
          ]
        };
      } catch (error) {
        console.error(`Error in Patient/${resourceId}/$verify-identity operation:`, error);
        throw error;
      }
    }
  };
  
  console.log('PatientMatching: FHIR operations registered');
  console.log('  - Patient/$match (type-level)');
  console.log('  - Patient/$verify-identity (instance-level)');
});
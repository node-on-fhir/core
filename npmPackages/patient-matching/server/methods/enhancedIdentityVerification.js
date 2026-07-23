// packages/patient-matching/server/methods/enhancedIdentityVerification.js
//
// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Legacy 'PatientMatching.*' names
// renamed to 'patientMatching.*' + aliases. All four methods had `if
// (!this.userId) throw` guards -> deleted in favor of requireAuth default true.
// phi: true (identity proofing over Patient records). The former
// `updateIdentifiersWithVerification` method (invoked via
// `this.updateIdentifiersWithVerification`, not `Meteor.call`) is not an RPC —
// converted to a module-level helper (it never used `this`).
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { identityProofing } from '../identity-providers/IdentityProofing';

// Former method 'updateIdentifiersWithVerification' — a pure helper that was
// registered in the Meteor.methods map only so completeIdentityVerification
// could call it via `this.updateIdentifiersWithVerification(...)`. It never
// touched `this`; promoted to a module function (not exposed as an RPC).
function updateIdentifiersWithVerification(patient, verifiedAttributes) {
  const identifiers = patient.identifier || [];

  // Add verified flag to existing identifiers
  identifiers.forEach(id => {
    if (id.system === 'http://hl7.org/fhir/sid/us-ssn' && verifiedAttributes.ssn?.verified) {
      id.extension = [{
        url: 'http://hl7.org/fhir/StructureDefinition/identifier-reliability',
        valueCode: 'verified'
      }];
    }
  });

  return identifiers;
}

/**
 * Start enhanced identity verification with external provider
 */
Meteor.ServerMethods.define('patientMatching.startIdentityVerification', {
  description: 'Start an enhanced identity verification session with an external provider',
  aliases: ['PatientMatching.startIdentityVerification'],
  phi: true,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      options: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          requiredIAL: { type: 'string', enum: ['IAL1', 'IAL2', 'IAL3'] },
          provider: { type: 'string' }
        },
        required: ['patientId', 'requiredIAL']
      }
    },
    required: ['options']
  }
}, async function(params, context){
  const options = params.options || {};
  const { patientId, requiredIAL, provider = 'idme' } = options;

  // Get patient data
  const Patients = Meteor.Collections?.Patients;
  if (!Patients) {
    throw new Meteor.Error(500, 'Patients collection not available');
  }

  const patient = await Patients.findOneAsync(patientId);
  if (!patient) {
    throw new Meteor.Error(404, 'Patient not found');
  }

  try {
    // Start identity proofing session
    const proofingService = new identityProofing.constructor(provider);
    const session = await proofingService.startProofingSession(patient, requiredIAL);

    // Store session for callback
    const Sessions = new Mongo.Collection('identityProofingSessions');
    await Sessions.insertAsync({
      ...session,
      patientId,
      userId: context.userId,
      createdAt: new Date()
    });

    return {
      success: true,
      sessionId: session.sessionId,
      verificationUrl: session.verificationUrl,
      provider: session.provider
    };
  } catch (error) {
    context.log.error('Error starting identity verification', { error: error.message });
    throw new Meteor.Error(500, error.message);
  }
});

/**
 * Complete identity verification after callback
 */
Meteor.ServerMethods.define('patientMatching.completeIdentityVerification', {
  description: 'Complete an identity verification session after the provider callback and stamp verified attributes',
  aliases: ['PatientMatching.completeIdentityVerification'],
  phi: true,
  positionalParams: ['sessionId', 'authorizationCode'],
  schemaObject: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      authorizationCode: { type: 'string' }
    },
    required: ['sessionId', 'authorizationCode']
  }
}, async function(params, context){
  const { sessionId, authorizationCode } = params;

  const Sessions = new Mongo.Collection('identityProofingSessions');
  const session = await Sessions.findOneAsync({ sessionId });

  if (!session) {
    throw new Meteor.Error(404, 'Session not found');
  }

  if (session.userId !== context.userId) {
    throw new Meteor.Error('not-authorized', 'Not authorized for this session');
  }

  try {
    const proofingService = new identityProofing.constructor(session.provider);
    const result = await proofingService.verifySession(sessionId, authorizationCode);

    // Update patient record with verified identity
    if (result.verified) {
      const Patients = Meteor.Collections?.Patients;
      await Patients.updateAsync(session.patientId, {
        $set: {
          'extension': [{
            url: 'http://hl7.org/fhir/us/identity-matching/StructureDefinition/identity-assurance-level',
            valueCode: result.achievedIAL
          }],
          'identifier': updateIdentifiersWithVerification(
            await Patients.findOneAsync(session.patientId),
            result.verifiedAttributes
          )
        }
      });
    }

    // Update session
    await Sessions.updateAsync(session._id, {
      $set: {
        completed: true,
        result,
        completedAt: new Date()
      }
    });

    return result;
  } catch (error) {
    context.log.error('Error completing identity verification', { error: error.message });
    throw new Meteor.Error(500, error.message);
  }
});

/**
 * Get verification status for a patient
 */
Meteor.ServerMethods.define('patientMatching.getVerificationStatus', {
  description: 'Report the current identity assurance level and verified identifiers for a patient',
  aliases: ['PatientMatching.getVerificationStatus'],
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
  const { patientId } = params;

  const Patients = Meteor.Collections?.Patients;
  const patient = await Patients.findOneAsync(patientId);

  if (!patient) {
    throw new Meteor.Error(404, 'Patient not found');
  }

  // Extract IAL from extensions
  const ialExtension = patient.extension?.find(
    ext => ext.url === 'http://hl7.org/fhir/us/identity-matching/StructureDefinition/identity-assurance-level'
  );

  // Check for verified identifiers
  const verifiedIdentifiers = (patient.identifier || []).filter(id =>
    id.extension?.some(ext =>
      ext.url === 'http://hl7.org/fhir/StructureDefinition/identifier-reliability' &&
      ext.valueCode === 'verified'
    )
  );

  return {
    patientId,
    currentIAL: ialExtension?.valueCode || 'IAL0',
    verifiedIdentifiers: verifiedIdentifiers.map(id => ({
      system: id.system,
      type: id.type?.text,
      verified: true
    })),
    lastVerified: patient.meta?.lastUpdated
  };
});

/**
 * Get identity provider status and configuration
 */
Meteor.ServerMethods.define('patientMatching.getProviderStatus', {
  description: 'Report configured identity providers, the active provider, and configuration warnings',
  aliases: ['PatientMatching.getProviderStatus'],
  // No guard historically; reports only settings-derived provider config
  // (never secrets) — kept public so a pre-login setup screen can read it.
  requireAuth: false
}, async function(){
  const warnings = [];
  const availableProviders = [];
  let activeProvider = 'none';
  let configStatus = 'Not configured';

  // Check if we're in development mode
  const isDevelopment = Meteor.settings?.development?.mockIdentityProvider ||
                        Meteor.settings?.private?.identityProviders?.mock?.enabled;

  // Check each provider's configuration
  const providers = Meteor.settings?.private?.identityProviders || {};

  // Mock provider
  if (providers.mock?.enabled) {
    availableProviders.push('mock');
    activeProvider = 'mock';
    configStatus = 'Mock provider active (Development)';
  }

  // ID.me
  if (providers.idme?.enabled) {
    if (!providers.idme?.clientId || !providers.idme?.clientSecret) {
      warnings.push('ID.me enabled but missing credentials');
    } else {
      availableProviders.push('ID.me');
      if (activeProvider === 'none') activeProvider = 'ID.me';
    }
  }

  // Login.gov
  if (providers.loginGov?.enabled) {
    if (!providers.loginGov?.clientId || !providers.loginGov?.privateKeyPath) {
      warnings.push('Login.gov enabled but missing credentials');
    } else {
      availableProviders.push('Login.gov');
      if (activeProvider === 'none') activeProvider = 'Login.gov';
    }
  }

  // CLEAR
  if (providers.clear?.enabled) {
    if (!providers.clear?.partnerId || !providers.clear?.apiKey) {
      warnings.push('CLEAR enabled but missing credentials');
    } else {
      availableProviders.push('CLEAR');
      if (activeProvider === 'none') activeProvider = 'CLEAR';
    }
  }

  // Other providers
  ['auth0', 'verato', 'onfido', 'jumio'].forEach(provider => {
    if (providers[provider]?.enabled) {
      availableProviders.push(provider.charAt(0).toUpperCase() + provider.slice(1));
    }
  });

  // Add warnings for common issues
  if (availableProviders.length === 0) {
    warnings.push('No identity providers are enabled');
  }

  if (!isDevelopment && activeProvider === 'mock') {
    warnings.push('Using mock provider in production is not recommended');
  }

  if (availableProviders.length > 0 && activeProvider !== 'mock') {
    configStatus = `${availableProviders.length} provider(s) configured`;
  }

  return {
    isDevelopment,
    activeProvider,
    availableProviders,
    configStatus,
    warnings,
    defaultProvider: Meteor.settings?.public?.identityVerification?.defaultProvider || 'mock',
    requiredIAL: Meteor.settings?.public?.identityVerification?.requiredIAL || 'IAL1',
    sessionTimeout: Meteor.settings?.public?.identityVerification?.sessionTimeout || 1800000
  };
});

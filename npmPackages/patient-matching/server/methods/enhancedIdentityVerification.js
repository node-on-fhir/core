// packages/patient-matching/server/methods/enhancedIdentityVerification.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { identityProofing } from '../identity-providers/IdentityProofing';

Meteor.methods({
  /**
   * Start enhanced identity verification with external provider
   */
  async 'PatientMatching.startIdentityVerification'(options) {
    check(options, {
      patientId: String,
      requiredIAL: Match.OneOf('IAL1', 'IAL2', 'IAL3'),
      provider: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }
    
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
        userId: this.userId,
        createdAt: new Date()
      });
      
      return {
        success: true,
        sessionId: session.sessionId,
        verificationUrl: session.verificationUrl,
        provider: session.provider
      };
    } catch (error) {
      console.error('Error starting identity verification:', error);
      throw new Meteor.Error(500, error.message);
    }
  },
  
  /**
   * Complete identity verification after callback
   */
  async 'PatientMatching.completeIdentityVerification'(sessionId, authorizationCode) {
    check(sessionId, String);
    check(authorizationCode, String);
    
    const Sessions = new Mongo.Collection('identityProofingSessions');
    const session = await Sessions.findOneAsync({ sessionId });
    
    if (!session) {
      throw new Meteor.Error(404, 'Session not found');
    }
    
    if (session.userId !== this.userId) {
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
            'identifier': this.updateIdentifiersWithVerification(
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
      console.error('Error completing identity verification:', error);
      throw new Meteor.Error(500, error.message);
    }
  },
  
  /**
   * Update identifiers with verification status
   */
  updateIdentifiersWithVerification(patient, verifiedAttributes) {
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
  },
  
  /**
   * Get verification status for a patient
   */
  async 'PatientMatching.getVerificationStatus'(patientId) {
    check(patientId, String);
    
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
  },

  /**
   * Get identity provider status and configuration
   */
  async 'PatientMatching.getProviderStatus'() {
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
  }
});
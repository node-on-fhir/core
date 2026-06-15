// packages/patient-matching/lib/methods/verifyIdentity.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { IdentityValidation } from '../utils/identityValidation';
import { MatchingAlgorithm } from '../utils/matchingAlgorithm';

Meteor.methods({
  async 'PatientMatching.verifyIdentity'(options = {}) {
    console.log('PatientMatching.verifyIdentity called');
    
    // Validate input
    check(options, {
      patientId: String,
      level: Match.Optional(String),
      additionalCredentials: Match.Optional([Object]),
      biometricData: Match.Optional(Object)
    });
    
    const { patientId, level = 'basic', additionalCredentials = [], biometricData } = options;
    
    try {
      // Check if mock provider is enabled
      const isMockEnabled = get(Meteor, 'settings.private.identityProviders.mock.enabled', false) ||
                           get(Meteor, 'settings.development.mockIdentityProvider', false);
      
      console.log('Mock provider enabled:', isMockEnabled);
      
      // Get Patients collection
      const Patients = Meteor.Collections?.Patients;
        
      if (!Patients) {
        throw new Meteor.Error(500, 'Patients collection not available. Please ensure the application is properly initialized.');
      }
      
      // Find the patient
      let patient = await Patients.findOneAsync(patientId);
      if (!patient) {
        // Try alternate ID formats
        const alternatePatient = await Patients.findOneAsync({ 
          $or: [
            { _id: patientId },
            { id: patientId },
            { 'identifier.value': patientId }
          ]
        });
        
        if (!alternatePatient) {
          throw new Meteor.Error(404, `Patient not found with ID: ${patientId}. Please verify the patient ID is correct.`);
        }
        patient = alternatePatient;
      }
      
      // Initialize verification result
      const verificationResult = {
        verified: false,
        assuranceLevel: 'IAL1',
        confidence: 0,
        checks: [],
        isDevelopment: isMockEnabled,
        provider: isMockEnabled ? 'mock' : 'configured'
      };
      
      // If using mock provider, simulate verification based on test data
      if (isMockEnabled) {
        console.log('Using mock identity verification provider');
        
        // Mock verification always passes for development
        const mockSettings = get(Meteor, 'settings.private.identityProviders.mock', {});
        const autoApprove = get(mockSettings, 'autoApprove', true);
        
        if (autoApprove) {
          // Simulate different levels of verification
          if (level === 'basic') {
            verificationResult.checks.push({ type: 'demographics', passed: true });
            verificationResult.confidence = 0.3;
            verificationResult.assuranceLevel = 'IAL1';
          } else if (level === 'standard') {
            verificationResult.checks.push({ type: 'demographics', passed: true });
            verificationResult.checks.push({ type: 'government_id', passed: true });
            verificationResult.confidence = 0.7;
            verificationResult.assuranceLevel = 'IAL2';
          } else if (level === 'enhanced') {
            verificationResult.checks.push({ type: 'demographics', passed: true });
            verificationResult.checks.push({ type: 'government_id', passed: true });
            verificationResult.checks.push({ type: 'biometric', passed: true });
            verificationResult.confidence = 0.95;
            verificationResult.assuranceLevel = 'IAL3';
          }
          
          // Mock verification always succeeds in development
          verificationResult.verified = true;
          
          console.log('Mock verification completed:', verificationResult);
          return verificationResult;
        }
      }
      
      // Real verification logic
      // Basic verification (IAL1)
      if (level === 'basic' || level === 'standard' || level === 'enhanced') {
        // Check basic demographics
        const hasName = patient.name?.length > 0 && patient.name[0].family;
        const hasBirthDate = !!patient.birthDate;
        const hasGender = !!patient.gender;
        
        if (hasName && hasBirthDate) {
          verificationResult.checks.push({ type: 'demographics', passed: true });
          verificationResult.confidence += 0.3;
        } else {
          verificationResult.checks.push({ type: 'demographics', passed: false });
          if (!hasName) {
            console.warn('Patient missing name information');
          }
          if (!hasBirthDate) {
            console.warn('Patient missing birth date');
          }
        }
      }
      
      // Standard verification (IAL2)
      if (level === 'standard' || level === 'enhanced') {
        // Check identifiers
        const identifiers = patient.identifier || [];
        let verifiedIdFound = false;
        
        for (const id of identifiers) {
          if (id.system === 'http://hl7.org/fhir/sid/us-ssn') {
            const ssnValidation = IdentityValidation.validateSSN(id.value);
            if (ssnValidation.isValid) {
              verifiedIdFound = true;
              verificationResult.checks.push({ type: 'ssn', passed: true });
              verificationResult.confidence += 0.3;
            }
          } else if (id.system === 'http://hl7.org/fhir/sid/us-dl') {
            const dlValidation = IdentityValidation.validateDriversLicense(id.value, 'CA');
            if (dlValidation.isValid) {
              verifiedIdFound = true;
              verificationResult.checks.push({ type: 'drivers_license', passed: true });
              verificationResult.confidence += 0.3;
            }
          }
        }
        
        if (verifiedIdFound) {
          verificationResult.assuranceLevel = 'IAL2';
        }
      }
      
      // Enhanced verification (IAL3)
      if (level === 'enhanced') {
        // Check additional credentials
        for (const cred of additionalCredentials) {
          if (cred.system === 'http://hl7.org/fhir/sid/passport') {
            const passportValidation = IdentityValidation.validatePassport(cred.value);
            if (passportValidation.isValid) {
              verificationResult.checks.push({ type: 'passport', passed: true });
              verificationResult.confidence += 0.2;
            }
          }
        }
        
        // Biometric verification
        if (biometricData) {
          verificationResult.checks.push({ type: 'biometric', passed: true });
          verificationResult.confidence += 0.2;
          verificationResult.assuranceLevel = 'IAL3';
        }
      }
      
      // Calculate final IAL based on confidence
      verificationResult.confidence = Math.min(verificationResult.confidence, 1.0);
      verificationResult.verified = verificationResult.confidence >= 0.5;
      
      // Determine assurance level
      const ial = IdentityValidation.calculateIAL(patient, 
        verificationResult.checks.filter(c => c.passed).map(c => c.type)
      );
      verificationResult.assuranceLevel = ial;
      
      console.log('Identity verification result:', verificationResult);
      
      return verificationResult;
      
    } catch (error) {
      console.error('Error in PatientMatching.verifyIdentity:', error);
      throw new Meteor.Error(500, `Identity verification failed: ${error.message}`);
    }
  }
});
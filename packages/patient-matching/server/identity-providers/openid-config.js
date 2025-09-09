// packages/patient-matching/server/identity-providers/openid-config.js
import { Meteor } from 'meteor/meteor';

// OpenID Connect configuration for identity proofing
export const IdentityProviders = {
  // ID.me - Healthcare identity verification
  idme: {
    issuer: 'https://api.id.me',
    authorizationEndpoint: 'https://api.id.me/oauth/authorize',
    tokenEndpoint: 'https://api.id.me/oauth/token',
    userInfoEndpoint: 'https://api.id.me/api/public/v1/userinfo',
    clientId: Meteor.settings?.private?.idme?.clientId,
    clientSecret: Meteor.settings?.private?.idme?.clientSecret,
    scope: 'openid profile email address phone social ial2',
    // Identity Assurance Levels
    acrValues: {
      IAL1: 'http://id.me/ns/identity-assurance-level-1',
      IAL2: 'http://id.me/ns/identity-assurance-level-2',
      IAL3: 'http://id.me/ns/identity-assurance-level-3'
    }
  },
  
  // Login.gov - Government identity verification
  loginGov: {
    issuer: 'https://secure.login.gov',
    authorizationEndpoint: 'https://secure.login.gov/openid_connect/authorize',
    tokenEndpoint: 'https://secure.login.gov/api/openid_connect/token',
    userInfoEndpoint: 'https://secure.login.gov/api/openid_connect/userinfo',
    clientId: Meteor.settings?.private?.loginGov?.clientId,
    scope: 'openid email address phone profile:name profile:birthdate social_security_number',
    // NIST 800-63-3 Identity Assurance Levels
    acrValues: {
      IAL1: 'http://idmanagement.gov/ns/assurance/ial/1',
      IAL2: 'http://idmanagement.gov/ns/assurance/ial/2'
    }
  },
  
  // Auth0 with identity proofing
  auth0: {
    issuer: `https://${Meteor.settings?.private?.auth0?.domain}`,
    authorizationEndpoint: `https://${Meteor.settings?.private?.auth0?.domain}/authorize`,
    tokenEndpoint: `https://${Meteor.settings?.private?.auth0?.domain}/oauth/token`,
    userInfoEndpoint: `https://${Meteor.settings?.private?.auth0?.domain}/userinfo`,
    clientId: Meteor.settings?.private?.auth0?.clientId,
    clientSecret: Meteor.settings?.private?.auth0?.clientSecret,
    scope: 'openid profile email phone_number',
    // Custom identity verification rules
    customClaims: {
      identityVerified: 'https://auth0.com/identity_verified',
      verificationMethod: 'https://auth0.com/verification_method'
    }
  }
};

// SMART on FHIR specific configuration
export const SMARTConfig = {
  // SMART App Launch Framework
  iss: Meteor.settings?.public?.smartOnFhir?.iss || 'http://localhost:3000/fhir',
  redirectUri: Meteor.settings?.public?.smartOnFhir?.redirectUri || 'http://localhost:3000/smart-callback',
  
  // Patient matching specific scopes
  scopes: [
    'openid',
    'fhirUser',
    'launch',
    'patient/Patient.read',
    'patient/Patient.search',
    'system/Patient.match'  // Custom scope for matching
  ],
  
  // Identity verification extensions
  extensions: {
    identityAssurance: 'http://hl7.org/fhir/uv/ipa/StructureDefinition/identity-assurance-level',
    matchingMethod: 'http://hl7.org/fhir/us/identity-matching/StructureDefinition/matching-method'
  }
};

// Helper to get identity provider configuration
export function getIdentityProvider(provider) {
  if (!IdentityProviders[provider]) {
    throw new Error(`Unknown identity provider: ${provider}`);
  }
  return IdentityProviders[provider];
}
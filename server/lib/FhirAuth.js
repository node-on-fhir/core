// server/lib/FhirAuth.js
// Shared authentication and authorization module
// Extracted from server/FhirEndpoints.js so DicomEndpoints (and future HTTP endpoints)
// can share the same security pipeline: Bearer tokens, session auth, Basic auth,
// Consent-derived ACLs, SMART scopes, granular filtering, and rate limiting.

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';
import base64url from 'base64-url';
import { RateLimiter } from 'limiter';
import { AccessControl } from './CaslAccessControl.js';

import { OAuthClients } from '../../imports/collections/OAuthClients.js';
import { Consents } from '../../imports/lib/schemas/SimpleSchemas/Consents';
import FhirUtilities from '../../imports/lib/FhirUtilities.js';
import { SafeNoAuth } from '../SafeNoAuth';

import LoggerModule from '/imports/lib/Logger.js';
const log = LoggerModule.Logger.for('FhirAuth');

// =============================================================================
// Rate Limiter
// =============================================================================

const rateLimitTokens = get(Meteor, 'settings.private.fhir.rateLimit.tokensPerInterval', 1000);
const rateLimitInterval = get(Meteor, 'settings.private.fhir.rateLimit.interval', 'hour');
const limiter = new RateLimiter({ tokensPerInterval: rateLimitTokens, interval: rateLimitInterval });
log.info('Rate limiter configured', { tokensPerInterval: rateLimitTokens, interval: rateLimitInterval });

// =============================================================================
// Access Control (role-acl)
// =============================================================================

let accessControlList = [];
let accessControlListsInitialized = false;
let acl = new AccessControl();

function initializeAccessControl() {
  // Clear existing grants
  accessControlList = [];
  acl = new AccessControl();

  // Load consent records
  Consents.find({'category.coding.code': 'IDSCL'}).forEach(function(consentRecord){
    let aclRecord = FhirUtilities.consentIntoAccessControl(consentRecord);
    log.debug('Converting Consent to ACL record', { aclRecord });
    accessControlList.push(aclRecord);
  });

  if(accessControlList.length > 0){
    accessControlListsInitialized = true;
  }

  // Convert our access control list to proper grant format
  accessControlList.forEach(function(aclRecord) {
    log.debug('Processing ACL record', { aclRecord });

    if(aclRecord.role && aclRecord.resource && aclRecord.action) {
      // Grant the permission
      let grant = acl.grant(aclRecord.role)
        .execute(aclRecord.action)
        .on(aclRecord.resource, aclRecord.attributes || ['*']);

      // Add condition if present
      if(aclRecord.condition) {
        grant.when(aclRecord.condition);
      }

      log.info('Granted role permission', { role: aclRecord.role, action: aclRecord.action, resource: aclRecord.resource });
    }
  });

  // Always grant noauth role full access when NOAUTH is enabled
  if(SafeNoAuth.hasRequiredEnvironmentVars()) {
    log.info('NOAUTH mode enabled via SafeNoAuth - granting full access to noauth role');
    const fhirResources = ['Patient', 'Practitioner', 'Organization', 'Observation', 'Condition',
                          'Procedure', 'Medication', 'MedicationRequest', 'AllergyIntolerance',
                          'Immunization', 'DiagnosticReport', 'DocumentReference', 'SearchParameter',
                          'Bundle', 'CareTeam', 'CodeSystem', 'Communication', 'CommunicationRequest',
                          'Endpoint', 'HealthcareService', 'InsurancePlan', 'Location', 'OrganizationAffiliation',
                          'PractitionerRole', 'Provenance', 'Subscription', 'Task', 'StructureDefinition',
                          'ValueSet', 'VerificationResult'];
    fhirResources.forEach(function(resource) {
      acl.grant('noauth').execute('access').on(resource, ['*']);
    });
  }

  // Grant citizen role basic read access to public resources
  const publicResources = ['Practitioner', 'PractitionerRole', 'Organization', 'Location', 'HealthcareService', 'Endpoint'];
  publicResources.forEach(function(resource) {
    acl.grant('citizen').execute('access').on(resource, ['*']);
  });

  // For development with auto-login, grant the user role access
  if(process.env.DEV_AUTO_LOGIN === "true") {
    log.info('DEV_AUTO_LOGIN enabled - granting access to user role');
    const fhirResources = ['Patient', 'Practitioner', 'Organization', 'Observation', 'Condition',
                          'Procedure', 'Medication', 'MedicationRequest', 'AllergyIntolerance',
                          'Immunization', 'DiagnosticReport', 'DocumentReference'];
    fhirResources.forEach(function(resource) {
      acl.grant('user').execute('access').on(resource, ['*']);
    });
  }

  // Grant SYSTEM role full access to all resources
  log.info('Granting SYSTEM role full access to all resources');
  const allFhirResources = ['Patient', 'Practitioner', 'Organization', 'Observation', 'Condition',
                            'Procedure', 'Medication', 'MedicationRequest', 'MedicationStatement',
                            'AllergyIntolerance', 'Immunization', 'DiagnosticReport', 'DocumentReference',
                            'SearchParameter', 'Bundle', 'CareTeam', 'CarePlan', 'CodeSystem',
                            'Communication', 'CommunicationRequest', 'Composition', 'Consent',
                            'Encounter', 'Endpoint', 'Goal', 'Group', 'HealthcareService', 'ImagingStudy',
                            'InsurancePlan', 'List', 'Location', 'MeasureReport', 'Measure',
                            'NutritionOrder', 'OrganizationAffiliation', 'PractitionerRole',
                            'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson',
                            'RiskAssessment', 'ServiceRequest', 'StructureDefinition', 'Subscription',
                            'Task', 'ValueSet', 'VerificationResult',
                            'Binary', 'Coverage', 'Device', 'Media', 'MedicationDispense', 'Specimen'];
  allFhirResources.forEach(function(resource) {
    acl.grant('SYSTEM').execute('access').on(resource, ['*']);
  });

  // Define PAT role for unauthenticated requests (no permissions)
  log.info('Defining PAT role (no permissions - unauthenticated users)');
  acl.grant('PAT');

  // Grant 'patient' role access to USCDI resources for SMART on FHIR patient-level access
  log.info('Granting patient role access to USCDI resources');
  const patientAccessResources = [
    'Patient', 'AllergyIntolerance', 'CarePlan', 'CareTeam', 'Condition', 'Coverage',
    'Device', 'DiagnosticReport', 'DocumentReference', 'Encounter', 'Goal',
    'Immunization', 'ImagingStudy', 'Location', 'Medication', 'MedicationDispense', 'MedicationRequest',
    'Observation', 'Organization', 'Practitioner', 'PractitionerRole', 'Procedure',
    'Provenance', 'RelatedPerson', 'ServiceRequest', 'Media', 'Specimen'
  ];
  patientAccessResources.forEach(function(resource) {
    acl.grant('patient').execute('access').on(resource, ['*']);
  });

  // Grant 'healthcare practitioner' and 'healthcare provider' roles access to all FHIR resources
  log.info('Granting healthcare practitioner/provider roles access to all FHIR resources');
  allFhirResources.forEach(function(resource) {
    acl.grant('healthcare practitioner').execute('access').on(resource, ['*']);
    acl.grant('healthcare provider').execute('access').on(resource, ['*']);
  });

  log.info('ACL initialized', { aclRecordCount: accessControlList.length });
  log.info('Available roles', { roles: acl.getRoles() });
}

// Initialize ACL immediately (synchronously)
initializeAccessControl();

// Re-initialize on startup in case database wasn't ready
Meteor.startup(function() {
  initializeAccessControl();
});

// =============================================================================
// Helper: getAuthorizedRole
// =============================================================================

/**
 * Find the first authorized role from a user's roles array
 * Roles have semantic meaning:
 *   - 'user' = authenticated but no specific access level
 *   - 'patient' = can access own patient record
 *   - 'healthcare practitioner'/'healthcare provider' = can access all records
 * @param {Array} userRoles - The user's roles array
 * @returns {string} - The first matching authorized role, or 'patient' as default
 */
function getAuthorizedRole(userRoles) {
  const authorizedRoles = ['healthcare practitioner', 'healthcare provider', 'patient'];
  if (Array.isArray(userRoles)) {
    for (const role of authorizedRoles) {
      if (userRoles.includes(role)) {
        return role;
      }
    }
  }
  return 'patient'; // default if no authorized role found
}

// =============================================================================
// parseUserAuthorization - 4-method auth dispatcher
// =============================================================================

async function parseUserAuthorization(req){
  log.debug('Core FHIR API parsing user authorization');

  let authorizationContext = false;
  let authorizationContextToExport = false;

  // BASIC AUTH
  if(get(Meteor, 'settings.private.accessControl.enableBasicAuth') || process.env.DEV_AUTO_LOGIN === "true"){
    if(get(req, "headers.authorization")){
      let encodedAuth = get(req, "headers.authorization");
      let decodedAuth = base64url.decode(encodedAuth.replace("Basic ", ""))
      let authParts = decodedAuth.split(":");
      log.debug('Basic Auth detected', { username: authParts[0] });

      // First check if it's a dev auto-login user
      if(process.env.DEV_AUTO_LOGIN === "true" &&
         authParts[0] === process.env.DEV_AUTO_USERNAME &&
         authParts[1] === process.env.DEV_AUTO_PASSWORD) {
        log.debug('Dev auto-login credentials matched via Basic Auth');

        // Find the auto-created user
        const user = await Meteor.users.findOneAsync({username: process.env.DEV_AUTO_USERNAME});
        if(user) {
          authorizationContext = {
            role: getAuthorizedRole(get(user, 'roles', [])),
            userId: user._id,
            patientId: get(user, 'patientId'),
            practitionerId: get(user, 'practitionerId')
          };
          log.debug('Basic Auth successful for dev user', { username: authParts[0] });
        }
      }
      // Check for direct system credentials (for internal services)
      else if(authParts[0] === "system" && authParts[1] === get(Meteor, 'settings.private.accessControl.systemSecret', 'change-me-in-production')) {
        authorizationContext = {
          role: "SYSTEM",
          userId: "system",
          isSystemAccount: true
        };
        log.debug('System role authenticated via Basic Auth with direct credentials');
        log.warn('Basic Auth for system accounts is deprecated. Migrate to JWT/JWK authentication.');
      }
      // Then check OAuth clients
      else if(authParts[0] && OAuthClients){
        let clientRegistration = await OAuthClients.findOneAsync({client_id: authParts[0]})
        log.debug('Basic Auth OAuth client lookup', { client_id: authParts[0], found: !!clientRegistration });
        if(clientRegistration && authParts[1]){
          if(get(clientRegistration, 'client_secret') === authParts[1]){
            const clientRole = get(clientRegistration, 'role', 'healthcare provider');
            authorizationContext = {
              role: clientRole === 'system' ? 'SYSTEM' : clientRole,
              userId: authParts[0],
              isOAuthClient: true,
              clientId: authParts[0]
            };
            log.debug('Basic Auth OAuth client granted access', { role: clientRole });
          }
        }
      } else {
        log.debug('Basic Auth credentials did not match any known users or OAuth clients');
      }
    }
  }

  // BACKEND SERVICES (JWT)
  if(get(Meteor, 'settings.private.accessControl.enableJwtBackendServices')){
    if(get(req, "headers.authorization")){
      authorizationContext = {
        role: "system",
        userId: "system"
      };
      authorizationContextToExport = true;
    }
  }

  // BEARER TOKEN VALIDATION (SMART on FHIR / OAuth 2.0)
  const authHeader = get(req, 'headers.authorization', '');
  if (authHeader.startsWith('Bearer ') && !authorizationContext) {
    const bearerToken = authHeader.substring(7);
    log.debug('Bearer token detected', { prefix: bearerToken.substring(0, 8) });

    const oauthClient = await OAuthClients.findOneAsync({ access_token: bearerToken });

    if (oauthClient) {
      log.debug('Bearer token found for client', { client_id: oauthClient.client_id });

      // Check if authorization was revoked
      if (oauthClient.revoked_at) {
        log.debug('Bearer token revoked', { client_id: oauthClient.client_id, revoked_at: oauthClient.revoked_at });
      }
      // Check if authorization has expired (user-selected duration)
      else if (oauthClient.authorization_expires_at && new Date(oauthClient.authorization_expires_at) < new Date()) {
        log.debug('Bearer authorization expired', { client_id: oauthClient.client_id, expires_at: oauthClient.authorization_expires_at });
      }
      // Check if token is expired (system default timeout)
      else {
        const tokenCreatedAt = get(oauthClient, 'access_token_created_at');
        const expiresIn = get(Meteor, 'settings.private.fhir.tokenTimeout', 86400);
        const isExpired = tokenCreatedAt && (new Date() - new Date(tokenCreatedAt)) > (expiresIn * 1000);

        if (isExpired) {
          log.debug('Bearer token expired', { client_id: oauthClient.client_id });
        } else {
          authorizationContext = {
            role: 'patient',
            userId: oauthClient.user_id || oauthClient.client_id,
            patientId: oauthClient.patient_id || '',
            clientId: oauthClient.client_id,
            scope: oauthClient.requested_scope || oauthClient.scope || '',
            isOAuthToken: true
          };
          log.debug('Bearer token authenticated. Role: patient, Patient ID:', { patientId: authorizationContext.patientId });
        }
      }
    } else {
      log.debug('Bearer token not found in OAuthClients collection');
    }

    // Fallback: try Bearer token as a Meteor login token
    if (!authorizationContext) {
      log.debug('Trying Bearer token as Meteor login token');
      try {
        const hashedToken = Accounts._hashLoginToken(bearerToken);
        const user = await Meteor.users.findOneAsync({
          'services.resume.loginTokens.hashedToken': hashedToken
        });

        if (user) {
          log.debug('Meteor login token authenticated', { username: user.username });
          const authorizedRole = getAuthorizedRole(get(user, 'roles', []));
          authorizationContext = {
            role: authorizedRole,
            userId: user._id,
            patientId: get(user, 'patientId', ''),
            practitionerId: get(user, 'practitionerId', '')
          };
        } else {
          log.debug('Bearer token is not a valid Meteor login token either');
        }
      } catch (meteorAuthError) {
        log.warn('Error checking Meteor login token', { error: meteorAuthError.message });
      }
    }
  }

  log.trace('req.query', { query: req.query });
  log.trace('req.body', { body: req.body });

  // SESSION TOKEN (Meteor login token via session header)
  //
  // july-fix-now #2 (2026-07-23): a fossil jwt.decode() block lived here from
  // an abandoned SMART session-JWT design — it decoded the attacker-controlled
  // `session` header WITHOUT signature validation into variables that were
  // never consumed (verified: no jwt.sign site anywhere produces the
  // {data:{token,userId}} shape, and nothing read the decoded values). It has
  // been DELETED rather than upgraded to jwt.verify: there is no signing
  // counterpart to verify against, and removing the decode makes the
  // "future change trusts a forgeable claim" failure mode impossible.
  // The real authentication below treats the header value as a Meteor login
  // token: hash -> services.resume.loginTokens lookup.
  log.debug('Trying SMART on FHIR OAuth session token');
  let sessionToken = get(req, 'headers.session');

  log.debug('SmartOnFHIR.sessionToken', { hasToken: !!sessionToken });

  // Simple session token authentication using Meteor's login tokens
  if(sessionToken && !authorizationContext){
    log.debug('Checking session token authentication');
    log.debug('Session token prefix', { prefix: sessionToken.substring(0, 20) });

    const hashedToken = Accounts._hashLoginToken(sessionToken);
    log.debug('Session token hashed successfully');

    const user = await Meteor.users.findOneAsync({
      'services.resume.loginTokens.hashedToken': hashedToken
    });

    if(user) {
      log.debug('Session token authenticated', { username: user.username });
      const authorizedRole = getAuthorizedRole(get(user, 'roles', []));
      log.debug('Authorized role from session', { authorizedRole });
      authorizationContext = {
        role: authorizedRole,
        userId: user._id,
        patientId: get(user, 'patientId', ''),
        practitionerId: get(user, 'practitionerId', '')
      };
    } else {
      log.debug('Session token not found or expired');
      const anyUserWithTokens = await Meteor.users.findOneAsync({
        'services.resume.loginTokens': { $exists: true, $ne: [] }
      });
      if(anyUserWithTokens){
        log.debug('Debug: Found user with tokens', { username: anyUserWithTokens.username });
        log.debug('Debug: user hashed token count', { tokenCount: get(anyUserWithTokens, 'services.resume.loginTokens', []).length });
      }
    }
  }

  if (get(Meteor, 'settings.private.fhir.disableOauth') === true) {
    if (!authorizationContext) {
      authorizationContext = {
        role: 'noauth',
        userId: null
      };
    }
  }

  if (SafeNoAuth.isEnabled(req)) {
    if (!authorizationContext) {
      authorizationContext = {
        role: 'noauth',
        userId: null
      };
    }
  }

  return authorizationContext;
}

// =============================================================================
// isAuthorized
// =============================================================================

async function isAuthorized(authorizationContext){
  const authorizedRoles = ['noauth', 'system', 'SYSTEM', 'patient', 'healthcare practitioner', 'healthcare provider'];
  if(authorizedRoles.includes(get(authorizationContext, 'role'))){
    return true;
  } else {
    return false;
  }
}

// =============================================================================
// isResourceScopeAuthorized - SMART scope check for OAuth tokens
// =============================================================================

function isResourceScopeAuthorized(authorizationContext, resourceType) {
  // If not an OAuth token request, allow all resources (internal/session auth)
  if (!get(authorizationContext, 'isOAuthToken')) {
    return true;
  }

  const scope = get(authorizationContext, 'scope', '');
  if (!scope) {
    log.warn('isResourceScopeAuthorized: No scope found in authorization context');
    return false;
  }

  const scopes = scope.split(' ').filter(function(s) { return s.trim(); });

  // Check for wildcard scopes
  const hasWildcard = scopes.some(function(s) {
    return s.match(/^(patient|user|system)\/\*\.(rs|read|write|\*)$/);
  });

  if (hasWildcard) {
    return true;
  }

  // Check for specific resource scope
  const resourceScopePatterns = [
    `patient/${resourceType}.rs`,
    `patient/${resourceType}.read`,
    `patient/${resourceType}.cruds`,
    `user/${resourceType}.rs`,
    `user/${resourceType}.read`,
    `user/${resourceType}.cruds`,
    `system/${resourceType}.rs`,
    `system/${resourceType}.read`,
    `system/${resourceType}.cruds`
  ];

  const isAuthorizedForResource = scopes.some(function(s) {
    return resourceScopePatterns.includes(s);
  });

  if (!isAuthorizedForResource) {
    log.debug('isResourceScopeAuthorized: Resource not authorized', { resourceType, scope });
  }

  // SMART 2.x: Also check for granular scopes with query parameters
  const hasGranularScope = scopes.some(function(s) {
    const baseScope = s.split('?')[0];
    return resourceScopePatterns.includes(baseScope);
  });

  if (hasGranularScope) {
    return true;
  }

  return isAuthorizedForResource;
}

// =============================================================================
// SMART 2.x Granular Scopes Support
// =============================================================================

/**
 * Parse a SMART 2.x granular scope into its components
 * @param {string} scope - e.g., "patient/Condition.rs?category=health-concern"
 * @returns {Object|null} - Parsed scope or null if not a valid granular scope
 */
function parseGranularScope(scope) {
  if (!scope || typeof scope !== 'string') {
    return null;
  }

  const questionMarkIndex = scope.indexOf('?');
  if (questionMarkIndex === -1) {
    return null;
  }

  const baseScope = scope.substring(0, questionMarkIndex);
  const queryString = scope.substring(questionMarkIndex + 1);

  const baseScopeMatch = baseScope.match(/^(patient|user|system)\/([A-Za-z]+)\.(rs|read|write|cruds|\*)$/);
  if (!baseScopeMatch) {
    log.warn('[GranularScope] Invalid base scope format', { baseScope });
    return null;
  }

  const context = baseScopeMatch[1];
  const resourceType = baseScopeMatch[2];
  const permission = baseScopeMatch[3];

  const filters = {};
  const params = queryString.split('&');
  params.forEach(function(param) {
    const equalsIndex = param.indexOf('=');
    if (equalsIndex !== -1) {
      const key = decodeURIComponent(param.substring(0, equalsIndex));
      const value = decodeURIComponent(param.substring(equalsIndex + 1));
      filters[key] = value;
    }
  });

  return {
    context: context,
    resourceType: resourceType,
    permission: permission,
    filters: filters,
    original: scope
  };
}

/**
 * Get all granular scope filters for a specific resource type
 * @param {Object} authContext - Authorization context with scope
 * @param {string} resourceType - e.g., "Condition"
 * @returns {Array} - Array of filter objects, empty if no granular scopes
 */
function getGranularFiltersForResource(authContext, resourceType) {
  const granularFilters = [];

  if (!get(authContext, 'isOAuthToken')) {
    return granularFilters;
  }

  const scope = get(authContext, 'scope', '');
  if (!scope) {
    return granularFilters;
  }

  const scopes = scope.split(' ').filter(function(s) { return s.trim(); });

  const hasWildcard = scopes.some(function(s) {
    return s.match(/^(patient|user|system)\/\*\.(rs|read|write|\*)$/);
  });
  if (hasWildcard) {
    return granularFilters;
  }

  const hasFullResourceScope = scopes.some(function(s) {
    const pattern = new RegExp(`^(patient|user|system)/${resourceType}\\.(rs|read|write|cruds|\\*)$`);
    return pattern.test(s) && !s.includes('?');
  });
  if (hasFullResourceScope) {
    return granularFilters;
  }

  scopes.forEach(function(s) {
    const parsed = parseGranularScope(s);
    if (parsed && parsed.resourceType === resourceType && Object.keys(parsed.filters).length > 0) {
      granularFilters.push(parsed.filters);
      log.debug('[GranularScope] Found filter for resource', { resourceType, filters: parsed.filters });
    }
  });

  return granularFilters;
}

/**
 * Check if a resource matches a granular scope filter
 * @param {Object} resource - FHIR resource
 * @param {Object} filter - Filter object, e.g., { category: "health-concern" }
 * @returns {boolean}
 */
function resourceMatchesGranularFilter(resource, filter) {
  for (const [param, requiredValue] of Object.entries(filter)) {
    const fieldValue = get(resource, param);

    if (!fieldValue) {
      return false;
    }

    if (Array.isArray(fieldValue)) {
      const matches = fieldValue.some(function(cc) {
        return codeableConceptMatchesValue(cc, requiredValue);
      });
      if (!matches) {
        return false;
      }
    } else if (typeof fieldValue === 'object' && (fieldValue.coding || fieldValue.text)) {
      if (!codeableConceptMatchesValue(fieldValue, requiredValue)) {
        return false;
      }
    } else if (typeof fieldValue === 'string') {
      if (fieldValue !== requiredValue && !requiredValue.endsWith('|' + fieldValue)) {
        return false;
      }
    } else {
      log.warn('[GranularScope] Unknown field type', { param, fieldType: typeof fieldValue });
      return false;
    }
  }

  return true;
}

/**
 * Check if a CodeableConcept matches a scope value
 * Value can be: bare code, system|code, or system| (any code in system)
 * @param {Object} codeableConcept - FHIR CodeableConcept
 * @param {string} value - Scope filter value
 * @returns {boolean}
 */
function codeableConceptMatchesValue(codeableConcept, value) {
  if (!codeableConcept) {
    return false;
  }

  if (codeableConcept.text && codeableConcept.text === value) {
    return true;
  }

  const codings = codeableConcept.coding || [];
  if (!Array.isArray(codings)) {
    return false;
  }

  const pipeIndex = value.indexOf('|');
  let requiredSystem = null;
  let requiredCode = value;

  if (pipeIndex !== -1) {
    requiredSystem = value.substring(0, pipeIndex);
    requiredCode = value.substring(pipeIndex + 1);
  }

  return codings.some(function(coding) {
    if (requiredSystem && coding.system !== requiredSystem) {
      return false;
    }

    if (requiredCode === '') {
      return requiredSystem ? coding.system === requiredSystem : false;
    }

    return coding.code === requiredCode;
  });
}

/**
 * Apply granular scope filters to a set of resources
 * Resources must match at least one of the granular filters (OR logic)
 * @param {Array} resources - Array of FHIR resources
 * @param {Array} granularFilters - Array of filter objects
 * @returns {Array} - Filtered resources
 */
function applyGranularScopeFilters(resources, granularFilters) {
  if (!granularFilters || granularFilters.length === 0) {
    return resources;
  }

  if (!Array.isArray(resources)) {
    return resources;
  }

  const filteredResources = resources.filter(function(resource) {
    return granularFilters.some(function(filter) {
      return resourceMatchesGranularFilter(resource, filter);
    });
  });

  log.debug('[GranularScope] Filtered resources by granular filters', { before: resources.length, after: filteredResources.length, filterCount: granularFilters.length });

  return filteredResources;
}

// =============================================================================
// EHI Export Authorization
// =============================================================================

/**
 * Check if authorization context allows $ehi-export for a given patient.
 *
 * Unlike Group/$export (backend-services-only), $ehi-export is also available
 * to patients exporting their own data.
 *
 * Accepted when ANY of these is true:
 *   - Scope includes 'patient/$ehi-export' (patient exporting self)
 *   - Scope includes any 'system/' scope (backend services)
 *   - Role is an elevated role (noauth, healthcare provider, practitioner, SYSTEM, admin)
 *
 * For patient-scoped tokens the caller must additionally verify that
 * authorizationContext.patientId matches the requested patientId.
 *
 * @param {Object} authorizationContext - Parsed authorization context
 * @returns {boolean}
 */
function isEhiExportAuthorized(authorizationContext) {
  if (!authorizationContext) {
    return false;
  }

  const role = get(authorizationContext, 'role', '');
  const scope = get(authorizationContext, 'scope', '');

  // Elevated roles always have access
  const elevatedRoles = ['noauth', 'SYSTEM', 'system', 'healthcare provider', 'healthcare practitioner', 'admin'];
  if (elevatedRoles.includes(role)) {
    log.debug('EHI export authorized via elevated role', { role });
    return true;
  }

  // Check for explicit $ehi-export scope
  if (scope.includes('patient/$ehi-export')) {
    log.debug('EHI export authorized via patient/$ehi-export scope');
    return true;
  }

  // Check for system-level scopes (backend services)
  if (scope.includes('system/')) {
    log.debug('EHI export authorized via system scope');
    return true;
  }

  // Check for wildcard patient scopes that imply full data access
  if (scope.includes('patient/*.read') || scope.includes('patient/*.rs') || scope.includes('patient/*.*')) {
    log.debug('EHI export authorized via patient wildcard scope');
    return true;
  }

  log.debug('EHI export not authorized', { role, scope });
  return false;
}

// =============================================================================
// Exports
// =============================================================================

log.info('Shared auth module loaded');

export {
  // Rate limiting
  limiter,

  // Access control
  acl,
  initializeAccessControl,
  accessControlList,
  accessControlListsInitialized,

  // Auth functions
  getAuthorizedRole,
  parseUserAuthorization,
  isAuthorized,
  isResourceScopeAuthorized,

  // EHI export
  isEhiExportAuthorized,

  // Granular scopes
  parseGranularScope,
  getGranularFiltersForResource,
  resourceMatchesGranularFilter,
  codeableConceptMatchesValue,
  applyGranularScopeFilters
};

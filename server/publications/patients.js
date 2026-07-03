// server/publications/patients.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

const log = (Meteor.Logger ? Meteor.Logger.for('patients') : console);

/**
 * PRACTITIONER ACCESS CONTROL
 * ===========================
 * Controls how healthcare practitioners and providers access patient records.
 *
 * OPTION 1: Full Access (default)
 * Setting: Meteor.settings.private.accessControl.practitionerFullAccess = true
 * Behavior: Practitioners can view ALL patients in the system.
 * Use case: Small clinics, development, situations where all practitioners
 *           need visibility across the entire patient population.
 *
 * OPTION 2: Assigned Patients Only
 * Setting: Meteor.settings.private.accessControl.practitionerFullAccess = false
 * Behavior: Practitioners can ONLY view patients where:
 *   - Patient.generalPractitioner.reference matches "Practitioner/{practitionerId}"
 *   - OR patient record has meta.security.display = "unrestricted"
 * Use case: Large healthcare systems, multi-tenant deployments, HIPAA-compliant
 *           environments where practitioners should only see their own patients.
 *
 * NOTE: This setting only affects DDP pub/sub access (UI). REST API access
 * is controlled by FhirEndpoints.js which has similar logic.
 */

/**
 * Determines the user's authorized role based on priority.
 * Role priority: healthcare practitioner > healthcare provider > patient
 * This mirrors the logic in FhirEndpoints.js getAuthorizedRole()
 * @param {Array} userRoles - The user's roles array from Meteor.users
 * @returns {string} - The highest priority role found, or 'patient' as default
 */
function getAuthorizedRole(userRoles) {
  if (!Array.isArray(userRoles)) return 'patient';

  // Normalize: check for practitioner/provider roles in various formats
  const practitionerVariants = ['healthcare practitioner', 'healthcare-practitioner', 'practitioner'];
  const providerVariants = ['healthcare provider', 'healthcare-provider'];

  for (const role of userRoles) {
    if (practitionerVariants.includes(role)) {
      return 'healthcare practitioner';
    }
  }
  for (const role of userRoles) {
    if (providerVariants.includes(role)) {
      return 'healthcare provider';
    }
  }
  if (userRoles.includes('patient')) {
    return 'patient';
  }
  return 'patient'; // default if no authorized role found
}

// Log dedup: only warn once per user per server restart
const _warnedNoPatientId = new Set();

// Main patients publication with search and filtering
Meteor.publish('patients.search', async function(query = {}, options = {}) {
  // Check if PatientDirectory module is enabled on the server
  const patientDirectoryEnabled = get(Meteor, 'settings.private.modules.PatientDirectory', false);
  if (!patientDirectoryEnabled) {
    console.warn('[patients.search] Patient Directory module is disabled in private settings'); // phi-audit: ok
    this.error(new Meteor.Error('module-disabled', 'Could not establish subscription to the Patient Directory.'));
    return;
  }

  // Check if user is authenticated
  if (!this.userId) {
    // In production, always require authentication
    if (get(Meteor, 'settings.public.environment') === 'production') {
      console.log('Unauthorized access attempt to patients.search'); // phi-audit: ok
      return this.ready();
    }

    // In development, check if we should allow unauthenticated access
    const isDevelopment = get(Meteor, 'settings.public.environment') === 'development' ||
                         process.env.NODE_ENV === 'development';
    const allowDevAccess = get(Meteor, 'settings.public.modules.fhir.Patients.allowUnauthenticatedAccess', false);

    if (!isDevelopment || !allowDevAccess) {
      console.log('Authentication required for patients.search'); // phi-audit: ok
      return this.ready();
    }

    console.log('Allowing unauthenticated access to patients.search in development mode'); // phi-audit: ok
  }

  // Validate parameters
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));

  // Default options - use configured subscriptionLimit
  const defaultLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);
  options = Object.assign({
    limit: defaultLimit,
    // Sort by meta.lastUpdated with _id fallback for records without meta.lastUpdated (e.g., Synthea imports)
    sort: { 'meta.lastUpdated': -1, '_id': -1 }
  }, options);

  // Apply reasonable limits - cap at configured subscriptionLimit
  if (options.limit > defaultLimit) {
    options.limit = defaultLimit;
  }

  // Transform query to handle ObjectID and improve search
  if (query.$or && Array.isArray(query.$or)) {
    const expandedConditions = [];

    query.$or.forEach(condition => {
      // Always add the original condition
      expandedConditions.push(condition);

      // Handle _id ObjectID conversion
      if (condition._id && typeof condition._id === 'string' && /^[a-f\d]{24}$/i.test(condition._id)) {
        // Also search for ObjectID version
        expandedConditions.push({ ...condition, _id: new Mongo.ObjectID(condition._id) });
      }

      // Handle id field that might be stored as _id
      if (condition.id && typeof condition.id === 'string' && /^[a-f\d]{24}$/i.test(condition.id)) {
        // Also search _id field with both string and ObjectID versions
        expandedConditions.push({ _id: condition.id });
        expandedConditions.push({ _id: new Mongo.ObjectID(condition.id) });
      }

      // Improve name search to handle nested arrays
      if (condition['name.text'] && condition['name.text'].$regex) {
        // Add variations for array access
        expandedConditions.push({ 'name.0.text': condition['name.text'] });
      }
      if (condition['name.family'] && condition['name.family'].$regex) {
        expandedConditions.push({ 'name.0.family': condition['name.family'] });
      }
      if (condition['name.given'] && condition['name.given'].$regex) {
        expandedConditions.push({ 'name.0.given': condition['name.given'] });
        expandedConditions.push({ 'name.0.given.0': condition['name.given'] });
      }
    });

    query.$or = expandedConditions;
  }

  // Log the publication request
  console.log('========== patients.search publication =========='); // phi-audit: ok
  console.log('Received query:', JSON.stringify(query, null, 2)); // phi-audit: ok
  console.log('Options:', JSON.stringify(options)); // phi-audit: ok
  log.debug('userId:', { userId: this.userId });

  // Role-based access control (mirrors FhirEndpoints.js pattern)
  if (this.userId) {
    const user = await Meteor.users.findOneAsync(this.userId);

    if (user) {
      const authorizedRole = getAuthorizedRole(get(user, 'roles', []));
      log.debug('User authorized role:', { authorizedRole, userId: this.userId });

      // Healthcare practitioners/providers access
      if (authorizedRole === 'healthcare practitioner' || authorizedRole === 'healthcare provider') {
        const practitionerFullAccess = get(Meteor, 'settings.private.accessControl.practitionerFullAccess', true);

        if (practitionerFullAccess) {
          // Full access - no restrictions, query passes through as-is
          console.log('Practitioner access (full) - no patient restrictions applied'); // phi-audit: ok
        } else {
          // Assigned patients only - filter by generalPractitioner.reference
          const practitionerId = user.practitionerId;

          if (practitionerId) {
            const practitionerQuery = {
              $or: [
                // Unrestricted records are visible to all authorized users
                { 'meta.security.display': 'unrestricted' },
                // Patients explicitly assigned to this practitioner
                { 'generalPractitioner.reference': `Practitioner/${practitionerId}` },
                { 'generalPractitioner.reference': { $regex: practitionerId } }
              ]
            };

            if (Object.keys(query).length > 0) {
              query = { $and: [practitionerQuery, query] };
              console.log('Practitioner access (assigned-only) - filtering by assignment'); // phi-audit: ok
            } else {
              query = practitionerQuery;
            }
          } else {
            // Practitioner role but no practitionerId - show unrestricted only
            query = { 'meta.security.display': 'unrestricted' };
            console.log('Practitioner role but no practitionerId - showing unrestricted only'); // phi-audit: ok
          }
        }
      } else if (authorizedRole === 'patient') {
        // Patients can ONLY see their own record
        const patientId = user.patientId;

        if (patientId) {
          const patientQuery = {
            $or: [
              { _id: patientId },
              { id: patientId }
            ]
          };

          // Handle ObjectID format
          if (/^[a-f\d]{24}$/i.test(patientId)) {
            patientQuery.$or.push({ _id: new Mongo.ObjectID(patientId) });
          }

          if (Object.keys(query).length > 0) {
            query = { $and: [patientQuery, query] };
            console.log('Patient role - combining search with patient restriction'); // phi-audit: ok
          } else {
            query = patientQuery;
            console.log('Patient role - restricting to own record:', patientId); // phi-audit: ok
          }
        } else {
          if (!_warnedNoPatientId.has(this.userId)) {
            console.log('Patient role but no patientId - returning empty:', this.userId); // phi-audit: ok
            _warnedNoPatientId.add(this.userId);
          }
          return this.ready();
        }
      } else {
        // Unknown role - deny access
        console.log('Unknown role - returning empty:', authorizedRole);
        return this.ready();
      }
    } else {
      console.log('User not found - returning empty');
      return this.ready();
    }
  }

  console.log('Final query being executed:', JSON.stringify(query, null, 2));
  console.log('=================================================');

  return Patients.find(query, options);
});

// Simple publication for all patients (development only)
Meteor.publish('patients.all', function() {
  // This publication should only be available in development
  const isProduction = get(Meteor, 'settings.public.environment') === 'production';
  const isDevelopment = !isProduction && (
    get(Meteor, 'settings.public.environment') === 'development' ||
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  );

  if (isProduction) {
    console.error('patients.all publication is not available in production');
    return this.ready();
  }

  if (!isDevelopment) {
    console.error('patients.all publication is only available in development');
    return this.ready();
  }

  // In development, optionally require authentication
  const requireAuth = get(Meteor, 'settings.public.modules.fhir.Patients.requireAuthInDev', false);
  if (requireAuth && !this.userId) {
    console.log('Authentication required for patients.all in development');
    return this.ready();
  }

  console.log('Publishing all patients for development');
  return Patients.find({}, { limit: 1000, sort: { '_id': -1 } });
});

// Publication for a single patient by ID
Meteor.publish('patients.byId', async function(patientId) {
  check(patientId, String);

  if (!this.userId) {
    console.log('Authentication required for patients.byId');
    return this.ready();
  }

  // TODO: Check if user has access to this specific patient
  const user = await Meteor.users.findOneAsync(this.userId);

  // Patients can only see their own record
  if (user && user.patientId && user.patientId !== patientId) {
    console.log('User attempted to access another patient record');
    return this.ready();
  }

  log.debug('Publishing patient by ID:', { patientId });

  // Build query to handle different ID formats
  const conditions = [
    { _id: patientId },
    { id: patientId }
  ];

  // If patientId looks like an ObjectID, also search with ObjectID type
  if (/^[a-f\d]{24}$/i.test(patientId)) {
    conditions.push({ _id: new Mongo.ObjectID(patientId) });
  }

  // Try to find by _id or id field with different formats
  return Patients.find({
    $or: conditions
  }, { limit: 1 });
});

// Publication for patients assigned to a practitioner
Meteor.publish('patients.forPractitioner', async function(practitionerId) {
  check(practitionerId, Match.Maybe(String));

  if (!this.userId) {
    console.log('Authentication required for patients.forPractitioner'); // phi-audit: ok
    return this.ready();
  }

  // If no practitionerId provided, use the current user's practitionerId
  if (!practitionerId) {
    const user = await Meteor.users.findOneAsync(this.userId);
    practitionerId = user && user.practitionerId;

    if (!practitionerId) {
      console.log('User is not a practitioner');
      return this.ready();
    }
  }

  // TODO: Verify that the current user has access to this practitioner's patients

  log.debug('Publishing patients for practitioner:', { practitionerId });

  // Find patients where this practitioner is the general practitioner
  return Patients.find({
    'generalPractitioner.reference': `Practitioner/${practitionerId}`
  }, {
    limit: 500,
    sort: { 'name.0.family': 1, 'name.0.given.0': 1 }
  });
});

// Publication for patients in a care team
Meteor.publish('patients.forCareTeam', function(careTeamId) {
  check(careTeamId, String);

  if (!this.userId) {
    console.log('Authentication required for patients.forCareTeam'); // phi-audit: ok
    return this.ready();
  }

  // TODO: Verify that the current user is a member of this care team

  log.debug('Publishing patients for care team:', { careTeamId });

  // This would need to be implemented based on your care team structure
  // For now, return empty
  return this.ready();
});

console.log('Patient publications registered'); // phi-audit: ok

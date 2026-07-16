// npmPackages/hipaa-compliance/lib/SecurityValidators.js
//
// Fail-closed authorization for audit data. Every can*() check is async and
// denies unless an affirmative role match is found. Roles come from the union
// of alanning:roles v4 assignments (NodeOnFHIR core) and the plain user.roles
// array that accounts-server assigns at user creation — covering both role
// storage conventions without a data migration.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { UserRoles } from './Constants';

const log = (Meteor.Logger ? Meteor.Logger.for('hipaa-compliance') : console);

function getRolesPackage() {
  try {
    return (typeof Package !== 'undefined' && Package['alanning:roles'])
      ? Package['alanning:roles'].Roles
      : null;
  } catch (e) {
    return null;
  }
}

// Security validation utilities
export const SecurityValidators = {
  // Union of alanning:roles assignments and the user document's roles array.
  // Fail-closed: any lookup failure yields [] (deny).
  getUserRoles: async function(userId) {
    if (!userId) {
      return [];
    }

    const roles = new Set();

    try {
      const Roles = getRolesPackage();
      if (Roles && typeof Roles.getRolesForUserAsync === 'function') {
        const assigned = await Roles.getRolesForUserAsync(userId);
        (assigned || []).forEach(function(role) { roles.add(role); });
      }

      const user = await Meteor.users.findOneAsync(userId, { fields: { roles: 1 } });
      (get(user, 'roles', []) || []).forEach(function(role) { roles.add(role); });
    } catch (error) {
      log.warn('Role lookup failed — denying audit access', { userId, error: error && error.message });
      return [];
    }

    return Array.from(roles);
  },

  hasAnyRole: async function(userId, allowedRoles) {
    const roles = await this.getUserRoles(userId);
    const granted = roles.some(function(role) { return allowedRoles.includes(role); });
    if (!granted) {
      log.warn('Audit authorization denied', { userId, allowedRoles, userRoles: roles });
    }
    return granted;
  },

  // Check if user can view audit logs
  canViewAuditLog: async function(userId) {
    if (!userId) {
      return false;
    }

    return this.hasAnyRole(userId, [
      UserRoles.ADMIN,
      UserRoles.COMPLIANCE_OFFICER,
      UserRoles.HIPAA_OFFICER,
      UserRoles.AUDITOR
    ]);
  },

  // Check if user can export audit data (more restrictive)
  canExportAuditData: async function(userId) {
    if (!userId) {
      return false;
    }

    return this.hasAnyRole(userId, [
      UserRoles.ADMIN,
      UserRoles.COMPLIANCE_OFFICER,
      UserRoles.HIPAA_OFFICER
    ]);
  },

  // Check if user can modify audit settings (admins only)
  canModifyAuditSettings: async function(userId) {
    if (!userId) {
      return false;
    }

    return this.hasAnyRole(userId, [UserRoles.ADMIN]);
  },

  // Check if user can view patient-specific audits
  canViewPatientAudits: async function(userId, patientId) {
    if (!userId) {
      return false;
    }

    const roles = await this.getUserRoles(userId);

    // Admins and compliance officers can view all
    if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.COMPLIANCE_OFFICER)) {
      return true;
    }

    // Clinicians can view their assigned patients
    if (roles.includes(UserRoles.CLINICIAN)) {
      return await this.isAssignedToPatient(userId, patientId);
    }

    // Patients can view their own audit logs
    if (roles.includes(UserRoles.PATIENT)) {
      return await this.isPatientUser(userId, patientId);
    }

    log.warn('Patient audit access denied', { userId, patientId, userRoles: roles });
    return false;
  },

  // Check if user is assigned to patient (care team member)
  isAssignedToPatient: async function(userId, patientId) {
    if (Meteor.isServer) {
      // Check care team assignments
      const CareTeams = get(global, 'Collections.CareTeams');
      if (CareTeams) {
        const careTeam = await CareTeams.findOneAsync({
          'patient.reference': `Patient/${patientId}`,
          'participant.member.reference': `Practitioner/${userId}`,
          status: 'active'
        });
        return !!careTeam;
      }
    }
    return false;
  },

  // Check if user is the patient
  isPatientUser: async function(userId, patientId) {
    if (Meteor.isServer) {
      const user = await Meteor.users.findOneAsync(userId);
      return get(user, 'profile.patientId') === patientId;
    }
    return false;
  },

  // Validate current user context
  validateCurrentUser: async function(context) {
    const { userId } = context;

    if (!userId) {
      throw new Meteor.Error('unauthorized', 'Authentication required');
    }

    const user = await Meteor.users.findOneAsync(userId);
    if (!user) {
      throw new Meteor.Error('invalid-user', 'User not found');
    }

    // Check if account is active
    if (get(user, 'profile.accountLocked', false)) {
      throw new Meteor.Error('account-locked', 'Account is locked');
    }

    // Check session validity
    if (get(Meteor, 'settings.public.hipaa.security.requireSecondaryAuth', false)) {
      this.validateSecondaryAuth(user);
    }

    return user;
  },

  // Validate secondary authentication
  validateSecondaryAuth: function(user) {
    // Check for recent 2FA validation
    const lastAuth = get(user, 'profile.lastSecondaryAuth');
    if (!lastAuth) {
      throw new Meteor.Error('secondary-auth-required', 'Secondary authentication required');
    }

    const authTimeout = get(Meteor, 'settings.public.hipaa.security.authTimeoutMinutes', 30);
    const minutesSinceAuth = (new Date() - new Date(lastAuth)) / 1000 / 60;

    if (minutesSinceAuth > authTimeout) {
      throw new Meteor.Error('secondary-auth-expired', 'Secondary authentication expired');
    }
  },

  // Check if debug access is allowed
  isDebugAccessAllowed: async function(userId) {
    // Only in development environment
    const isDevelopment = get(Meteor, 'settings.public.hipaa.compliance.environment') === 'development';
    const debugEnabled = get(Meteor, 'settings.private.hipaa.security.allowDebugAccess', false);

    if (!isDevelopment || !debugEnabled) {
      return false;
    }
    return await this.canModifyAuditSettings(userId);
  },

  // Validate export request
  validateExportRequest: async function(userId, exportOptions) {
    // Check basic permissions
    if (!(await this.canExportAuditData(userId))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to export audit data');
    }

    // Validate export size
    const maxRecords = get(Meteor, 'settings.private.hipaa.reporting.maxExportRecords', 10000);
    if (exportOptions.limit > maxRecords) {
      throw new Meteor.Error('export-limit-exceeded', `Export limit is ${maxRecords} records`);
    }

    // Check if approval is required
    const requireApproval = get(Meteor, 'settings.private.hipaa.reporting.requireApprovalForExport', false);
    if (requireApproval && !exportOptions.approvalId) {
      throw new Meteor.Error('approval-required', 'Export approval required');
    }

    return true;
  },

  // Generate security context for audit events
  generateSecurityContext: async function(userId) {
    const user = await Meteor.users.findOneAsync(userId);

    return {
      userId: userId,
      userName: user?.username || get(user, 'emails[0].address'),
      userRoles: await this.getUserRoles(userId),
      timestamp: new Date(),
      environment: get(Meteor, 'settings.public.hipaa.compliance.environment', 'production')
    };
  }
};

// packages/hipaa-compliance/lib/SecurityValidators.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { UserRoles } from './Constants';

// Try to import Roles if available
let Roles;
try {
  Roles = Package['alanning:roles']?.Roles;
} catch (e) {
  // Roles package not available
  console.warn('alanning:roles package not available, role-based security will be disabled');
}

// Security validation utilities
export const SecurityValidators = {
  // Check if user can view audit logs
  canViewAuditLog: function(userId) {
    if (!userId) {
      return false;
    }
    
    // Check for required roles
    const allowedRoles = [
      UserRoles.ADMIN,
      UserRoles.COMPLIANCE_OFFICER,
      UserRoles.HIPAA_OFFICER,
      UserRoles.AUDITOR
    ];
    
    return Roles ? Roles.userIsInRole(userId, allowedRoles) : true; // Allow if no roles package
  },

  // Check if user can export audit data
  canExportAuditData: function(userId) {
    if (!userId) {
      return false;
    }
    
    // More restrictive for exports
    const allowedRoles = [
      UserRoles.ADMIN,
      UserRoles.COMPLIANCE_OFFICER,
      UserRoles.HIPAA_OFFICER
    ];
    
    return Roles ? Roles.userIsInRole(userId, allowedRoles) : false; // Deny exports if no roles
  },

  // Check if user can modify audit settings
  canModifyAuditSettings: function(userId) {
    if (!userId) {
      return false;
    }
    
    // Only admins can modify settings
    return Roles ? Roles.userIsInRole(userId, [UserRoles.ADMIN]) : false; // Deny settings if no roles
  },

  // Check if user can view patient-specific audits
  canViewPatientAudits: function(userId, patientId) {
    if (!userId) {
      return false;
    }
    
    // Admins and compliance officers can view all
    if (Roles && Roles.userIsInRole(userId, [UserRoles.ADMIN, UserRoles.COMPLIANCE_OFFICER])) {
      return true;
    }
    
    // Clinicians can view their assigned patients
    if (Roles && Roles.userIsInRole(userId, [UserRoles.CLINICIAN])) {
      return this.isAssignedToPatient(userId, patientId);
    }
    
    // Patients can view their own audit logs
    if (Roles && Roles.userIsInRole(userId, [UserRoles.PATIENT])) {
      return this.isPatientUser(userId, patientId);
    }
    
    return false;
  },

  // Check if user is assigned to patient (care team member)
  isAssignedToPatient: async function(userId, patientId) {
    if (Meteor.isServer) {
      // Check care team assignments
      const CareTeams = await global.Collections?.CareTeams;
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
  validateCurrentUser: function(context) {
    const { userId } = context;
    
    if (!userId) {
      throw new Meteor.Error('unauthorized', 'Authentication required');
    }
    
    const user = Meteor.users.findOne(userId);
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
  isDebugAccessAllowed: function(userId) {
    // Only in development environment
    const isDevelopment = get(Meteor, 'settings.public.hipaa.compliance.environment') === 'development';
    const debugEnabled = get(Meteor, 'settings.private.hipaa.security.allowDebugAccess', false);
    
    return isDevelopment && debugEnabled && this.canModifyAuditSettings(userId);
  },

  // Validate export request
  validateExportRequest: function(userId, exportOptions) {
    // Check basic permissions
    if (!this.canExportAuditData(userId)) {
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
  generateSecurityContext: function(userId) {
    const user = Meteor.users.findOne(userId);
    
    return {
      userId: userId,
      userName: user?.username || get(user, 'emails[0].address'),
      userRoles: Roles ? Roles.getRolesForUser(userId) : [],
      timestamp: new Date(),
      environment: get(Meteor, 'settings.public.hipaa.compliance.environment', 'production')
    };
  }
};
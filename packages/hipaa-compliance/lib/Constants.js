// packages/hipaa-compliance/lib/Constants.js

import { get } from 'lodash';

// HIPAA Event Types
export const EventTypes = {
  // Data Access Events
  VIEW: 'view',
  READ: 'read',
  ACCESS: 'access',
  
  // Data Modification Events
  CREATE: 'create',
  UPDATE: 'update',
  MODIFY: 'modify',
  DELETE: 'delete',
  
  // System Events
  LOGIN: 'login',
  LOGOUT: 'logout',
  INIT: 'init',
  PUBLISH: 'publish',
  UNPUBLISH: 'unpublish',
  
  // Security Events
  DENIED: 'denied',
  ERROR: 'error',
  CLONE: 'clone',
  
  // Export Events
  EXPORT: 'export',
  PRINT: 'print',
  DOWNLOAD: 'download'
};

// Security Levels
export const SecurityLevels = {
  NONE: 'none',
  BASIC: 'basic',
  AES: 'aes',
  ADVANCED: 'advanced'
};

// Audit Detail Levels
export const AuditDetailLevels = {
  MINIMAL: 'minimal',
  STANDARD: 'standard',
  VERBOSE: 'verbose'
};

// Environment Types
export const Environments = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Default Configuration
export const DefaultConfig = {
  RETENTION_YEARS: 7,
  PAGE_SIZE: 25,
  MAX_EXPORT_RECORDS: 10000,
  KEY_ROTATION_DAYS: 90,
  SESSION_TIMEOUT: 30 // minutes
};

// Collection Names
export const CollectionNames = {
  HIPAA_AUDIT_LOG: 'HipaaAuditLog',
  PATIENTS: 'Patients',
  OBSERVATIONS: 'Observations',
  ENCOUNTERS: 'Encounters',
  DIAGNOSTIC_REPORTS: 'DiagnosticReports',
  MEDICATION_REQUESTS: 'MedicationRequests',
  PROCEDURES: 'Procedures',
  CONDITIONS: 'Conditions',
  CARE_PLANS: 'CarePlans',
  GOALS: 'Goals'
};

// User Roles
export const UserRoles = {
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance-officer',
  HIPAA_OFFICER: 'hipaa-officer',
  CLINICIAN: 'clinician',
  PATIENT: 'patient',
  AUDITOR: 'auditor'
};

// Export configuration
if (typeof HipaaConstants === 'undefined') {
  HipaaConstants = {
    EventTypes,
    SecurityLevels,
    AuditDetailLevels,
    Environments,
    DefaultConfig,
    CollectionNames,
    UserRoles
  };
}
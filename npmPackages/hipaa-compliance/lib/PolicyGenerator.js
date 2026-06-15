// packages/hipaa-compliance/lib/PolicyGenerator.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Policy template variables that can be auto-populated from settings
export const PolicyVariables = {
  // Organization info
  ORGANIZATION_NAME: () => get(Meteor, 'settings.public.organization.name', '[Organization Name]'),
  ORGANIZATION_ADDRESS: () => get(Meteor, 'settings.public.organization.address', '[Organization Address]'),
  PRIVACY_OFFICER: () => get(Meteor, 'settings.public.organization.privacyOfficer', '[Privacy Officer Name]'),
  SECURITY_OFFICER: () => get(Meteor, 'settings.public.organization.securityOfficer', '[Security Officer Name]'),
  
  // System configuration
  DATA_RETENTION_YEARS: () => get(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears', 7),
  ENCRYPTION_LEVEL: () => get(Meteor, 'settings.private.hipaa.security.encryptionLevel', 'aes'),
  BACKUP_FREQUENCY: () => get(Meteor, 'settings.public.hipaa.backup.frequency', 'daily'),
  AUDIT_LOG_RETENTION: () => get(Meteor, 'settings.public.hipaa.compliance.dataRetentionYears', 7),
  
  // Security settings
  PASSWORD_MIN_LENGTH: () => get(Meteor, 'settings.public.security.passwordMinLength', 12),
  SESSION_TIMEOUT: () => get(Meteor, 'settings.public.hipaa.security.sessionTimeout', 30),
  MAX_LOGIN_ATTEMPTS: () => get(Meteor, 'settings.public.security.maxLoginAttempts', 5),
  TWO_FACTOR_REQUIRED: () => get(Meteor, 'settings.public.hipaa.security.requireSecondaryAuth', false),
  
  // Compliance settings
  ENVIRONMENT: () => get(Meteor, 'settings.public.hipaa.compliance.environment', 'production'),
  LAST_REVIEW_DATE: () => new Date().toLocaleDateString(),
  NEXT_REVIEW_DATE: () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toLocaleDateString();
  }
};

// Policy generator class
export class PolicyGenerator {
  constructor() {
    this.variables = PolicyVariables;
  }

  // Replace template variables in policy content
  processPolicy(policyContent) {
    let processed = policyContent;
    
    // Replace all template variables
    Object.keys(this.variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = typeof this.variables[key] === 'function' 
        ? this.variables[key]() 
        : this.variables[key];
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }

  // Generate policy header with organization info
  generateHeader() {
    return `
# ${this.variables.ORGANIZATION_NAME()}
## HIPAA Compliance Policy

**Effective Date**: ${this.variables.LAST_REVIEW_DATE()}  
**Next Review Date**: ${this.variables.NEXT_REVIEW_DATE()}  
**Environment**: ${this.variables.ENVIRONMENT()}

---

`;
  }

  // Generate policy footer with approval info
  generateFooter() {
    return `

---

## Policy Approval

**Privacy Officer**: ${this.variables.PRIVACY_OFFICER()}  
**Security Officer**: ${this.variables.SECURITY_OFFICER()}  
**Last Updated**: ${this.variables.LAST_REVIEW_DATE()}

*This policy is automatically generated based on system configuration.*
`;
  }

  // Process a full policy document
  generatePolicy(policyContent, includeHeaderFooter = true) {
    let finalContent = this.processPolicy(policyContent);
    
    if (includeHeaderFooter) {
      finalContent = this.generateHeader() + finalContent + this.generateFooter();
    }
    
    return finalContent;
  }

  // Generate audit policy with current settings
  generateAuditPolicy() {
    return `
## Auditing Policy

### Overview
${this.variables.ORGANIZATION_NAME()} maintains comprehensive audit logs of all access to Protected Health Information (PHI) in accordance with HIPAA requirements.

### Audit Log Configuration
- **Retention Period**: ${this.variables.AUDIT_LOG_RETENTION()} years
- **Encryption Level**: ${this.variables.ENCRYPTION_LEVEL()}
- **Environment**: ${this.variables.ENVIRONMENT()}

### Access Controls
- All access to PHI is logged automatically
- Audit logs are write-only (no modifications or deletions allowed)
- Only authorized personnel can view audit logs

### Review Process
- Audit logs are reviewed regularly for suspicious activity
- Automated alerts are configured for security events
- Reports are generated monthly for compliance review
`;
  }

  // Generate data retention policy with current settings
  generateDataRetentionPolicy() {
    return `
## Data Retention Policy

### Overview
This policy defines how ${this.variables.ORGANIZATION_NAME()} retains and disposes of Protected Health Information (PHI).

### Retention Periods
- **PHI Records**: ${this.variables.DATA_RETENTION_YEARS()} years
- **Audit Logs**: ${this.variables.AUDIT_LOG_RETENTION()} years
- **Backup Data**: ${this.variables.DATA_RETENTION_YEARS()} years

### Backup Configuration
- **Frequency**: ${this.variables.BACKUP_FREQUENCY()}
- **Encryption**: ${this.variables.ENCRYPTION_LEVEL()}

### Disposal Procedures
- Electronic media is securely wiped using approved methods
- Physical media is destroyed via approved shredding services
- Certificates of destruction are maintained
`;
  }

  // Check if policies need updates based on settings
  checkPolicyUpdates() {
    const updates = [];
    
    // Check for missing organization info
    if (this.variables.ORGANIZATION_NAME() === '[Organization Name]') {
      updates.push('Organization name not configured');
    }
    
    if (this.variables.PRIVACY_OFFICER() === '[Privacy Officer Name]') {
      updates.push('Privacy Officer not designated');
    }
    
    if (this.variables.SECURITY_OFFICER() === '[Security Officer Name]') {
      updates.push('Security Officer not designated');
    }
    
    return updates;
  }
}

// Export singleton instance
export const policyGenerator = new PolicyGenerator();
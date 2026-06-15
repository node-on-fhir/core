// packages/hipaa-compliance/lib/PolicyRoutes.js

// Policy route definitions matching the hipaa-routes package
export const PolicyRoutes = [
  {
    path: '/hipaa',
    template: 'hipaaPolicyMenu',
    name: 'hipaaPolicyMenu'
  },
  {
    path: '/hipaa/policies/3rd_party_policy',
    template: 'thirdPartyPolicy',
    name: 'thirdPartyPolicy',
    policyFile: '3rd_party_policy.md'
  },
  {
    path: '/hipaa/policies/approved_tools_policy',
    template: 'approvedToolsPolicy',
    name: 'approvedToolsPolicy',
    policyFile: 'approved_tools_policy.md'
  },
  {
    path: '/hipaa/policies/auditing_policy',
    template: 'auditingPolicy',
    name: 'auditingPolicy',
    policyFile: 'auditing_policy.md'
  },
  {
    path: '/hipaa/policies/breach_policy',
    template: 'breachPolicy',
    name: 'breachPolicy',
    policyFile: 'breach_policy.md'
  },
  {
    path: '/hipaa/policies/configuration_management_policy',
    template: 'configurationManagementPolicy',
    name: 'configurationManagementPolicy',
    policyFile: 'configuration_management_policy.md'
  },
  {
    path: '/hipaa/policies/data_integrity_policy',
    template: 'dataIntegrityPolicy',
    name: 'dataIntegrityPolicy',
    policyFile: 'data_integrity_policy.md'
  },
  {
    path: '/hipaa/policies/data_management_policy',
    template: 'dataManagementPolicy',
    name: 'dataManagementPolicy',
    policyFile: 'data_management_policy.md'
  },
  {
    path: '/hipaa/policies/data_retention_policy',
    template: 'dataRetentionPolicy',
    name: 'dataRetentionPolicy',
    policyFile: 'data_retention_policy.md'
  },
  {
    path: '/hipaa/policies/disaster_recovery_policy',
    template: 'disasterRecoveryPolicy',
    name: 'disasterRecoveryPolicy',
    policyFile: 'disaster_recovery_policy.md'
  },
  {
    path: '/hipaa/policies/disposable_media_policy',
    template: 'disposableMediaPolicy',
    name: 'disposableMediaPolicy',
    policyFile: 'disposable_media_policy.md'
  },
  {
    path: '/hipaa/policies/employees_policy',
    template: 'employeesPolicy',
    name: 'employeesPolicy',
    policyFile: 'employees_policy.md'
  },
  {
    path: '/hipaa/policies/facility_access_policy',
    template: 'facilityAccessPolicy',
    name: 'facilityAccessPolicy',
    policyFile: 'facility_access_policy.md'
  },
  {
    path: '/hipaa/policies/hipaa_business_associate_agreement',
    template: 'hipaaBusinessAssociateAgreement',
    name: 'hipaaBusinessAssociateAgreement',
    policyFile: 'hipaa_business_associate_agreement.md'
  },
  {
    path: '/hipaa/policies/intrusion_detection_policy',
    template: 'intrusionDetectionPolicy',
    name: 'intrusionDetectionPolicy',
    policyFile: 'ids_policy.md'  // Note: file is ids_policy.md
  },
  {
    path: '/hipaa/policies/incident_response_policy',
    template: 'incidentResponsePolicy',
    name: 'incidentResponsePolicy',
    policyFile: 'incident_response_policy.md'
  },
  {
    path: '/hipaa/policies/key_definitions',
    template: 'keyDefinitions',
    name: 'keyDefinitions',
    policyFile: 'key_definitions.md'
  },
  {
    path: '/hipaa/policies/policy_management_policy',
    template: 'policyManagementPolicy',
    name: 'policyManagementPolicy',
    policyFile: 'policy_management_policy.md'
  },
  {
    path: '/hipaa/policies/risk_management_policy',
    template: 'riskManagementPolicy',
    name: 'riskManagementPolicy',
    policyFile: 'risk_management_policy.md'
  },
  {
    path: '/hipaa/policies/roles_policy',
    template: 'rolesPolicy',
    name: 'rolesPolicy',
    policyFile: 'roles_policy.md'
  },
  {
    path: '/hipaa/policies/systems_access_policy',
    template: 'systemAccessPolicy',
    name: 'systemAccessPolicy',
    policyFile: 'systems_access_policy.md'
  },
  {
    path: '/hipaa/policies/vulnerability_scanning_policy',
    template: 'vulnerabilityScanningPolicy',
    name: 'vulnerabilityScanningPolicy',
    policyFile: 'vulnerability_scanning_policy.md'
  }
];

// Helper to get all policy routes for React Router
export function getPolicyRoutes() {
  return PolicyRoutes.filter(route => route.policyFile).map(route => ({
    path: route.path,
    name: route.name,
    policyFile: route.policyFile
  }));
}

// Helper to get policy by ID
export function getPolicyByPath(path) {
  return PolicyRoutes.find(route => route.path === path);
}

// Helper to get policy by template name
export function getPolicyByTemplate(templateName) {
  return PolicyRoutes.find(route => route.template === templateName);
}
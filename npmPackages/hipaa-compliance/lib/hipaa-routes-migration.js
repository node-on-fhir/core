// packages/hipaa-compliance/lib/hipaa-routes-migration.js

// Original hipaa-routes.js content for reference
// This file preserves the original route structure from the hipaa-routes package

export const OriginalHipaaRoutes = {
  '/hipaa': {
    template: "hipaaPolicyMenu",
    name: "hipaaPolicyMenu"
  },
  '/hipaa/policies/3rd_party_policy': {
    template: "thirdPartyPolicy",
    name: "thirdPartyPolicy"
  },
  '/hipaa/policies/approved_tools_policy': {
    template: "approvedToolsPolicy",
    name: "approvedToolsPolicy"
  },
  '/hipaa/policies/auditing_policy': {
    template: "auditingPolicy",
    name: "auditingPolicy"
  },
  '/hipaa/policies/breach_policy': {
    template: "breachPolicy",
    name: "breachPolicy"
  },
  '/hipaa/policies/configuration_management_policy': {
    template: "configurationManagementPolicy",
    name: "configurationManagementPolicy"
  },
  '/hipaa/policies/data_integrity_policy': {
    template: "dataIntegrityPolicy",
    name: "dataIntegrityPolicy"
  },
  '/hipaa/policies/data_management_policy': {
    template: "dataManagementPolicy",
    name: "dataManagementPolicy"
  },
  '/hipaa/policies/data_retention_policy': {
    template: "dataRetentionPolicy",
    name: "dataRetentionPolicy"
  },
  '/hipaa/policies/disaster_recovery_policy': {
    template: "disasterRecoveryPolicy",
    name: "disasterRecoveryPolicy"
  },
  '/hipaa/policies/disposable_media_policy': {
    template: "disposableMediaPolicy",
    name: "disposableMediaPolicy"
  },
  '/hipaa/policies/employees_policy': {
    template: "employeesPolicy",
    name: "employeesPolicy"
  },
  '/hipaa/policies/facility_access_policy': {
    template: "facilityAccessPolicy",
    name: "facilityAccessPolicy"
  },
  '/hipaa/policies/hipaa_business_associate_agreement': {
    template: "hipaaBusinessAssociateAgreement",
    name: "hipaaBusinessAssociateAgreement"
  },
  '/hipaa/policies/intrusion_detection_policy': {
    template: "intrusionDetectionPolicy",
    name: "intrusionDetectionPolicy"
  },
  '/hipaa/policies/incident_response_policy': {
    template: "incidentResponsePolicy",
    name: "incidentResponsePolicy"
  },
  '/hipaa/policies/key_definitions': {
    template: "keyDefinitions",
    name: "keyDefinitions"
  },
  '/hipaa/policies/policy_management_policy': {
    template: "policyManagementPolicy",
    name: "policyManagementPolicy"
  },
  '/hipaa/policies/risk_management_policy': {
    template: "riskManagementPolicy",
    name: "riskManagementPolicy"
  },
  '/hipaa/policies/roles_policy': {
    template: "rolesPolicy",
    name: "rolesPolicy"
  },
  '/hipaa/policies/systems_access_policy': {
    template: "systemAccessPolicy",
    name: "systemAccessPolicy"
  },
  '/hipaa/policies/vulnerability_scanning_policy': {
    template: "vulnerabilityScanningPolicy",
    name: "vulnerabilityScanningPolicy"
  }
};

// Helper for packages that still use Router.route() syntax
export function registerHipaaRoutes(Router) {
  Object.keys(OriginalHipaaRoutes).forEach(path => {
    const route = OriginalHipaaRoutes[path];
    Router.route(path, {
      template: route.template,
      name: route.name
    });
  });
}
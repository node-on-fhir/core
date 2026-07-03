// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/lib/ConsentTemplates.js

import { Random } from 'meteor/random';

export const ConsentTemplates = {
  // Patient accessing their own records
  'patient-access': {
    name: 'Patient Self-Access',
    description: 'Patient accessing their own health records',
    generateConsent: (options = {}) => ({
      resourceType: "Consent",
      id: options.id || Random.id(),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString()
      },
      status: "active",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "IDSCL",
          display: "information disclosure"
        }]
      }],
      patient: {
        reference: `Patient/${options.patientId || Random.id()}`,
        display: options.patientName || "Test Patient"
      },
      dateTime: new Date().toISOString(),
      performer: [{
        reference: `Patient/${options.patientId || Random.id()}`,
        display: options.patientName || "Test Patient"
      }],
      policy: [{
        uri: "https://example.org/policies/patient-self-access"
      }],
      provision: {
        type: "permit",
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        },
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-RoleClass",
              code: "PAT",
              display: "patient"
            }]
          },
          reference: {
            reference: `Patient/${options.patientId || Random.id()}`
          }
        }],
        action: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: "access",
            display: "Access"
          }]
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "N",
          display: "normal"
        }],
        class: [
          { code: "Patient", display: "Patient" },
          { code: "Observation", display: "Observation" },
          { code: "Condition", display: "Condition" },
          { code: "Procedure", display: "Procedure" },
          { code: "MedicationRequest", display: "MedicationRequest" },
          { code: "AllergyIntolerance", display: "AllergyIntolerance" },
          { code: "Immunization", display: "Immunization" },
          { code: "DocumentReference", display: "DocumentReference" }
        ]
      }
    })
  },

  // Healthcare provider access
  'provider-access': {
    name: 'Provider Access',
    description: 'Healthcare provider accessing patient records with consent',
    generateConsent: (options = {}) => ({
      resourceType: "Consent",
      id: options.id || Random.id(),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString()
      },
      status: "active",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "IDSCL",
          display: "information disclosure"
        }]
      }],
      patient: {
        reference: `Patient/${options.patientId || Random.id()}`,
        display: options.patientName || "Test Patient"
      },
      dateTime: new Date().toISOString(),
      performer: [{
        reference: `Patient/${options.patientId || Random.id()}`,
        display: options.patientName || "Test Patient"
      }],
      organization: [{
        reference: `Organization/${options.organizationId || Random.id()}`,
        display: options.organizationName || "Test Hospital"
      }],
      policy: [{
        uri: "https://example.org/policies/provider-access"
      }],
      provision: {
        type: "permit",
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
        },
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-RoleClass",
              code: "PROV",
              display: "healthcare provider"
            }]
          },
          reference: {
            reference: `Practitioner/${options.practitionerId || Random.id()}`
          }
        }],
        action: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: "access",
            display: "Access"
          }]
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "N",
          display: "normal"
        }],
        class: [
          { code: "Patient", display: "Patient" },
          { code: "Observation", display: "Observation" },
          { code: "Condition", display: "Condition" },
          { code: "Procedure", display: "Procedure" },
          { code: "MedicationRequest", display: "MedicationRequest" },
          { code: "AllergyIntolerance", display: "AllergyIntolerance" },
          { code: "Immunization", display: "Immunization" },
          { code: "DiagnosticReport", display: "DiagnosticReport" },
          { code: "DocumentReference", display: "DocumentReference" },
          { code: "Encounter", display: "Encounter" }
        ]
      }
    })
  },

  // System access for backend operations
  'system-access': {
    name: 'System Access',
    description: 'System-level access for backend operations',
    generateConsent: (options = {}) => ({
      resourceType: "Consent",
      id: options.id || Random.id(),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString()
      },
      status: "active",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "IDSCL",
          display: "information disclosure"
        }]
      }],
      dateTime: new Date().toISOString(),
      policy: [{
        uri: "https://example.org/policies/system-access"
      }],
      provision: {
        type: "permit",
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-RoleClass",
              code: "SYSTEM",
              display: "system"
            }]
          },
          reference: {
            reference: "System"
          }
        }],
        action: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: "access",
            display: "Access"
          }]
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "N",
          display: "normal"
        }],
        class: [
          { code: "Patient", display: "Patient" },
          { code: "Practitioner", display: "Practitioner" },
          { code: "Organization", display: "Organization" },
          { code: "Location", display: "Location" },
          { code: "HealthcareService", display: "HealthcareService" },
          { code: "Endpoint", display: "Endpoint" },
          { code: "SearchParameter", display: "SearchParameter" },
          { code: "StructureDefinition", display: "StructureDefinition" },
          { code: "ValueSet", display: "ValueSet" },
          { code: "CodeSystem", display: "CodeSystem" }
        ]
      }
    })
  },

  // Citizen access for public directories
  'citizen-access': {
    name: 'Citizen/Public Access',
    description: 'Public access to provider directories and non-PHI resources',
    generateConsent: (options = {}) => ({
      resourceType: "Consent",
      id: options.id || Random.id(),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString()
      },
      status: "active",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "IDSCL",
          display: "information disclosure"
        }]
      }],
      dateTime: new Date().toISOString(),
      policy: [{
        uri: "https://example.org/policies/public-directory-access"
      }],
      provision: {
        type: "permit",
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-RoleClass",
              code: "CITIZEN",
              display: "citizen"
            }]
          },
          reference: {
            reference: "CitizenRole"
          }
        }],
        action: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: "access",
            display: "Access"
          }]
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "U",
          display: "unrestricted"
        }],
        class: [
          { code: "Practitioner", display: "Practitioner" },
          { code: "PractitionerRole", display: "PractitionerRole" },
          { code: "Organization", display: "Organization" },
          { code: "Location", display: "Location" },
          { code: "HealthcareService", display: "HealthcareService" },
          { code: "Endpoint", display: "Endpoint" },
          { code: "InsurancePlan", display: "InsurancePlan" }
        ]
      }
    })
  },

  // Emergency access (break-glass)
  'emergency-access': {
    name: 'Emergency Access',
    description: 'Emergency break-glass access to patient records',
    generateConsent: (options = {}) => ({
      resourceType: "Consent",
      id: options.id || Random.id(),
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString()
      },
      status: "active",
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "EMRGONLY",
          display: "emergency only"
        }]
      }],
      patient: {
        reference: `Patient/${options.patientId || Random.id()}`,
        display: options.patientName || "Test Patient"
      },
      dateTime: new Date().toISOString(),
      policy: [{
        uri: "https://example.org/policies/emergency-access"
      }],
      provision: {
        type: "permit",
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        },
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-RoleClass",
              code: "PROV",
              display: "healthcare provider"
            }]
          },
          reference: {
            reference: "EmergencyAccess"
          }
        }],
        action: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/consentaction",
            code: "access",
            display: "Access"
          }]
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "R",
          display: "restricted"
        }],
        purpose: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
          code: "ETREAT",
          display: "Emergency Treatment"
        }],
        class: [
          { code: "Patient", display: "Patient" },
          { code: "Observation", display: "Observation" },
          { code: "Condition", display: "Condition" },
          { code: "MedicationRequest", display: "MedicationRequest" },
          { code: "AllergyIntolerance", display: "AllergyIntolerance" }
        ]
      }
    })
  }
};

// Helper function to convert Consent to ACL format
export const consentToAcl = (consent) => {
  const provision = consent.provision;
  if (!provision) return null;

  const actor = provision.actor?.[0];
  const role = actor?.role?.coding?.[0]?.code || 'unknown';
  const resources = provision.class?.map(c => c.code) || [];
  const actions = provision.action?.map(a => a.coding?.[0]?.code) || ['access'];

  return {
    id: consent.id,
    role: role.toLowerCase(),
    resources: resources,
    actions: actions,
    conditions: {
      securityLabel: provision.securityLabel?.[0]?.code || 'N',
      purpose: provision.purpose?.map(p => p.code) || [],
      period: provision.period || {}
    },
    source: {
      resourceType: 'Consent',
      id: consent.id
    }
  };
};
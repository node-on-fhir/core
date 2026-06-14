// packages/us-core/server/ProfileSet.js
//
// US Core 7.0.0 FHIR Profile definitions
// https://hl7.org/fhir/us/core/STU7/
//
// These profiles are used to populate the CapabilityStatement.rest.resource.supportedProfile
// for ONC HealthIT (g)(10) certification compliance.
//
// Note: Profile URLs are versionless per Inferno test expectations

export const ProfileSet = {
  name: "US Core",
  version: "7.0.0",
  fhirVersion: "4.0.1",
  canonicalBase: "http://hl7.org/fhir/us/core/StructureDefinition",
  profiles: {
    // Patient
    "Patient": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"
    ],

    // AllergyIntolerance
    "AllergyIntolerance": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-allergyintolerance"
    ],

    // CarePlan
    "CarePlan": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan"
    ],

    // CareTeam
    "CareTeam": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-careteam"
    ],

    // Condition - multiple profiles for different use cases
    "Condition": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-problems-health-concerns",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-encounter-diagnosis"
    ],

    // Coverage
    "Coverage": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-coverage"
    ],

    // DiagnosticReport - multiple profiles
    "DiagnosticReport": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-lab",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-diagnosticreport-note"
    ],

    // DocumentReference
    "DocumentReference": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-documentreference"
    ],

    // Encounter
    "Encounter": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter"
    ],

    // Goal
    "Goal": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-goal"
    ],

    // Immunization
    "Immunization": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-immunization"
    ],

    // Location
    "Location": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-location"
    ],

    // Medication
    "Medication": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medication"
    ],

    // MedicationDispense
    "MedicationDispense": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationdispense"
    ],

    // MedicationRequest
    "MedicationRequest": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest"
    ],

    // Observation - multiple profiles for different observation types
    "Observation": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-blood-pressure",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-bmi",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-height",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-temperature",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-weight",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-head-circumference",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-heart-rate",
      // Note: These pediatric profiles don't have "us-core-" prefix in US Core 7.0.0
      "http://hl7.org/fhir/us/core/StructureDefinition/pediatric-bmi-for-age",
      "http://hl7.org/fhir/us/core/StructureDefinition/pediatric-weight-for-height",
      "http://hl7.org/fhir/us/core/StructureDefinition/head-occipital-frontal-circumference-percentile",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-pulse-oximetry",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-respiratory-rate",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-smokingstatus",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-screening-assessment",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-clinical-result",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-simple-observation",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-pregnancystatus",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-pregnancyintent",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-occupation",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-sexual-orientation",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-average-blood-pressure",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-treatment-intervention-preference",
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-care-experience-preference"
    ],

    // Organization
    "Organization": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization"
    ],

    // Practitioner
    "Practitioner": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitioner"
    ],

    // PractitionerRole
    "PractitionerRole": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-practitionerrole"
    ],

    // Procedure
    "Procedure": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-procedure"
    ],

    // Provenance
    "Provenance": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-provenance"
    ],

    // QuestionnaireResponse
    "QuestionnaireResponse": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-questionnaireresponse"
    ],

    // RelatedPerson
    "RelatedPerson": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-relatedperson"
    ],

    // ServiceRequest
    "ServiceRequest": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-servicerequest"
    ],

    // Specimen
    "Specimen": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-specimen"
    ],

    // Device (implantable)
    "Device": [
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device"
    ]
  }
};

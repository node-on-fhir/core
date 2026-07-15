# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-7-10-apis.feature
# § 170.315(g)(7)-(g)(10) - Application Programming Interfaces

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(7)
#
# (7) Application access--patient selection.  The following technical outcome and conditions must be met through the demonstration of an application programming interface (API).
# (i) Functional requirement.  The technology must be able to receive a request with sufficient information to uniquely identify a patient and return an ID or other token that can be used by an application to subsequently execute requests for that patient's data.
# (ii) Documentation.
# (A) The API must include accompanying documentation that contains, at a minimum:

@170.315-g-7-10 @api @fhir @design-performance
Feature: Application Programming Interfaces
  As a health IT developer
  I want to provide standardized APIs
  So that applications can access health information

  Background:
    Given the Health IT Module provides APIs
    And API access is required

  Scenario: Provide patient selection API (g)(7)
    Given applications need to select patients
    When application requests patient selection
    Then API shall enable patient selection
    And API shall conform to standards
    And API shall be properly documented

  Scenario: Provide data category request API (g)(8)
    Given applications need specific data categories
    When application requests data by category
    Then API shall provide data category request capability
    And API shall return requested data
    And API shall conform to USCDI

  Scenario: Provide all data request API (g)(9)
    Given applications need complete patient data
    When application requests all patient data
    Then API shall provide all available data
    And data shall include all USCDI elements
    And API shall conform to standards

  Scenario: Provide standardized API for patient and population services (g)(10)
    Given applications need patient and population data
    When application uses FHIR API
    Then API shall conform to § 170.215(a) standard
    And API shall support SMART App Launch
    And API shall support bulk data access
    And API shall provide comprehensive functionality

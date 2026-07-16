# certification/bdd/170.315-f-5-electronic-case-reporting.feature
# § 170.315(f)(5) - Transmission to Public Health Agencies - Electronic Case Reporting

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(5)
#
# (5) Transmission to public health agencies --electronic case reporting. Enable a user to create a case report for electronic transmission meeting the requirements described in paragraphs (f)(5)(i) of this section for the time period up to and including December 31, 2025; or the requirements described in paragraph (f)(5)(ii) of this section.
#
# (i) Functional electronic case reporting.  A Health IT Module must enable a user to create a case report for electronic transmission in accordance with the following:
#
# (A) Consume and maintain a table of trigger codes to determine which encounters may be reportable.
#
# (B) Match a patient visit or encounter to the trigger code based on the parameters of the trigger code table.
#
# (C) Case report creation.  Create a case report for electronic transmission:
#
# (1) Based on a matched trigger from paragraph (f)(5)(i)(B).
#
# (2) That includes, at a minimum:
#
# (i) The data classes expressed in the standards in § 170.213.
#
# (ii) Encounter diagnoses formatted according to at least one of the standards specified in § 170.207(i) or § 170.207(a)(1).
#
# (iii) The provider's name, office contact information, and reason for visit.
#
# (iv) An identifier representing the row and version of the trigger table that triggered the case report.
#
# (ii) Standards-based electronic case reporting.  A Health IT Module must enable a user to create a case report for electronic transmission in accordance with the following:
#
# (A) Consume and process case reporting trigger codes and identify a reportable patient visit or encounter based on a match from the Reportable Conditions Trigger Code value set in § 170.205(t)(4).
#
# (B) Create a case report consistent with at least one of the following standards:
#
# (1) The eICR profile of the HL7 FHIR eCR IG in § 170.205(t)(1); or
#
# (2) The HL7 CDA eICR IG in § 170.205(t)(2).
#
# (C) Receive, consume, and process a case report response that is formatted to either the reportability response profile of the HL7 FHIR eCR IG in § 170.205(t)(1) or the HL7 CDA RR IG in § 170.205(t)(3) as determined by the standard used in (f)(5)(ii)(B) of this section.
#
# (D) Transmit a case report electronically to a system capable of receiving a case report.

@170.315-f-5 @electronic-case-reporting @public-health
Feature: Transmission to Public Health Agencies - Electronic Case Reporting
  As a healthcare provider
  I want to create and transmit electronic case reports to public health agencies
  So that I can support disease surveillance and outbreak response

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for case reporting

  # Functional Electronic Case Reporting

  Scenario: Consume and maintain trigger code table
    Given the system receives a trigger code table
    When I process the trigger codes
    Then the system shall maintain the table
    And trigger codes shall determine reportable encounters

  Scenario: Match encounter to trigger code
    Given a trigger code table is maintained
    And a patient visit occurs
    When the encounter data matches trigger criteria
    Then the system shall identify the encounter as reportable

  Scenario: Create case report based on trigger match
    Given an encounter has matched a trigger code
    When I create a case report
    Then the report shall include data per § 170.213
    And encounter diagnoses shall use § 170.207(i) or § 170.207(a)(1)
    And provider information shall be included
    And trigger table identifier shall be included

  # Standards-Based Electronic Case Reporting

  Scenario: Process reportable conditions trigger codes
    Given the system supports standards-based reporting
    When I consume trigger codes per § 170.205(t)(4)
    Then reportable encounters shall be identified based on value set

  Scenario: Create FHIR-based case report
    Given a reportable encounter is identified
    When I create a case report using FHIR
    Then the report shall conform to § 170.205(t)(1)

  Scenario: Create CDA-based case report
    Given a reportable encounter is identified
    When I create a case report using CDA
    Then the report shall conform to § 170.205(t)(2)

  Scenario: Receive and process reportability response
    Given a case report has been transmitted
    When I receive a reportability response
    Then the system shall consume the response per § 170.205(t)(1) or § 170.205(t)(3)

  Scenario: Transmit case report electronically
    Given a case report has been created
    When I transmit the report
    Then the system shall send to capable receiving system

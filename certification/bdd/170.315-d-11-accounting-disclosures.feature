# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-11-accounting-disclosures.feature
# § 170.315(d)(11) - Accounting of Disclosures

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(11)
#
# (11) Accounting of disclosures.  Record disclosures made for treatment, payment, and health care operations in accordance with the standard specified in § 170.210(d).

@170.315-d-11 @accounting-disclosures @privacy-security
Feature: Accounting of Disclosures
  As a patient
  I want to see who accessed my health information
  So that I can track disclosures of my data

  Background:
    Given patient health information exists in the system
    And disclosures have occurred

  Scenario: Record disclosure information
    Given health information is disclosed
    When the disclosure occurs
    Then the system shall record date of disclosure
    And the system shall record time of disclosure
    And the system shall record patient identification
    And the system shall record user who made disclosure
    And the system shall record description of disclosure

  Scenario: Patient requests accounting of disclosures
    Given I am a patient
    When I request accounting of my disclosures
    Then the system shall provide disclosure report
    And report shall include all required disclosure information
    And report shall cover requested time period

  Scenario: Exclude disclosures from accounting requirements
    Given certain disclosures are exempt from accounting
    When generating accounting report
    Then exempt disclosures shall be excluded appropriately
    And exclusions shall comply with HIPAA requirements

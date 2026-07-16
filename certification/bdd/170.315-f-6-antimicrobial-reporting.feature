# certification/bdd/170.315-f-6-antimicrobial-reporting.feature
# § 170.315(f)(6) - Transmission to Public Health Agencies - Antimicrobial Use and Resistance Reporting

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(6)
#
# (6) Transmission to public health agencies--antimicrobial use and resistance reporting.  Create antimicrobial use and resistance reporting information for electronic transmission in accordance with the standard specified in § 170.205(r)(1).

@170.315-f-6 @antimicrobial-reporting @public-health
Feature: Transmission to Public Health Agencies - Antimicrobial Use and Resistance Reporting
  As a healthcare provider
  I want to transmit antimicrobial use and resistance data to public health agencies
  So that I can support antimicrobial stewardship and resistance tracking

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for antimicrobial reporting

  Scenario: Create antimicrobial use and resistance information for transmission
    Given antimicrobial use data has been collected
    When I create antimicrobial reporting information
    Then the system shall format per § 170.205(r)(1)
    And use and resistance data shall be included

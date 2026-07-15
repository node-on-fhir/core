# certification/bdd/170.315-f-7-healthcare-surveys.feature
# § 170.315(f)(7) - Transmission to Public Health Agencies - Health Care Surveys

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(7)
#
# (7) Transmission to public health agencies--health care surveys.  Create health care survey information for electronic transmission in accordance with the standard specified in § 170.205(s)(1).

@170.315-f-7 @healthcare-surveys @public-health
Feature: Transmission to Public Health Agencies - Health Care Surveys
  As a healthcare provider
  I want to transmit health care survey information to public health agencies
  So that I can support public health data collection and analysis

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for healthcare survey reporting

  Scenario: Create healthcare survey information for transmission
    Given healthcare survey data has been collected
    When I create survey information for transmission
    Then the system shall format per § 170.205(s)(1)
    And survey data shall be included in transmission

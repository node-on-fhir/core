# certification/bdd/170.315-f-2-syndromic-surveillance.feature
# § 170.315(f)(2) - Transmission to Public Health Agencies - Syndromic Surveillance

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(2)
#
# (2) Transmission to public health agencies—syndromic surveillance.  Create syndrome-based public health surveillance information for electronic transmission in accordance with the standard (and applicable implementation specifications) specified in § 170.205(d)(4).

@170.315-f-2 @syndromic-surveillance @public-health
Feature: Transmission to Public Health Agencies - Syndromic Surveillance
  As a healthcare provider
  I want to transmit syndromic surveillance data to public health agencies
  So that I can support disease outbreak detection and public health monitoring

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for public health reporting

  Scenario: Create syndromic surveillance information for transmission
    Given a patient encounter has occurred
    When I create syndrome-based surveillance information
    Then the system shall create electronic transmission per § 170.205(d)(4)
    And the transmission shall include syndromic data
    And the data shall be in the specified format

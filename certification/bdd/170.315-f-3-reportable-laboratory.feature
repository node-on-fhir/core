# certification/bdd/170.315-f-3-reportable-laboratory.feature
# § 170.315(f)(3) - Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(3)
#
# (3) Transmission to public health agencies—reportable laboratory tests and values/results.  Create reportable laboratory tests and values/results for electronic transmission in accordance with:
#
# (i) The standard (and applicable implementation specifications) specified in § 170.205(g).
#
# (ii) At a minimum, the versions of the standards specified in § 170.207(a)(1) and (c)(1).

@170.315-f-3 @reportable-laboratory @public-health
Feature: Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results
  As a healthcare provider
  I want to transmit reportable laboratory results to public health agencies
  So that I can support disease surveillance and outbreak detection

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for public health reporting

  Scenario: Create reportable laboratory test information for transmission
    Given a reportable laboratory test has been completed
    When I create reportable laboratory information for transmission
    Then the system shall format per § 170.205(g)
    And the system shall use standards per § 170.207(a)(1)
    And the system shall use standards per § 170.207(c)(1)
    And test results and values shall be included

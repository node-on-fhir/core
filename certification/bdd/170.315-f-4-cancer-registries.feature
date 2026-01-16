# certification/bdd/170.315-f-4-cancer-registries.feature
# § 170.315(f)(4) - Transmission to Cancer Registries

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(4)
#
# (4) Transmission to cancer registries.  Create cancer case information for electronic transmission in accordance with:
#
# (i) The standard (and applicable implementation specifications) specified in § 170.205(i)(2).
#
# (ii) At a minimum, the versions of the standards specified in § 170.207(a)(1) and (c)(1).

@170.315-f-4 @cancer-registries @public-health
Feature: Transmission to Cancer Registries
  As a healthcare provider
  I want to transmit cancer case information to cancer registries
  So that I can support cancer surveillance and research

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for cancer registry reporting

  Scenario: Create cancer case information for transmission
    Given a cancer case has been diagnosed
    When I create cancer case information for transmission
    Then the system shall format per § 170.205(i)(2)
    And the system shall use standards per § 170.207(a)(1)
    And the system shall use standards per § 170.207(c)(1)
    And cancer case details shall be included

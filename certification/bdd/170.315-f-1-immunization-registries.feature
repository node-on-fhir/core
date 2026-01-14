# certification/bdd/170.315-f-1-immunization-registries.feature
# § 170.315(f)(1) - Transmission to Immunization Registries

# REGULATORY TEXT FROM 45 CFR § 170.315(f)(1)
#
# (1) Transmission to immunization registries.
#
# (i) Create immunization information for electronic transmission in accordance with:
#
# (A) The standard and applicable implementation specifications specified in § 170.205(e)(4).
#
# (B) At a minimum, the version of the standard specified in § 170.207(e)(1) for historical vaccines.
#
# (C) At a minimum, the version of the standard specified in § 170.207(e)(2) for administered vaccines.
#
# (ii) Enable a user to request, access, and display a patient's evaluated immunization history and the immunization forecast from an immunization registry in accordance with the standard at § 170.205(e)(4).

@170.315-f-1 @immunization-registries @public-health
Feature: Transmission to Immunization Registries
  As a healthcare provider
  I want to transmit immunization information to registries
  So that I can support public health surveillance and patient care coordination

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges for immunization reporting

  Scenario: Create immunization information for transmission
    Given a patient has received a vaccination
    When I create immunization information for electronic transmission
    Then the system shall format per § 170.205(e)(4)
    And historical vaccines shall use standard per § 170.207(e)(1)
    And administered vaccines shall use standard per § 170.207(e)(2)

  Scenario: Request immunization history from registry
    Given I need to review a patient's immunization history
    When I request evaluated immunization history from the registry
    Then the system shall send request per § 170.205(e)(4)
    And I shall be able to access the immunization history
    And I shall be able to display the immunization forecast

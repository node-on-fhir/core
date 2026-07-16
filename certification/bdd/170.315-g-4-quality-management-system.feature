# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-4-quality-management-system.feature
# § 170.315(g)(4) - Quality Management System

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(4)
#
# (4) Unique device identifier(s) for a patient's implantable device(s).  In accordance with the "Product Instance" in the "Procedure Activity Procedure Section" of the standard specified in § 170.205(a)(4).
# (ii) Reference C-CDA match.
# (A) For health IT certified to (g)(6)(i)(A) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) and (5) that matches a gold-standard, reference data file.
# (B) For health IT certified to (g)(6)(i)(B) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) that matches a gold-standard, reference data file.
# (iii) Document-template conformance.
# (A) For health IT certified to (g)(6)(i)(A) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) and (5) that demonstrates a valid implementation of each document template applicable to the certification criterion or criteria within the scope of the certificate sought.
# (B) For health IT certified to (g)(6)(i)(B) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) that demonstrates a valid implementation of each document template applicable to the certification criterion or criteria within the scope of the certificate sought.
# (iv) Vocabulary conformance.
# (A) For health IT certified to (g)(6)(i)(A) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) and (5) that demonstrates the required vocabulary standards (and value sets) are properly implemented.
# (B) For health IT certified to (g)(6)(i)(B) of this section, create a data file formatted in accordance with the standard adopted in § 170.205(a)(4) that demonstrates the required vocabulary standards (and value sets) are properly implemented.
# (v) Completeness verification.  Create a data file for each of the applicable document templates referenced in paragraph (g)(6)(iii) of this section without the omission of any of the data included in either paragraph (g)(6)(i)(A) or (B) of this section, as applicable.

@170.315-g-4 @qms @quality @design-performance
Feature: Quality Management System
  As a health IT developer
  I want to maintain a quality management system
  So that the Health IT Module is developed with appropriate quality controls

  Background:
    Given I am developing certified health IT
    And quality is essential

  Scenario: Maintain quality management system
    Given we are using GitHub as our source control system
    When staging a pull request
    Then we shall run Nightwatch E2E tests via Continuous Integration (CircleCI) for Validation purpouses
    And take screenshots of any errors
    And resolve all errors before merging the pull request

  Scenario: Document quality management via software manual
    Given I have a quality management system
    When documenting functionality for ONC HealthIT certification 
    Then all processes shall be documented via LaTeX into a Software Manual
    And screenshots will be automatically inlucded from the continuous integration system
    And the Gherkin BDD tests and a reference to the Nightwatch script will be included for each criterion

  
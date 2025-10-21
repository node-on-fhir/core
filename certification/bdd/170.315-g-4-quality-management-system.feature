# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-g-4-quality-management-system.feature
# § 170.315(g)(4) - Quality Management System

# REGULATORY TEXT FROM 45 CFR § 170.315(g)(4)
#
# (4) Unique device identifier(s) for a patient's implantable device(s).  In accordance with the “Product Instance” in the “Procedure Activity Procedure Section” of the standard specified in § 170.205(a)(4).
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
    Given I am developing and maintaining health IT
    When managing development processes
    Then I shall maintain a quality management system
    And QMS shall cover all aspects of development
    And QMS shall ensure product quality

  Scenario: Document QMS processes
    Given I have a quality management system
    When documenting QMS
    Then all processes shall be documented
    And documentation shall be comprehensive
    And documentation shall be maintained current

  Scenario: Apply QMS to certified capabilities
    Given capabilities are being certified
    When developing certified functionality
    Then QMS shall be applied to all certified capabilities
    And quality controls shall be consistently applied
    And certified capabilities shall meet quality standards

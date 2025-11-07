# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-12-family-health-history.feature
# § 170.315(a)(12) - Family Health History

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(12)
#
# (12) Family health history.  Enable a user to record, change, and access a patient's family health history in accordance with the familial concepts or expressions included in, at a minimum, the version of the standard in § 170.207(a)(1).

@170.315-a-12 @family-history @clinical
Feature: Family Health History
  As a healthcare provider
  I want to record and access family health history
  So that I can assess genetic risk factors and provide appropriate screening

  Background:
    Given I am authenticated as a provider
    And a patient record is selected

  Scenario: Record family health history
    Given I am documenting family health history
    When I record that the patient's mother had breast cancer at age 45
    Then the system shall enable recording per § 170.207(a)(1) standard
    And the system shall use appropriate familial concepts
    And the recording shall capture relationship, condition, and age of onset

  Scenario: Record multiple family members' health history
    Given I am documenting family health history
    When I record health conditions for multiple family members
    Then the system shall enable recording for each family member separately
    And relationships shall be clearly identified
    And each entry shall support familial concepts per standard

  Scenario: Change family health history
    Given family health history has been recorded
    When I need to update or correct family health information
    Then the system shall enable changing of family health history
    And changes shall be tracked with audit trail
    And previous versions shall be preserved

  Scenario: Access family health history
    Given family health history has been recorded
    When I need to review the family health history
    Then the system shall enable access to all family health history
    And the history shall be displayed in organized format
    And the history shall be available for clinical decision support

  Scenario: Record family history of specific genetic condition
    Given I am documenting family health history
    When I record that multiple family members have hereditary condition
    Then the system shall enable recording with appropriate genetic terminology
    And the system shall support pedigree relationships
    And the recording shall conform to § 170.207(a)(1) standard

  Scenario: Utilize family history in clinical decision support
    Given significant family health history has been recorded
    When I am making clinical decisions about screening or prevention
    Then the family history shall be available to CDS
    And CDS may provide risk-based recommendations
    And recommendations shall consider family history appropriately

  Scenario: Generate family history report
    Given comprehensive family health history has been recorded
    When I need to generate a family history report
    Then the system shall enable access to complete family history
    And the report shall be formatted for clinical review
    And the report may support pedigree visualization

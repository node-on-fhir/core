# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-5-demographics-observations.feature
# § 170.315(a)(5) - Patient Demographics and Observations

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(5)
#
# (5) Patient demographics and observations.
#
# (i) Enable a user to record, change, and access patient demographic and observations data including race, ethnicity, preferred language, sex, sex parameter for clinical use, sexual orientation, gender identity, name to use, pronouns, and date of birth.
#
# (A) Race and ethnicity.
#
# (1) Enable each one of a patient's races to be recorded in accordance with, at a minimum, the standard specified in § 170.207(f)(3) and whether a patient declines to specify race.
#
# (2) Enable each one of a patient's ethnicities to be recorded in accordance with, at a minimum, the standard specified in § 170.207(f)(3) and whether a patient declines to specify ethnicity.
#
# (3) Aggregate each one of the patient's races and ethnicities recorded in accordance with paragraphs (a)(5)(i)(A)(1) and (2) of this section to the categories in the standard specified in § 170.207(f)(1).
#
# (B) Preferred language.  Enable preferred language to be recorded in accordance with the standard specified in § 170.207(g)(2) and whether a patient declines to specify a preferred language.
#
# (C) Sex.  Enable sex to be recorded in accordance with the standard specified in § 170.207(n)(1) for the period up to and including December 31, 2025; or § 170.207(n)(2).
#
# (D) Sexual orientation.  Enable sexual orientation to be recorded in accordance with, at a minimum, the version of the standard specified in § 170.207(o)(1) for the period up to and including December 31, 2025; or § 170.207(o)(3), as well as whether a patient declines to specify sexual orientation.
#
# (E) Gender identity.  Enable gender identity to be recorded in accordance with, at a minimum, the version of the standard specified in § 170.207(o)(2) for the period up to and including December 31, 2025; or § 170.207(o)(3), as well as whether a patient declines to specify gender identity.
#
# (F) Sex Parameter for Clinical Use.  Enable at least one sex parameter for clinical use to be recorded in accordance with, at a minimum, the version of the standard specified in § 170.207(n)(3). Conformance with this paragraph is required by January 1, 2026.
#
# (G) Name to Use.  Enable at least one preferred name to use to be recorded. Conformance with this paragraph is required by January 1, 2026.
#
# (H) Pronouns.  Enable at least one pronoun to be recorded in accordance with, at a minimum, the version of the standard specified in § 170.207(o)(4). Conformance with this paragraph is required by January 1, 2026.
#
# (ii) Inpatient setting only.  Enable a user to record, change, and access the preliminary cause of death and date of death in the event of mortality.

@170.315-a-5 @demographics @patient-data @clinical
Feature: Patient Demographics and Observations
  As a healthcare provider
  I want to record comprehensive patient demographic and observation data
  So that I can provide culturally competent and personalized care

  Background:
    Given I am authenticated as a healthcare provider
    And I have appropriate privileges to record patient demographics
    And a patient record is open or being created

  # ------ Race and Ethnicity ------

  Scenario: Record patient's race using standard vocabulary
    Given I am recording patient demographics
    When I record the patient's race
    Then the system shall enable recording per § 170.207(f)(3) standard
    And the system shall support granular race categories
    And the system shall enable recording multiple races

  Scenario: Record multiple races for a patient
    Given a patient identifies with multiple racial categories
    When I record the patient's races
    Then the system shall enable each one of the patient's races to be recorded
    And each race shall be stored as discrete data element
    And all recorded races shall be retrievable

  Scenario: Record patient decline to specify race
    Given I am recording patient demographics
    When the patient declines to specify their race
    Then the system shall enable recording that patient declines to specify race
    And this shall be stored as distinct from missing data

  Scenario: Record patient's ethnicity using standard vocabulary
    Given I am recording patient demographics
    When I record the patient's ethnicity
    Then the system shall enable recording per § 170.207(f)(3) standard
    And the system shall support Hispanic/Latino ethnicity categories

  Scenario: Record multiple ethnicities for a patient
    Given a patient identifies with multiple ethnic categories
    When I record the patient's ethnicities
    Then the system shall enable each one of the patient's ethnicities to be recorded
    And each ethnicity shall be stored as discrete data element

  Scenario: Record patient decline to specify ethnicity
    Given I am recording patient demographics
    When the patient declines to specify their ethnicity
    Then the system shall enable recording that patient declines to specify ethnicity
    And this shall be stored as distinct from missing data

  Scenario: Aggregate race and ethnicity to standard categories
    Given granular race and ethnicity data has been recorded
    When aggregating for reporting purposes
    Then the system shall aggregate to categories per § 170.207(f)(1)
    And aggregation shall maintain data integrity
    And original granular data shall be preserved

  # ------ Preferred Language ------

  Scenario: Record patient's preferred language
    Given I am recording patient demographics
    When I record the patient's preferred language
    Then the system shall enable recording per § 170.207(g)(2) standard
    And the system shall use ISO 639-2 language codes

  Scenario: Record patient decline to specify preferred language
    Given I am recording patient demographics
    When the patient declines to specify preferred language
    Then the system shall enable recording that patient declines to specify
    And this shall be stored as distinct from missing data

  # ------ Sex ------

  Scenario: Record patient's sex (until December 31, 2025)
    Given the current date is before December 31, 2025
    When I record the patient's sex
    Then the system shall enable recording per § 170.207(n)(1) standard
    And the system shall support administrative sex categories

  Scenario: Record patient's sex (after December 31, 2025)
    Given the current date is after December 31, 2025
    When I record the patient's sex
    Then the system shall enable recording per § 170.207(n)(2) standard
    And the system shall support updated sex categories

  # ------ Sex Parameter for Clinical Use (Required by January 1, 2026) ------

  Scenario: Record sex parameter for clinical use
    Given the current date is on or after January 1, 2026
    When I record clinical observations requiring sex parameter
    Then the system shall enable recording at least one sex parameter for clinical use
    And the recording shall be per § 170.207(n)(3) standard
    And the parameter shall be context-specific for clinical use

  Scenario: Support multiple sex parameters for clinical use
    Given the current date is on or after January 1, 2026
    And different clinical contexts require different parameters
    When I record sex parameters for various clinical purposes
    Then the system shall enable recording multiple sex parameters
    And each parameter shall be associated with its clinical context

  # ------ Sexual Orientation ------

  Scenario: Record patient's sexual orientation (until December 31, 2025)
    Given the current date is before December 31, 2025
    When I record the patient's sexual orientation
    Then the system shall enable recording per § 170.207(o)(1) standard
    And the system shall use LOINC and SNOMED CT codes

  Scenario: Record patient's sexual orientation (after December 31, 2025)
    Given the current date is after December 31, 2025
    When I record the patient's sexual orientation
    Then the system shall enable recording per § 170.207(o)(3) standard
    And the system shall support updated vocabulary

  Scenario: Record patient decline to specify sexual orientation
    Given I am recording patient demographics
    When the patient declines to specify sexual orientation
    Then the system shall enable recording that patient declines to specify
    And this shall be stored as distinct from missing data

  # ------ Gender Identity ------

  Scenario: Record patient's gender identity (until December 31, 2025)
    Given the current date is before December 31, 2025
    When I record the patient's gender identity
    Then the system shall enable recording per § 170.207(o)(2) standard
    And the system shall use standard gender identity vocabulary

  Scenario: Record patient's gender identity (after December 31, 2025)
    Given the current date is after December 31, 2025
    When I record the patient's gender identity
    Then the system shall enable recording per § 170.207(o)(3) standard
    And the system shall support updated vocabulary

  Scenario: Record patient decline to specify gender identity
    Given I am recording patient demographics
    When the patient declines to specify gender identity
    Then the system shall enable recording that patient declines to specify
    And this shall be stored as distinct from missing data

  # ------ Name to Use (Required by January 1, 2026) ------

  Scenario: Record patient's preferred name to use
    Given the current date is on or after January 1, 2026
    When I record the patient's preferred name
    Then the system shall enable recording at least one preferred name to use
    And the preferred name shall be distinct from legal name
    And the preferred name shall be usable in clinical workflows

  Scenario: Display patient's preferred name in user interface
    Given the current date is on or after January 1, 2026
    And the patient has a preferred name recorded
    When displaying patient information
    Then the system should prominently display the preferred name
    And the legal name shall remain accessible when needed

  # ------ Pronouns (Required by January 1, 2026) ------

  Scenario: Record patient's pronouns
    Given the current date is on or after January 1, 2026
    When I record the patient's pronouns
    Then the system shall enable recording at least one pronoun
    And the recording shall be per § 170.207(o)(4) standard
    And the pronouns shall use standard vocabulary

  Scenario: Support multiple pronoun sets
    Given the current date is on or after January 1, 2026
    And a patient uses different pronouns in different contexts
    When I record the patient's pronouns
    Then the system shall enable recording multiple pronoun sets
    And each pronoun set shall be stored and retrievable

  # ------ Date of Birth ------

  Scenario: Record patient's complete date of birth
    Given I am recording patient demographics
    When I record the patient's date of birth
    Then the system shall enable recording year, month, and day
    And the date shall be stored in standard format
    And the date shall be used for age calculations

  Scenario: Handle unknown date of birth
    Given the patient's exact date of birth is unknown
    When I record demographic information
    Then the system shall enable recording null value for unknown date of birth
    And the system shall distinguish unknown from missing data

  # ------ Change and Access Demographics ------

  Scenario: Change patient demographic data
    Given patient demographic data has been recorded
    When demographic information changes or needs correction
    Then the system shall enable changing all demographic data elements
    And changes shall be audited with timestamp and user
    And history of changes shall be maintained

  Scenario: Access patient demographic data
    Given patient demographic data has been recorded
    When I need to view patient demographics
    Then the system shall enable access to all demographic data elements
    And demographic data shall be displayed clearly
    And demographic data shall be available throughout clinical workflows

  # ------ Inpatient-Only: Mortality Data ------

  @inpatient-only
  Scenario: Record preliminary cause of death in inpatient setting
    Given I am authenticated in an inpatient setting
    And a patient mortality has occurred
    When I record mortality information
    Then the system shall enable recording preliminary cause of death
    And the cause shall be coded appropriately
    And the information shall be available for death certificate

  @inpatient-only
  Scenario: Record date of death in inpatient setting
    Given I am authenticated in an inpatient setting
    And a patient mortality has occurred
    When I record mortality information
    Then the system shall enable recording date of death
    And the date shall include date and time
    And the date shall be stored in standard format

  @inpatient-only
  Scenario: Change mortality data in inpatient setting
    Given mortality data has been recorded
    When corrections are needed to mortality information
    Then the system shall enable changing preliminary cause of death
    And the system shall enable changing date of death
    And all changes shall be audited

  @inpatient-only
  Scenario: Access mortality data in inpatient setting
    Given mortality data has been recorded
    When generating death certificate or reports
    Then the system shall enable access to preliminary cause of death
    And the system shall enable access to date of death
    And the data shall be formatted appropriately for reporting

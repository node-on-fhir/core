# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-15-sdoh.feature
# § 170.315(a)(15) - Social, Psychological, and Behavioral Data

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(15)
#
# (15) Social, psychological, and behavioral data.  Enable a user to record, change, and access the following patient social, psychological, and behavioral data:
# (i) Financial resource strain.  Enable financial resource strain to be recorded in accordance with the standard specified in § 170.207(p)(1) and whether a patient declines to specify financial resource strain.
# (ii) Education.  Enable education to be recorded in accordance with the standard specified in § 170.207(p)(2) and whether a patient declines to specify education.
# (iii) Stress.  Enable stress to be recorded in accordance with the standard specified in § 170.207(p)(3) and whether a patient declines to specify stress.
# (iv) Depression.  Enable depression to be recorded in accordance with the standard specified in § 170.207(p)(4) and whether a patient declines to specify depression.
# (v) Physical activity.  Enable physical activity to be recorded in accordance with the standard specified in § 170.207(p)(5) and whether a patient declines to specify physical activity.
# (vi) Alcohol use.  Enable alcohol use to be recorded in accordance with the standard specified in § 170.207(p)(6) and whether a patient declines to specify alcohol use.
# (vii) Social connection and isolation.  Enable social connection and isolation to be recorded in accordance the standard specified in § 170.207(p)(7) and whether a patient declines to specify social connection and isolation.
# (viii) Exposure to violence (intimate partner violence).  Enable exposure to violence (intimate partner violence) to be recorded in accordance with the standard specified in § 170.207(p)(8) and whether a patient declines to specify exposure to violence (intimate partner violence).

@170.315-a-15 @sdoh @social-determinants @clinical
Feature: Social, Psychological, and Behavioral Data
  As a healthcare provider
  I want to record social determinants of health data
  So that I can address social needs and provide holistic patient care

  Background:
    Given I am authenticated as a healthcare provider
    And I have a patient record open

  # ------ Financial Resource Strain ------

  Scenario: Record patient's financial resource strain
    Given I am assessing social determinants of health
    When I record financial resource strain information
    Then the system shall enable recording per § 170.207(p)(1) standard
    And the system shall use standardized assessment questions
    And the system shall enable recording patient's financial concerns

  Scenario: Record patient decline to specify financial resource strain
    Given I am assessing financial resource strain
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Education ------

  Scenario: Record patient's education level
    Given I am assessing social determinants of health
    When I record education information
    Then the system shall enable recording per § 170.207(p)(2) standard
    And the system shall use standardized education categories
    And the education data shall be stored in coded format

  Scenario: Record patient decline to specify education
    Given I am assessing education level
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Stress ------

  Scenario: Record patient's stress level
    Given I am assessing social determinants of health
    When I record stress information
    Then the system shall enable recording per § 170.207(p)(3) standard
    And the system shall use standardized stress assessment
    And stress data shall support longitudinal tracking

  Scenario: Record patient decline to specify stress
    Given I am assessing stress level
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Depression ------

  Scenario: Record patient's depression screening
    Given I am assessing social determinants of health
    When I record depression information
    Then the system shall enable recording per § 170.207(p)(4) standard
    And the system shall use standardized depression screening tools
    And depression data shall support clinical decision support

  Scenario: Record patient decline to specify depression
    Given I am assessing depression
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Physical Activity ------

  Scenario: Record patient's physical activity level
    Given I am assessing social determinants of health
    When I record physical activity information
    Then the system shall enable recording per § 170.207(p)(5) standard
    And the system shall use standardized physical activity assessment
    And physical activity data shall support care planning

  Scenario: Record patient decline to specify physical activity
    Given I am assessing physical activity
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Alcohol Use ------

  Scenario: Record patient's alcohol use
    Given I am assessing social determinants of health
    When I record alcohol use information
    Then the system shall enable recording per § 170.207(p)(6) standard
    And the system shall use standardized alcohol screening tools
    And alcohol use data shall support intervention referrals

  Scenario: Record patient decline to specify alcohol use
    Given I am assessing alcohol use
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Social Connection and Isolation ------

  Scenario: Record patient's social connection and isolation
    Given I am assessing social determinants of health
    When I record social connection information
    Then the system shall enable recording per § 170.207(p)(7) standard
    And the system shall use standardized social isolation screening
    And social connection data shall support resource referrals

  Scenario: Record patient decline to specify social connection
    Given I am assessing social connection and isolation
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Exposure to Violence (Intimate Partner Violence) ------

  Scenario: Record patient's exposure to violence screening
    Given I am assessing social determinants of health
    When I record exposure to violence information
    Then the system shall enable recording per § 170.207(p)(8) standard
    And the system shall use standardized IPV screening tools
    And the system shall handle data with appropriate privacy considerations

  Scenario: Record patient decline to specify exposure to violence
    Given I am assessing exposure to violence
    When the patient declines to answer
    Then the system shall enable recording that patient declines to specify
    And this shall be distinct from missing data

  # ------ Change and Access SDOH Data ------

  Scenario: Change social determinants of health data
    Given SDOH data has been previously recorded
    When the patient's social situation changes
    Then the system shall enable changing all SDOH data elements
    And changes shall be tracked with timestamp
    And longitudinal trends shall be viewable

  Scenario: Access social determinants of health data
    Given SDOH data has been recorded
    When I need to review the patient's social needs
    Then the system shall enable access to all SDOH data elements
    And data shall be displayed in organized format
    And data shall be available for care team coordination

  # ------ Clinical Integration ------

  Scenario: Utilize SDOH data in care planning
    Given comprehensive SDOH data has been recorded
    When developing a care plan
    Then SDOH data shall be available for consideration
    And care plan may include social interventions
    And resource referrals may be based on SDOH needs

  Scenario: Generate SDOH summary report
    Given SDOH data has been recorded
    When I need to summarize social needs
    Then the system shall enable generation of SDOH summary
    And summary shall include all recorded SDOH elements
    And summary shall support care coordination

  Scenario: Include SDOH data in transitions of care
    Given SDOH data has been recorded
    When creating transition of care summary
    Then SDOH data shall be included in summary per USCDI
    And receiving provider shall have access to SDOH information
    And SDOH data shall support continuity of social care

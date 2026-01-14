# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-e-3-patient-data-capture.feature
# § 170.315(e)(3) - Patient Health Information Capture

# REGULATORY TEXT FROM 45 CFR § 170.315(e)(3)
#
# (3) Patient health information capture.  Enable a user to:
# (i) Identify, record, and access information directly and electronically shared by a patient (or authorized representative).
# (ii) Reference and link to patient health information documents.

@170.315-e-3 @patient-data-capture @patient-engagement
Feature: Patient Health Information Capture
  As a patient
  I want to enter my own health information
  So that I can contribute to my health record

  Background:
    Given I am authenticated as a patient
    And data capture functionality is available

  Scenario: Capture patient-entered data
    Given I have health information to enter
    When I input the data
    Then the system shall enable structured data entry
    And data shall be captured in appropriate format
    And entered data shall be stored

  Scenario: Capture social history
    Given I want to enter my social history
    When I complete social history questionnaire
    Then the system shall capture the information
    And social history shall be stored appropriately

  Scenario: Capture goals and preferences
    Given I want to document my health goals
    When I enter my goals
    Then the system shall capture goals and preferences
    And goals shall be available to my care team

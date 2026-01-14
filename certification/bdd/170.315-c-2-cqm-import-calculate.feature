# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-c-2-cqm-import-calculate.feature
# § 170.315(c)(2) - Clinical Quality Measures - Import and Calculate

# REGULATORY TEXT FROM 45 CFR § 170.315(c)(2)
#
# (2) Clinical quality measures—import and calculate —
# (i) Import.  Enable a user to import a data file in accordance with the standard specified in § 170.205(h)(2) for one or multiple patients and use such data to perform the capability specified in paragraph (c)(2)(ii) of this section. A user must be able to execute this capability at any time the user chooses and without subsequent developer assistance to operate.
# (ii) Calculate each and every clinical quality measure for which it is presented for certification.

@170.315-c-2 @cqm-import-calculate @clinical-quality-measures @cqm
Feature: Clinical Quality Measures - Import and Calculate
  As a healthcare provider
  I want to import and calculate clinical quality measures
  So that I can analyze quality data from multiple sources

  Background:
    Given I am authenticated as a provider
    And the application has the clinics:quality-measures package installed 

  Scenario: Import CQM data in QRPP format
    Given I have CQM data file in QRPP format
    When I import the data file
    Then the system shall import per § 170.205(h)(2) standard
    And the system shall accept data for one or multiple patients
    And imported data shall be available for calculation

  Scenario: Execute import at any time without assistance
    Given I have CQM data to import
    When I initiate the import process
    Then I shall be able to execute at any time I choose
    And import shall not require subsequent developer assistance
    And the import process shall be independently executable

  Scenario: Calculate certified CQMs from imported data
    Given CQM data has been successfully imported
    When I request CQM calculation
    Then the system shall calculate each certified CQM
    And calculations shall use imported data appropriately
    And calculation results shall be accurate and complete

  Scenario: Calculate CQM for single patient
    Given imported data contains single patient information
    When I calculate CQMs
    Then the system shall perform calculations for the patient
    And results shall be patient-specific
    And all applicable CQMs shall be calculated

  Scenario: Calculate CQM for multiple patients
    Given imported data contains multiple patient information
    When I calculate CQMs
    Then the system shall perform calculations for all patients
    And results shall be aggregated appropriately
    And patient-level and aggregate results shall be available

# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-c-3-cqm-report.feature
# § 170.315(c)(3) - Clinical Quality Measures - Report

# REGULATORY TEXT FROM 45 CFR § 170.315(c)(3)
#
# (3) Clinical quality measures--report.  Enable a user to electronically create a data file for transmission of clinical quality measurement data:
# (i) In accordance with the applicable implementation specifications specified by the CMS implementation guides for Quality Reporting Document Architecture (QRDA), category I, for inpatient measures in § 170.205(h)(3) and CMS implementation guide for QRDA, category III for ambulatory measures in § 170.205 (k)(3); or
# (ii) In accordance with the standards specified in § 170.205(h)(2) and § 170.205(k)(1) and (2) for the period before December 31, 2022.

@170.315-c-3 @cqm-report @clinical-quality-measures @cqm
Feature: Clinical Quality Measures - Report
  As a healthcare provider
  I want to create CQM reports for transmission
  So that I can submit quality data to reporting programs

  Background:
    Given I am authenticated as a provider
    And the application has the clinics:quality-measures package installed 
    And CQM data has been recorded and calculated

  Scenario: Create QRDA Category I report for inpatient measures
    Given I am in an inpatient setting
    When I create a CQM report
    Then the system shall create per QRDA Category I implementation specifications
    And the report shall conform to § 170.205(h)(3)
    And the report shall be formatted per CMS implementation guides

  Scenario: Create QRDA Category III report for ambulatory measures
    Given I am in an ambulatory setting
    When I create a CQM report
    Then the system shall create per QRDA Category III implementation specifications
    And the report shall conform to § 170.205(k)(3)
    And the report shall be formatted per CMS implementation guides

  Scenario: Create CQM report in alternative format (before December 31, 2022)
    Given the current date is before December 31, 2022
    When I create a CQM report
    Then the system may create report per § 170.205(h)(2)
    And the system may format per § 170.205(k)(1) and (2)
    And the alternative format shall meet reporting requirements

  Scenario: Electronically transmit CQM report
    Given a CQM report has been created
    When I transmit the report
    Then the report shall be in electronic format
    And the report shall be transmittable to receiving systems
    And transmission shall support required reporting programs

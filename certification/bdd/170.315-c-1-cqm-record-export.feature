# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-c-1-cqm-record-export.feature
# § 170.315(c)(1) - Clinical Quality Measures - Record and Export

# REGULATORY TEXT FROM 45 CFR § 170.315(c)(1)
#
# (1) Clinical quality measures—record and export —
# (i) Record.  For each and every CQM for which the technology is presented for certification, the technology must be able to record all of the data that would be necessary to calculate each CQM. Data required for CQM exclusions or exceptions must be codified entries, which may include specific terms as defined by each CQM, or may include codified expressions of “patient reason,” “system reason,” or “medical reason.”
# (ii) Export.  A user must be able to export a data file at any time the user chooses and without subsequent developer assistance to operate:
# (A) Formatted in accordance with the standard specified in § 170.205(h)(2);
# (B) Ranging from one to multiple patients; and
# (C) That includes all of the data captured for each and every CQM to which technology was certified under paragraph (c)(1)(i) of this section.

@170.315-c-1 @cqm-record-export @clinical-quality-measures @cqm
Feature: Clinical Quality Measures - Record and Export
  As a healthcare provider
  I want to record and export clinical quality measure data
  So that I can track quality metrics and submit quality reports

  Background:
    Given I am authenticated as a healthcare provider
    And the Health IT Module is certified to specific CQMs

  Scenario: Record all data necessary for CQM calculation
    Given I am documenting patient care for a certified CQM
    When I record clinical data elements
    Then the system shall enable recording of all data necessary to calculate each CQM
    And all required data elements for the CQM shall be capturable
    And the data shall be stored in structured format

  Scenario: Record codified CQM exclusion data
    Given I am documenting a CQM exclusion
    When I enter the exclusion reason
    Then the system shall accept codified entries for exclusions
    And codified entries may include specific terms defined by the CQM
    And codified entries may include "patient reason" expression
    And codified entries may include "system reason" expression
    And codified entries may include "medical reason" expression

  Scenario: Record codified CQM exception data
    Given I am documenting a CQM exception
    When I enter the exception reason
    Then the system shall accept codified entries for exceptions
    And codified entries may include specific terms defined by the CQM
    And codified entries may include reason expressions per CQM requirements

  Scenario: Export CQM data at user's discretion
    Given CQM data has been recorded for patients
    When I choose to export CQM data
    Then the system shall enable export at any time I choose
    And export shall not require subsequent developer assistance
    And I shall be able to initiate export independently

  Scenario: Export CQM data in QRPP format
    Given CQM data has been recorded
    When I export the data
    Then the export shall be formatted per § 170.205(h)(2)
    And the format shall be Quality Reporting Document Architecture QRPP

  Scenario: Export CQM data for single or multiple patients
    Given CQM data exists for multiple patients
    When I configure the export
    Then the system shall enable export ranging from one to multiple patients
    And I shall be able to select specific patients
    Or I shall be able to export data for patient populations

  Scenario: Export includes all captured CQM data
    Given data has been captured for certified CQMs
    When I export CQM data
    Then the export shall include all data captured for each certified CQM
    And no required data elements shall be omitted from export
    And the export shall be complete and accurate

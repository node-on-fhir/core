# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-10-ehi-export.feature
# § 170.315(b)(10) - Electronic Health Information Export

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(10)
#
# (10) Electronic Health Information export --
#
# (i) Single patient electronic health information export.
#
# (A) Enable a user to timely create an export file(s) with all of a single patient's electronic health information that can be stored at the time of certification by the product, of which the Health IT Module is a part.
#
# (B) A user must be able to execute this capability at any time the user chooses and without subsequent developer assistance to operate.
#
# (C) Limit the ability of users who can create export file(s) in at least one of these two ways:
#
# (1) To a specific set of identified users
#
# (2) As a system administrative function.
#
# (D) The export file(s) created must be electronic and in a computable format.
#
# (E) The publicly accessible hyperlink of the export's format must be included with the exported file(s).
#
# (ii) Patient population electronic health information export.  Create an export of all the electronic health information that can be stored at the time of certification by the product, of which the Health IT Module is a part.
#
# (A) The export created must be electronic and in a computable format.
#
# (B) The publicly accessible hyperlink of the export's format must be included with the exported file(s).
#
# (iii) Documentation.  The export format(s) used to support paragraphs (b)(10)(i) and (ii) of this section must be kept up-to-date.

@170.315-b-10 @ehi-export @data-portability @care-coordination
Feature: Electronic Health Information Export
  As a healthcare organization
  I want to export patient health information
  So that I can ensure data portability and patient access rights

  Background:
    Given I am authenticated as a provider
    And I have a patient record open

  # ------ Single Patient Export ------

  Scenario: Export single patient's electronic health information
    Given I need to export a single patient's data
    When I initiate the export
    Then the system shall enable timely creation of export file(s)
    And export shall include all patient's EHI that can be stored by the product
    And export shall be from the time of certification

  Scenario: Execute single patient export at any time
    Given I need to export patient data
    When I choose to execute the export
    Then I shall be able to execute at any time I choose
    And export shall not require subsequent developer assistance to operate
    And export shall complete in reasonable timeframe

  Scenario: Limit single patient export to authorized users
    Given single patient export capability exists
    When controlling access to export function
    Then the ability shall be limited to specific set of identified users
    Or the ability shall be limited as system administrative function
    And unauthorized users shall not have export access

  Scenario: Export in electronic and computable format
    Given I am exporting patient data
    When the export file is created
    Then export file(s) shall be electronic
    And export file(s) shall be in computable format
    And format shall support automated processing

  Scenario: Include publicly accessible hyperlink for export format
    Given export file(s) have been created
    When providing the export to users
    Then publicly accessible hyperlink of export's format shall be included with exported file(s)
    And hyperlink shall provide format documentation
    And documentation shall be sufficient for third parties to process data

  # ------ Patient Population Export ------

  Scenario: Export patient population electronic health information
    Given I need to export data for multiple patients
    When I initiate population export
    Then the system shall create export of all EHI for patient population
    And export shall include all EHI that can be stored by the product
    And export shall be from time of certification

  Scenario: Execute population export at any time
    Given I need to export population data
    When I choose to execute the export
    Then I shall be able to execute at any time without developer assistance
    And export shall complete in reasonable timeframe given data volume

  Scenario: Population export in electronic and computable format
    Given I am exporting population data
    When the export is created
    Then export shall be electronic
    And export shall be in computable format
    And format shall support bulk data processing

  Scenario: Include format hyperlink with population export
    Given population export has been created
    When providing the export
    Then publicly accessible hyperlink of export's format shall be included
    And documentation shall be sufficient for processing

  # ------ Export Format Maintenance ------

  Scenario: Maintain export format documentation
    Given export formats are in use
    When format standards or requirements change
    Then developer shall have process for keeping export formats up-to-date
    And format documentation shall remain current
    And users shall be notified of format changes

  Scenario: Update export format for compatibility
    Given export formats need updating
    When implementing format updates
    Then updates shall maintain backward compatibility where possible
    And documentation shall explain any breaking changes
    And users shall have adequate time to adapt to changes

  # ------ Export Use Cases ------

  Scenario: Export for patient request
    Given a patient requests their complete health record
    When responding to patient request
    Then single patient export shall provide all required data
    And export shall be in format patient or their designee can use

  Scenario: Export for system migration
    Given healthcare organization is migrating to new system
    When preparing for migration
    Then population export shall provide complete data set
    And export format shall support import into receiving system

  Scenario: Export for backup and disaster recovery
    Given healthcare organization needs data backup
    When creating backup
    Then population export shall capture all patient data
    And export shall support data restoration if needed

  # ------ Assurances Requirement ------

  Scenario: Certify to export criterion when storing EHI
    Given a health IT product electronically stores EHI
    When the product is presented for certification
    Then the product must be certified to § 170.315(b)(10)
    And this is required by Assurances Conditions and Maintenance of Certification
    And compliance ensures data portability

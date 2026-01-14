# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-c-4-cqm-filter.feature
# § 170.315(c)(4) - Clinical Quality Measures - Filter

# REGULATORY TEXT FROM 45 CFR § 170.315(c)(4)
#
# (4) Clinical quality measures—filter.
# (i) Record the data listed in paragraph (c)(4)(iii) of this section in accordance with the identified standards, where specified.
# (ii) Filter CQM results at the patient and aggregate levels by each one and any combination of the data listed in paragraph (c)(4)(iii) of this section and be able to:
# (A) Create a data file of the filtered data in accordance with the standards adopted in § 170.205(h)(2) and § 170.205(k)(1) and (2); and
# (B) Display the filtered data results in human readable format.
# (iii) Data.
# (A) Taxpayer Identification Number.
# (B) National Provider Identifier.
# (C) Provider type in accordance with, at a minimum, the standard specified in § 170.207(r)(2).
# (D) Practice site address.
# (E) Patient insurance in accordance with the standard specified in § 170.207(s)(2).
# (F) Patient age.
# (G) Patient sex in accordance with the version of the standard specified in § 170.207(n)(2).
# (H) Patient race and ethnicity in accordance with, at a minimum, the version of the standard specified in § 170.207(f)(3).
# (I) Patient problem list data in accordance with, at a minimum, the version of the standard specified in § 170.207(a)(1).

@170.315-c-4 @cqm-filter @clinical-quality-measures @cqm
Feature: Clinical Quality Measures - Filter
  As a healthcare provider
  I want to filter CQM results by various criteria
  So that I can analyze quality data for specific populations or providers

  Background:
    Given I am authenticated as a provider
    And the application has the clinics:quality-measures package installed 
    And CQM results are available

  # ------ Record Filter Data ------

  Scenario: Record Taxpayer Identification Number
    Given I am recording provider information for CQM filtering
    When I record Taxpayer Identification Number
    Then the system shall store the TIN
    And TIN shall be available for filtering CQM results

  Scenario: Record National Provider Identifier
    Given I am recording provider information for CQM filtering
    When I record National Provider Identifier
    Then the system shall store the NPI
    And NPI shall be available for filtering CQM results

  Scenario: Record provider type
    Given I am recording provider information for CQM filtering
    When I record provider type
    Then the system shall record per § 170.207(r)(2) standard
    And provider type shall use standard taxonomy codes
    And provider type shall be available for filtering

  Scenario: Record practice site address
    Given I am recording location information for CQM filtering
    When I record practice site address
    Then the system shall store complete address
    And address shall be available for filtering CQM results

  Scenario: Record patient insurance
    Given I am recording patient insurance for CQM filtering
    When I record insurance information
    Then the system shall record per § 170.207(s)(2) standard
    And insurance data shall be available for filtering

  Scenario: Record patient age
    Given I am recording patient demographics for CQM filtering
    When I record patient age
    Then the system shall store age information
    And age shall be available for filtering CQM results

  Scenario: Record patient sex for CQM filtering
    Given I am recording patient sex for CQM filtering
    When I record sex information
    Then the system shall record per § 170.207(n)(2) standard
    And sex shall be available for filtering CQM results

  Scenario: Record patient race and ethnicity
    Given I am recording patient demographics for CQM filtering
    When I record race and ethnicity
    Then the system shall record per § 170.207(f)(3) standard
    And race and ethnicity shall be available for filtering

  Scenario: Record patient problem list data
    Given I am recording clinical data for CQM filtering
    When I record problem list data
    Then the system shall record per § 170.207(a)(1) standard
    And problem list shall be available for filtering

  # ------ Filter CQM Results ------

  Scenario: Filter CQM results by single criterion
    Given CQM results are available
    When I apply a filter by one criterion
    Then the system shall filter results at patient level
    And the system shall filter results at aggregate level
    And filtered results shall accurately reflect the criterion

  Scenario: Filter CQM results by multiple criteria
    Given CQM results are available
    When I apply filters by any combination of available criteria
    Then the system shall filter by all selected criteria simultaneously
    And filtered results shall meet all filter conditions
    And results shall be accurate for the combined filters

  Scenario: Create data file of filtered results
    Given CQM results have been filtered
    When I export the filtered results
    Then the system shall create file per § 170.205(h)(2)
    And the system shall format per § 170.205(k)(1) and (2)
    And the file shall contain only filtered data

  Scenario: Display filtered results in human readable format
    Given CQM results have been filtered
    When I view the filtered results
    Then the system shall display in human readable format
    And the display shall be clear and understandable
    And filtered data shall be easily reviewable

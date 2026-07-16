# certification/bdd/170.315-g-9-application-access-all-data.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(g)(9)
#
# (9) Application access--all data request.  The following technical outcome and conditions must be met through the demonstration of an application programming interface.
# (i) Functional requirements.
# (A)

@170.315-g-9 @api @all-data-request @design-performance
Feature: Application Access - All Data Request
  As an application developer
  I want to request all patient data at once through an API
  So that I can retrieve complete patient information efficiently

  Background:
    Given the API is available
    And I have a valid patient ID or token

  Scenario: Request all data in CCD format
    Given I have a patient identifier
    When I request all data classes per § 170.213
    Then the API shall return a summary record formatted per § 170.205(a)(4)
    And the summary shall follow the CCD document template
    And all USCDI data classes shall be included

  Scenario: Request all data for specific date
    Given I have a patient identifier
    When I request all data associated with a specific date
    Then the API shall return all data for that date

  Scenario: Request all data within date range
    Given I have a patient identifier
    When I request all data within a specified date range
    Then the API shall return all data within that range

  Scenario: API documentation is publicly accessible
    Given the API is implemented
    When I access the API documentation
    Then documentation shall include complete API specifications
    And documentation shall be available via publicly accessible hyperlink
    And documentation shall include software component requirements

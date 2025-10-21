# certification/bdd/170.315-g-8-application-access-data-category.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(g)(8)
#
# (8) Application access—data category request.  The following technical outcome and conditions must be met through the demonstration of an application programming interface.
# (i) Functional requirements.
# (A) Respond to requests for patient data (based on an ID or other token) for each of the individual data categories specified in the Common Clinical Data Set and return the full set of data for that data category (according to the specified standards, where applicable) in a computable format.
# (B) Respond to requests for patient data associated with a specific date as well as requests for patient data within a specified date range.
# (ii) Documentation —
# (A) The API must include accompanying documentation that contains, at a minimum:

@170.315-g-8 @api @data-category-request @design-performance
Feature: Application Access - Data Category Request
  As an application developer
  I want to request patient data by category through an API
  So that I can access specific types of clinical data

  Background:
    Given the API is available
    And I have a valid patient ID or token

  Scenario: Request individual data category
    Given I have a patient identifier
    When I request a specific data category from the Common Clinical Data Set
    Then the API shall return the full set of data for that category
    And the data shall be in a computable format
    And the data shall conform to specified standards

  Scenario: Request data for specific date
    Given I have a patient identifier
    When I request data associated with a specific date
    Then the API shall return data for that date

  Scenario: Request data within date range
    Given I have a patient identifier
    When I request data within a specified date range
    Then the API shall return all data within that range

  Scenario: API documentation is available
    Given the API is implemented
    When I access the API documentation
    Then documentation shall include API syntax and function names
    And documentation shall include required and optional parameters
    And documentation shall include return variables and types
    And documentation shall include exception handling methods
    And documentation shall be publicly accessible via hyperlink

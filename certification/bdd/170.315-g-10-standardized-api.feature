# certification/bdd/170.315-g-10-standardized-api.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(g)(10)
#
# (10) Standardized API for patient and population services.  The following technical outcomes and conditions must be met through the demonstration of application programming interface technology.
# (i) Data response.
# (A) Respond to requests for a single patient's data according to the standards and implementation specifications adopted in § 170.215(a) and in § 170.215(b)(1), including the mandatory capabilities described in “US Core Server CapabilityStatement,” for each of the data included in the standards adopted in § 170.213. All data elements indicated as “mandatory” and “must support” by the standards and implementation specifications must be supported.
# (B) Respond to requests for multiple patients' data as a group according to the standards and implementation specifications adopted in § 170.215(a), (b)(1), and (d), for each of the data included in the standards adopted in § 170.213. All data elements indicated as “mandatory” and “must support” by the standards and implementation specifications must be supported.
# (ii) Supported search operations.
# (A) Respond to search requests for a single patient's data consistent with the search criteria included in the implementation specifications adopted in § 170.215(b)(1), specifically the mandatory capabilities described in “US Core Server CapabilityStatement.”
# (B) Respond to search requests for multiple patients' data consistent with the search criteria included in the implementation specification adopted in § 170.215(d).
# (iii) Application registration.  Enable an application to register with the Health IT Module's “authorization server.”
# (iv) Secure connection.
# (A) Establish a secure and trusted connection with an application that requests data for patient and user scopes in accordance with the implementation specifications adopted in § 170.215(b)(1) and (c).
# (B) Establish a secure and trusted connection with an application that requests data for system scopes in accordance with the implementation specification adopted in § 170.215(d).
# (v) Authentication and authorization —
# (A) Authentication and authorization for patient and user scopes —

@170.315-g-10 @api @fhir @smart-on-fhir @design-performance
Feature: Standardized API for Patient and Population Services
  As an application developer
  I want to access patient data through a standardized FHIR API
  So that I can build interoperable healthcare applications

  Background:
    Given the API conforms to § 170.215 standards
    And the API supports USCDI data per § 170.213

  # Data Response

  Scenario: Respond to single patient data request
    Given I request a single patient's data
    When the API processes the request
    Then the system shall respond per § 170.215(a) and § 170.215(b)(1)
    And all mandatory and must support elements shall be included
    And the response shall conform to US Core Server CapabilityStatement

  Scenario: Respond to multiple patients data request
    Given I request multiple patients' data as a group
    When the API processes the request
    Then the system shall respond per § 170.215(a), (b)(1), and (d)
    And all mandatory and must support elements shall be included

  # Search Operations

  Scenario: Support single patient search operations
    Given I perform a search for a single patient's data
    When the API processes the search request
    Then search shall conform to § 170.215(b)(1)
    And mandatory US Core Server CapabilityStatement search criteria shall be supported

  Scenario: Support multiple patients search operations
    Given I perform a search for multiple patients' data
    When the API processes the search request
    Then search shall conform to § 170.215(d)

  # Application Registration

  Scenario: Enable application registration
    Given I am developing a third-party application
    When I register my application
    Then the system shall enable registration with the authorization server

  # Secure Connection

  Scenario: Establish secure connection for patient and user scopes
    Given my application requests data for patient scopes
    When I establish a connection
    Then the system shall create secure and trusted connection per § 170.215(b)(1) and (c)

  Scenario: Establish secure connection for system scopes
    Given my application requests data for system scopes
    When I establish a connection
    Then the system shall create secure and trusted connection per § 170.215(d)

  # Authentication and Authorization

  Scenario: Authenticate first-time connection with refresh token
    Given this is a first-time connection
    When authentication and authorization occur
    Then the system shall issue a refresh token valid for at least three months
    And the token shall be issued to confidential apps per § 170.215(c)

  Scenario: Authenticate subsequent connection without re-authorization
    Given I have a valid refresh token
    When I connect again
    Then access shall be granted without re-authorization
    And a new refresh token valid for at least three months shall be issued

  # Patient Authorization Revocation

  Scenario: Revoke application access at patient direction
    Given a patient requests to revoke my application's access
    When the revocation is requested
    Then the authorization server shall revoke access within 1 hour

  # Token Introspection

  Scenario: Validate issued tokens
    Given the authorization server has issued tokens
    When token introspection is performed
    Then the server shall receive and validate tokens per § 170.215(c)

  # Documentation

  Scenario: Provide complete API documentation
    Given the API is implemented
    When documentation is accessed
    Then complete documentation shall be available
    And documentation shall include all technical requirements
    And documentation shall include registration requirements
    And documentation shall be publicly accessible without preconditions

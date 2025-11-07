# certification/bdd/170.315-d-5-automatic-access-timeout.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(d)(5)
#
# (5) Automatic access time-out.
# (i) Automatically stop user access to health information after a predetermined period of inactivity.
# (ii) Require user authentication in order to resume or regain the access that was stopped.

@170.315-d-5 @automatic-timeout @privacy-security
Feature: Automatic Access Time-out
  As a system administrator
  I want the system to automatically log out inactive users
  So that unauthorized access to health information is prevented

  Background:
    Given I am authenticated as a user
    And automatic access time-out is enabled

  Scenario: Automatically stop access after inactivity
    Given I am accessing health information
    And a predetermined period of inactivity has elapsed
    When the timeout period is reached
    Then the system shall automatically stop my access to health information

  Scenario: Require authentication to resume access
    Given my access was stopped due to inactivity
    When I attempt to resume access
    Then the system shall require user authentication
    And I must re-authenticate to regain access

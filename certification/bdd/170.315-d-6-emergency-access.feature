# certification/bdd/170.315-d-6-emergency-access.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(d)(6)
#
# (6) Emergency access.  Permit an identified set of users to access electronic health information during an emergency.

@170.315-d-6 @emergency-access @privacy-security
Feature: Emergency Access
  As an emergency responder
  I want to access patient information during emergencies
  So that I can provide appropriate urgent care

  Background:
    Given an emergency situation exists
    And I am part of an identified set of emergency users

  Scenario: Permit emergency user access during emergency
    Given I am identified as an emergency access user
    When I request access to electronic health information during an emergency
    Then the system shall permit access to the information

  Scenario: Restrict emergency access to identified users only
    Given I am not identified as an emergency access user
    When I attempt emergency access
    Then the system shall deny access

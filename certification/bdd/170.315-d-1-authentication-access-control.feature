# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-1-authentication-access-control.feature
# § 170.315(d)(1) - Authentication, Access Control, and Authorization

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(1)
#
# (1) Authentication, access control, and authorization.
# (i) Verify against a unique identifier(s) (e.g., username or number) that a user seeking access to electronic health information is the one claimed; and
# (ii) Establish the type of access to electronic health information a user is permitted based on the unique identifier(s) provided in paragraph (d)(1)(i) of this section, and the actions the user is permitted to perform with the technology.

@170.315-d-1 @authentication @access-control @privacy-security
Feature: Authentication, Access Control, and Authorization
  As a system administrator
  I want to control user access to electronic health information
  So that only authorized users can access patient data

  Background:
    Given the Health IT system stores electronic health information
    And user accounts have been configured

  Scenario: Verify user identity with unique identifier
    Given a user is seeking access to EHI
    When the user provides credentials
    Then the system shall verify against unique identifier
    And unique identifier may be username
    Or unique identifier may be user number
    And the system shall confirm user is the one claimed

  Scenario: Establish permitted access type
    Given a user's identity has been verified
    When determining access permissions
    Then the system shall establish type of access permitted
    And access type shall be based on unique identifier provided
    And access permissions shall be role-based

  Scenario: Control permitted actions
    Given a user has been authenticated
    When the user accesses the system
    Then the system shall control actions user is permitted
    And permissions shall be based on user role
    And unauthorized actions shall be prevented

  Scenario: Deny access to unauthorized users
    Given an invalid user attempts access
    When authentication fails
    Then the system shall deny access to EHI
    And the failed attempt shall be logged
    And the user shall receive appropriate notification

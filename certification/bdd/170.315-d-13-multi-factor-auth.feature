# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-13-multi-factor-auth.feature
# § 170.315(d)(13) - Multi-Factor Authentication

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(13)
#
# (13) Multi-factor authentication.  Health IT developers must make one of the following attestations and, as applicable, provide the specified accompanying information:
# (i) Yes—the Health IT Module supports the authentication, through multiple elements, of the user's identity with the use of industry-recognized standards. When attesting “yes,” the health IT developer must describe the use cases supported.
# (ii) No—the Health IT Module does not support authentication, through multiple elements, of the user's identity with the use of industry-recognized standards. When attesting “no,” the health IT developer may explain why the Health IT Module does not support authentication, through multiple elements, of the user's identity with the use of industry-recognized standards.

@170.315-d-13 @mfa @multi-factor @privacy-security
Feature: Multi-Factor Authentication
  As a security administrator
  I want multi-factor authentication
  So that user accounts have enhanced security

  Background:
    Given user accounts exist in the system
    And MFA is configured

  Scenario: Require multiple authentication factors
    Given a user is authenticating
    When logging into the system
    Then the system shall require multiple factors
    And factors shall be from different categories
    And authentication shall be strengthened

  Scenario: Support knowledge factor
    Given a user is providing authentication factors
    When using knowledge factor
    Then the system shall accept something user knows
    And this may be password or PIN
    And knowledge factor shall be verified

  Scenario: Support possession factor
    Given a user is providing authentication factors
    When using possession factor
    Then the system shall verify something user has
    And this may be token or smart card or phone
    And possession factor shall be validated

  Scenario: Enforce MFA for privileged access
    Given a user has privileged access rights
    When authenticating for privileged access
    Then the system shall require multi-factor authentication
    And all factors shall be verified
    And privileged access shall be protected

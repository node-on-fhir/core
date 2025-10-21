# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-12-encrypt-credentials.feature
# § 170.315(d)(12) - Encrypt Authentication Credentials

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(12)
#
# (12) Encrypt authentication credentials.  Health IT developers must make one of the following attestations and may provide the specified accompanying information, where applicable:
# (i) Yes—the Health IT Module encrypts stored authentication credentials in accordance with standards adopted in § 170.210(a)(2).
# (ii) No—the Health IT Module does not encrypt stored authentication credentials. When attesting “no,” the health IT developer may explain why the Health IT Module does not support encrypting stored authentication credentials.

@170.315-d-12 @credential-encryption @privacy-security
Feature: Encrypt Authentication Credentials
  As a security administrator
  I want authentication credentials encrypted
  So that user passwords and credentials are protected

  Background:
    Given users have authentication credentials
    And credentials are stored in the system

  Scenario: Encrypt stored credentials
    Given user credentials are stored
    When credentials are persisted
    Then the system shall encrypt the credentials
    And encryption shall use strong algorithms
    And credentials shall be protected at rest

  Scenario: Encrypt credentials in transmission
    Given credentials are transmitted during authentication
    When credentials are sent over network
    Then the system shall encrypt during transmission
    And transmission shall be secure
    And credentials shall be protected in transit

  Scenario: Hash passwords appropriately
    Given user passwords are stored
    When persisting passwords
    Then the system shall use appropriate hashing
    And hashing shall use strong algorithms
    And passwords shall not be reversible

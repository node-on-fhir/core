# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-d-9-trusted-connection.feature
# § 170.315(d)(9) - Trusted Connection

# REGULATORY TEXT FROM 45 CFR § 170.315(d)(9)
#
# (9) Trusted connection.  Establish a trusted connection using one of the following methods:
# (i) Message-level.  Encrypt and integrity protect message contents in accordance with the standards specified in § 170.210(a)(2) and (c)(2).
# (ii) Transport-level.  Use a trusted connection in accordance with the standards specified in § 170.210(a)(2) and (c)(2).

@170.315-d-9 @trusted-connection @encryption @privacy-security
Feature: Trusted Connection
  As a system administrator
  I want secure data transmission
  So that electronic health information is protected in transit

  Background:
    Given the Health IT system transmits EHI electronically

  Scenario: Encrypt message contents at message-level
    Given EHI is being transmitted
    When using message-level encryption
    Then the system shall encrypt per § 170.210(a)(2)
    And the system shall protect integrity per § 170.210(c)(2)
    And message contents shall be secured

  Scenario: Use trusted connection at transport-level
    Given EHI is being transmitted
    When using transport-level security
    Then the system shall use trusted connection per § 170.210(a)(2)
    And the system shall meet requirements of § 170.210(c)(2)
    And transport shall be secured

  Scenario: Support secure electronic transmission for VDT
    Given the system is certified to § 170.315(e)(1)
    When patient transmits data to third party
    Then trusted connection shall be demonstrated
    And transmission shall be secure
    And this criterion must be explicitly tested with (e)(1)

  Scenario: Support secure electronic messaging
    Given the system is certified to § 170.315(e)(2)
    When secure messaging is used
    Then trusted connection shall be demonstrated
    And messaging shall be secure
    And this criterion must be explicitly tested with (e)(2)

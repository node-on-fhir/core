# certification/bdd/170.315-d-8-integrity.feature
# REGULATORY TEXT FROM 45 CFR § 170.315(d)(8)
#
# (8) Integrity.
# (i) Create a message digest in accordance with the standard specified in § 170.210(c)(2).
# (ii) Verify in accordance with the standard specified in § 170.210(c)(2) upon receipt of electronically exchanged health information that such information has not been altered.

@170.315-d-8 @integrity @privacy-security
Feature: Integrity
  As a system administrator
  I want to ensure health information has not been altered during exchange
  So that data integrity is maintained

  Background:
    Given the system exchanges health information electronically

  Scenario: Create message digest for outgoing information
    Given I am sending electronic health information
    When I prepare the information for transmission
    Then the system shall create a message digest per § 170.210(c)(2)

  Scenario: Verify integrity of received information
    Given I have received electronically exchanged health information
    When I verify the received information
    Then the system shall verify per § 170.210(c)(2)
    And the system shall confirm the information has not been altered

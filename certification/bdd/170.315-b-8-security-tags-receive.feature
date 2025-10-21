# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-8-security-tags-receive.feature
# § 170.315(b)(8) - Security Tags - Summary of Care - Receive

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(8)
#
# (8) Security tags—summary of care—receive.
#
# (i) Enable a user to receive a summary record that is formatted in accordance with the standard adopted in § 170.205(a)(4) that is tagged as restricted and subject to restrictions on re-disclosure according to the standard adopted in § 170.205(o)(1) at the document, section, and entry (data element) level; and
#
# (ii) Preserve privacy markings to ensure fidelity to the tagging based on consent and with respect to sharing and re-disclosure restrictions.

@170.315-b-8 @security-tags @privacy @receive @care-coordination
Feature: Security Tags - Summary of Care - Receive
  As a healthcare provider
  I want to receive and honor privacy markings on health information
  So that I can respect patient privacy preferences and legal requirements

  Background:
    Given I am authenticated as a healthcare provider
    And I am receiving a summary of care document

  Scenario: Receive summary with document-level restriction tags
    Given a summary record with document-level privacy tags is transmitted
    When I receive the summary
    Then the system shall enable receipt of tagged summary per § 170.205(o)(1)
    And the summary shall be formatted per § 170.205(a)(4)
    And document-level restrictions shall be recognized

  Scenario: Receive summary with section-level restriction tags
    Given a summary record with section-level privacy tags is transmitted
    When I receive the summary
    Then the system shall enable receipt of tagged sections per § 170.205(o)(1)
    And section-level restrictions shall be recognized

  Scenario: Receive summary with entry-level restriction tags
    Given a summary record with entry-level privacy tags is transmitted
    When I receive the summary
    Then the system shall enable receipt of tagged entries per § 170.205(o)(1)
    And entry-level (data element) restrictions shall be recognized

  Scenario: Preserve privacy markings on received information
    Given a tagged summary is received
    When storing the received information
    Then the system shall preserve privacy markings
    And tags shall remain associated with respective data
    And tag integrity shall be maintained

  Scenario: Ensure fidelity to tagging based on consent
    Given a tagged summary reflects patient consent decisions
    When processing the received information
    Then the system shall ensure fidelity to tagging
    And tagging shall accurately reflect original consent
    And tags shall not be modified or removed

  Scenario: Respect sharing restrictions
    Given a tagged summary includes sharing restrictions
    When accessing the received information
    Then the system shall respect sharing restrictions
    And restricted information shall have appropriate access controls

  Scenario: Respect re-disclosure restrictions
    Given a tagged summary includes re-disclosure restrictions
    When potentially re-disclosing information
    Then the system shall respect re-disclosure restrictions
    And system shall prevent unauthorized re-disclosure
    And users shall be alerted to re-disclosure limitations

  Scenario: Display privacy markings to user
    Given tagged information is being viewed
    When displaying the information
    Then privacy markings shall be visible to user
    And user shall understand handling requirements
    And warnings shall be appropriately prominent

  Scenario: Enforce access controls based on privacy markings
    Given tagged information has been received
    When users attempt to access the information
    Then access controls shall consider privacy markings
    And appropriately authorized users shall have access
    And unauthorized users shall be restricted

  Scenario: Maintain privacy markings during data operations
    Given tagged information is processed within the system
    When performing reconciliation, updates, or other operations
    Then privacy markings shall be preserved throughout operations
    And tag integrity shall be maintained across workflows

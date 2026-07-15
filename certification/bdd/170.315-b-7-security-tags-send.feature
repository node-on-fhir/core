# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-7-security-tags-send.feature
# § 170.315(b)(7) - Security Tags - Summary of Care - Send

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(7)
#
# (7) Security tags--summary of care--send.  Enable a user to create a summary record formatted in accordance with the standard adopted in § 170.205(a)(4) that is tagged as restricted and subject to restrictions on re-disclosure according to the standard adopted in § 170.205(o)(1) at the document, section, and entry (data element) level.

@170.315-b-7 @security-tags @privacy @send @care-coordination
Feature: Security Tags - Summary of Care - Send
  As a healthcare provider
  I want to tag sensitive information with privacy markings
  So that I can protect patient privacy according to their consent

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And I am creating a summary of care document

  Scenario: Tag summary record as restricted at document level
    Given the summary contains sensitive information
    When I create the summary record
    Then the system shall enable tagging as restricted per § 170.205(o)(1)
    And the document shall be formatted per § 170.205(a)(4)
    And document-level tags shall indicate restriction

  Scenario: Tag summary record as restricted at section level
    Given specific sections contain sensitive information
    When I create the summary record
    Then the system shall enable tagging sections as restricted per § 170.205(o)(1)
    And section-level tags shall indicate restriction
    And different sections may have different privacy markings

  Scenario: Tag summary record as restricted at entry level
    Given specific data elements are sensitive
    When I create the summary record
    Then the system shall enable tagging entries as restricted per § 170.205(o)(1)
    And entry-level (data element) tags shall indicate restriction
    And granular privacy control shall be supported

  Scenario: Apply restriction tags for re-disclosure limitations
    Given tagged information has re-disclosure restrictions
    When I create the summary record
    Then tags shall be subject to restrictions on re-disclosure
    And restrictions shall be machine-readable
    And receiving systems shall be able to honor restrictions

  Scenario: Tag mental health information
    Given the summary contains mental health information
    When I create the summary record
    Then mental health information may be tagged with specific privacy marking
    And tags shall indicate special handling requirements

  Scenario: Tag substance abuse treatment information
    Given the summary contains substance abuse treatment information
    When I create the summary record
    Then substance abuse information may be tagged per 42 CFR Part 2
    And tags shall indicate federal protection requirements

  Scenario: Tag HIV-related information
    Given the summary contains HIV-related information
    When I create the summary record
    Then HIV information may be tagged with specific privacy marking
    And tags shall indicate applicable state law protections

  Scenario: Support multiple simultaneous privacy markings
    Given a document contains multiple types of sensitive information
    When I create the summary record
    Then multiple privacy markings may be applied simultaneously
    And each marking shall be independently processable

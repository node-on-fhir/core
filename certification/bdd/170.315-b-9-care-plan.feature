# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-9-care-plan.feature
# § 170.315(b)(9) - Care Plan

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(9)
#
# (9) Care plan.  Enable a user to record, change, access, create, and receive care plan information in accordance with:
#
# (i) The Care Plan document template, including the Health Status Evaluations and Outcomes Section and Interventions Section (V2), in the standard specified in § 170.205(a)(4); and
#
# (ii) The standard in § 170.205(a)(5) for the time period up to and including December 31, 2025; or § 170.205(a)(6).

@170.315-b-9 @care-plan @care-coordination
Feature: Care Plan
  As a healthcare provider
  I want to create and manage comprehensive care plans
  So that I can coordinate interdisciplinary care and track patient goals

  Background:
    Given I am authenticated as a healthcare provider
    And I have a patient record open

  Scenario: Record care plan information
    Given I am developing a care plan for the patient
    When I document care plan elements
    Then the system shall enable recording care plan per § 170.205(a)(4)
    And care plan shall use Care Plan document template
    And care plan shall include Health Status Evaluations and Outcomes Section
    And care plan shall include Interventions Section (V2)

  Scenario: Change care plan information
    Given an existing care plan has been created
    When patient status or goals change
    Then the system shall enable changing care plan
    And changes shall be tracked with version history
    And care team shall be notified of significant changes

  Scenario: Access care plan information
    Given a care plan has been created
    When I need to review the care plan
    Then the system shall enable access to care plan
    And care plan shall be displayed in organized format
    And all sections shall be easily navigable

  Scenario: Create new care plan
    Given a patient needs a care plan
    When I create a new care plan
    Then the system shall enable creating care plan per § 170.205(a)(4)
    And I shall be able to add goals, interventions, and outcomes
    And care plan shall be shareable with care team

  Scenario: Receive care plan from another provider
    Given another provider is sending a care plan
    When the care plan is transmitted
    Then the system shall enable receiving care plan
    And received care plan shall conform to § 170.205(a)(4)
    And I shall be able to review and incorporate into my care plan

  Scenario: Include health status evaluations in care plan
    Given I am creating a care plan
    When documenting current health status
    Then the care plan shall include Health Status Evaluations and Outcomes Section
    And current health status shall be documented
    And evaluation dates shall be recorded

  Scenario: Include interventions in care plan
    Given I am creating a care plan
    When planning care interventions
    Then the care plan shall include Interventions Section (V2)
    And interventions shall be specific and actionable
    And responsible parties shall be identified

  Scenario: Comply with C-CDA standard until December 31, 2025
    Given the current date is before December 31, 2025
    When working with care plans
    Then care plans shall comply with § 170.205(a)(5)

  Scenario: Comply with updated C-CDA standard after December 31, 2025
    Given the current date is after December 31, 2025
    When working with care plans
    Then care plans shall comply with § 170.205(a)(6)

  Scenario: Share care plan with interdisciplinary team
    Given a comprehensive care plan has been created
    When sharing with care team members
    Then care plan shall be accessible to authorized team members
    And team members shall be able to view relevant sections
    And updates shall be communicated to team

  Scenario: Track progress toward care plan goals
    Given a care plan with defined goals exists
    When documenting patient progress
    Then progress toward goals shall be trackable
    And outcomes shall be measurable
    And goal achievement shall be documented

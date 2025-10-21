# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-4-drug-interactions.feature
# § 170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks for CPOE

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(4)
#
# (4) Drug-drug, drug-allergy interaction checks for CPOE —
#
# (i) Interventions.  Before a medication order is completed and acted upon during computerized provider order entry (CPOE), interventions must automatically indicate to a user drug-drug and drug-allergy contraindications based on a patient's medication list and medication allergy list.
#
# (ii) Adjustments.
#
# (A) Enable the severity level of interventions provided for drug-drug interaction checks to be adjusted.
#
# (B) Limit the ability to adjust severity levels in at least one of these two ways:
#
# (1) To a specific set of identified users.
#
# (2) As a system administrative function.

@170.315-a-4 @cpoe @drug-interactions @safety @clinical
Feature: Drug-Drug and Drug-Allergy Interaction Checks for CPOE
  As a prescribing provider
  I want automatic alerts for potential drug interactions
  So that I can prevent adverse drug events and improve patient safety

  Background:
    Given I am authenticated as a prescribing provider
    And the patient has an active medication list
    And the patient has a medication allergy list
    And interaction checking is enabled

  Scenario: Automatic drug-drug interaction checking during CPOE
    Given the patient is currently taking "Warfarin 5mg daily"
    When I attempt to order "Aspirin 325mg daily"
    And I complete the medication order entry
    But before the order is completed and acted upon
    Then the system shall automatically indicate drug-drug contraindications
    And the intervention shall display before order completion
    And the alert shall describe the interaction between Warfarin and Aspirin

  Scenario: Automatic drug-allergy interaction checking during CPOE
    Given the patient has a documented allergy to "Penicillin"
    When I attempt to order "Amoxicillin 500mg"
    And I complete the medication order entry
    But before the order is completed and acted upon
    Then the system shall automatically indicate drug-allergy contraindications
    And the intervention shall display before order completion
    And the alert shall identify the cross-reactivity concern

  Scenario: Display interventions based on active medication list
    Given the patient's active medication list contains multiple medications
    When I order a new medication
    Then the system shall check against all medications in the active medication list
    And all relevant drug-drug interactions shall be displayed

  Scenario: Display interventions based on medication allergy list
    Given the patient's allergy list contains documented allergies
    When I order a new medication
    Then the system shall check against all allergies in the medication allergy list
    And all relevant drug-allergy contraindications shall be displayed

  Scenario: Enable severity level adjustment for drug-drug interactions
    Given I am a system administrator or authorized user
    When I access the drug-drug interaction settings
    Then the system shall enable adjustment of severity levels
    And severity levels shall control which interactions trigger alerts

  Scenario: Limit severity level adjustment to authorized users
    Given severity level adjustment capability exists
    When limiting who can adjust severity levels
    Then the system shall limit adjustment to a specific set of identified users
    Or the system shall limit adjustment as a system administrative function
    And unauthorized users shall not be able to modify severity settings

  Scenario: Display high-severity drug-drug interaction
    Given the interaction checking system is configured with severity levels
    And the patient is taking "MAO Inhibitor"
    When I attempt to order "SSRI antidepressant"
    Then the system shall display high-severity interaction alert
    And the alert shall be prominent and require acknowledgment

  Scenario: Display moderate-severity drug-drug interaction
    Given the interaction checking system is configured with severity levels
    And the patient is taking "Atorvastatin"
    When I attempt to order "Clarithromycin"
    Then the system shall display moderate-severity interaction alert
    And the alert shall provide clinical guidance

  Scenario: Provider override of drug interaction alert
    Given a drug-drug interaction alert is displayed
    When I review the alert and determine the benefit outweighs risk
    Then the system shall allow me to override the alert
    And the override shall require documentation of clinical reasoning
    And the override shall be recorded in the audit log

  Scenario: Multiple simultaneous interaction alerts
    Given the patient has complex medication regimen
    When I order a medication that interacts with multiple existing medications
    Then the system shall display all relevant interactions
    And interactions shall be prioritized by severity

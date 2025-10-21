# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-1-cpoe-medications.feature
# § 170.315(a)(1) - Computerized Provider Order Entry - Medications

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(1)
#
# (1) Computerized provider order entry—medications.
#
# (i) Enable a user to record, change, and access medication orders.
#
# (ii) Optional.  Include a "reason for order" field.

@170.315-a-1 @cpoe @medications @clinical
Feature: Computerized Provider Order Entry - Medications
  As a prescribing provider
  I want to electronically create and manage medication orders
  So that I can reduce prescribing errors and improve patient safety

  Background:
    Given I am authenticated as a prescribing provider
    And I have appropriate privileges to order medications
    And a patient record is open

  Scenario: Create a new medication order
    Given the patient has no existing medication order for "Lisinopril 10mg"
    When I create a medication order for "Lisinopril 10mg oral tablet once daily"
    Then the system shall enable recording of the medication order
    And the order shall be stored in the patient's electronic record
    And the order shall be available for review and transmission

  Scenario: Change an existing medication order
    Given the patient has an active medication order for "Lisinopril 10mg once daily"
    When I change the medication order to "Lisinopril 20mg once daily"
    Then the system shall enable changing of the medication order
    And the modified order shall be stored in the patient's electronic record
    And the modification history shall be maintained

  Scenario: Access existing medication orders
    Given the patient has multiple active medication orders
    When I request to view the patient's medication orders
    Then the system shall enable access to all medication orders
    And the orders shall be displayed with relevant details
    And I shall be able to view order history

  Scenario: Optionally include reason for medication order
    Given I am creating a new medication order for "Metformin 500mg"
    When I have the option to include a reason for the order
    Then the system may include a "reason for order" field
    And if provided, the reason shall be stored with the order

# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-2-cpoe-laboratory.feature
# § 170.315(a)(2) - Computerized Provider Order Entry - Laboratory

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(2)
#
# (2) Computerized provider order entry—laboratory.
#
# (i) Enable a user to record, change, and access laboratory orders.
#
# (ii) Optional.  Include a "reason for order" field.

@170.315-a-2 @cpoe @laboratory @clinical
Feature: Computerized Provider Order Entry - Laboratory
  As an ordering provider
  I want to electronically create and manage laboratory orders
  So that I can efficiently order appropriate diagnostic tests

  Background:
    Given I am authenticated as an ordering provider
    And I have appropriate privileges to order laboratory tests
    And a patient record is open

  Scenario: Create a new laboratory order
    Given the patient requires a "Complete Blood Count"
    When I create a laboratory order for "CBC with differential"
    Then the system shall enable recording of the laboratory order
    And the order shall include all necessary details for specimen collection
    And the order shall be transmitted to the laboratory system

  Scenario: Change an existing laboratory order
    Given the patient has a pending laboratory order for "Basic Metabolic Panel"
    When I change the laboratory order to "Comprehensive Metabolic Panel"
    Then the system shall enable changing of the laboratory order
    And the modified order shall be communicated to the laboratory
    And the change shall be documented in the order history

  Scenario: Access existing laboratory orders
    Given the patient has multiple laboratory orders in various states
    When I request to view the patient's laboratory orders
    Then the system shall enable access to all laboratory orders
    And the orders shall show current status (pending, completed, cancelled)
    And I shall be able to view results for completed orders

  Scenario: Optionally include reason for laboratory order
    Given I am creating a new laboratory order for "Hemoglobin A1c"
    When I have the option to include a reason for the order
    Then the system may include a "reason for order" field
    And if provided, the reason shall be stored with the order

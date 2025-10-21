# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-3-cpoe-diagnostic-imaging.feature
# § 170.315(a)(3) - Computerized Provider Order Entry - Diagnostic Imaging

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(3)
#
# (3) Computerized provider order entry—diagnostic imaging.
#
# (i) Enable a user to record, change, and access diagnostic imaging orders.
#
# (ii) Optional.  Include a "reason for order" field.

@170.315-a-3 @cpoe @diagnostic-imaging @clinical
Feature: Computerized Provider Order Entry - Diagnostic Imaging
  As an ordering provider
  I want to electronically create and manage diagnostic imaging orders
  So that I can order appropriate imaging studies efficiently

  Background:
    Given I am authenticated as an ordering provider
    And I have appropriate privileges to order diagnostic imaging
    And a patient record is open

  Scenario: Create a new diagnostic imaging order
    Given the patient requires a chest X-ray
    When I create a diagnostic imaging order for "Chest X-ray PA and lateral"
    Then the system shall enable recording of the diagnostic imaging order
    And the order shall include imaging modality and anatomical location
    And the order shall be transmitted to the radiology system

  Scenario: Change an existing diagnostic imaging order
    Given the patient has a pending imaging order for "CT abdomen without contrast"
    When I change the imaging order to "CT abdomen and pelvis with contrast"
    Then the system shall enable changing of the diagnostic imaging order
    And the modified order shall be communicated to radiology
    And the modification shall be documented

  Scenario: Access existing diagnostic imaging orders
    Given the patient has multiple imaging orders and completed studies
    When I request to view the patient's diagnostic imaging orders
    Then the system shall enable access to all diagnostic imaging orders
    And the orders shall show current status
    And I shall be able to access imaging reports and images

  Scenario: Optionally include reason for diagnostic imaging order
    Given I am creating a new imaging order for "MRI lumbar spine"
    When I have the option to include a reason for the order
    Then the system may include a "reason for order" field
    And if provided, the reason shall support appropriate utilization

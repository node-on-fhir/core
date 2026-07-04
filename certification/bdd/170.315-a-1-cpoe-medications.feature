# certification/bdd/170.315-a-1-cpoe-medications.feature
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
  As a provider
  I want to create and manage medication orders

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And I am on /order-catalog

  Scenario: Record a new medication order
    Given the patient requires "Metformin 500 MG Oral Tablet"
    When I open the OrderCatalog and select the medications order type
    And select the medication from the catalog
    And provide an optional "reason for order" of "Type 2 diabetes mellitus"
    And submit the order
    Then the system shall create a FHIR MedicationRequest with status "active" and intent "order"
    And the MedicationRequest shall carry the RxNorm-coded medication, requester, and dosage instructions
    And the MedicationRequest shall be inserted into the MedicationRequests collection
    And an AuditEvent shall record the order creation

  Scenario: Change an existing medication order
    Given the patient has a pending MedicationRequest
    When I change the MedicationRequest status to "on-hold" and priority to "urgent"
    Then the modified values shall be persisted in the MedicationRequests collection
    And the change shall be retrievable via the medication orders API

  Scenario: Access existing medication orders
    Given the patient has one or more MedicationRequests
    When I navigate to /medication-requests
    Then the system shall update the MedicationRequests subscription by patientId
    And the MedicationRequestsTable shall display the patient's medication orders
    And I shall be able to open a MedicationRequest to view its details

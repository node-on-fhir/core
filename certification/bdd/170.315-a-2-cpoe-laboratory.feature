# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-2-cpoe-laboratory.feature
# § 170.315(a)(2) - Computerized Provider Order Entry - Laboratory

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(2)
#
# (2) Computerized provider order entry--laboratory.
#
# (i) Enable a user to record, change, and access laboratory orders.
#
# (ii) Optional.  Include a "reason for order" field.

@170.315-a-2 @cpoe @laboratory @clinical
Feature: Computerized Provider Order Entry - Laboratory
  As a provider
  I want to create and manage laboratory orders

  Background:
    Given I am authenticated as a provider
    And a patient record is selected
    And I am on /order-catalog/laboratory

  Scenario: Create a new laboratory order
    Given the patient requires a "Complete Blood Count"
    When I open the OrderCatalog on /order-catalog
    And select a PlanDefinition for "CBC with differential"
    Then the system shall reference the PlanDefinition.id of "CBC with differential"
    And look up the associated actions and ActivityDefinitions
    And create a new resource based on ActivityDefinition.kind (typically a ServiceRequest)
    And the ServiceRequest shall include all necessary details for specimen collection
    And the ServiceRequest shall be inserted into the ServiceRequests collection

  Scenario: Change an existing laboratory order
    Given the patient has a pending ServiceRequest for "Basic Metabolic Panel"
    When I change the ServiceRequest to "Comprehensive Metabolic Panel"
    And the modified ServiceRequest shall be saved in the ServiceRequests collection

  Scenario: Access existing laboratory orders
    Given the patient has multiple ServiceRequests in various states
    When I request to view the patient's ServiceRequests
    Then the system shall update the ServiceRequests subscription by patientId
    And the ServiceRequestsTable shall show current status (pending, completed, cancelled) for each request 
    And I shall be able to view results for completed orders

  
Background:
    Given I am authenticated as a lab tech
    
  Scenario: Access workqueue
    Given no patient record is selected
    And I am on /service-requests
    Then the system shall enable access to all ServiceRequests of type "laboratory"
    And the orders shall show current status
    And I shall be able to open the ServiceRequest records
    And update their status and other fields
    
  
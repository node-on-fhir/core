# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-a-3-cpoe-diagnostic-imaging.feature
# § 170.315(a)(3) - Computerized Provider Order Entry - Diagnostic Imaging

# REGULATORY TEXT FROM 45 CFR § 170.315(a)(3)
#
# (3) Computerized provider order entry--diagnostic imaging.
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
    Given I am authenticated as a physician
    And a patient record is selected
    And I am on /order-catalog/diagnostic-imaging
    
  Scenario: Create a new diagnostic imaging order
    Given the patient requires a chest X-ray
    When I search the PlanDefinitions collection for "Chest X-ray PA and lateral"
    Then the system shall open a new ServiceRequest
    And the ServiceRequest shall include imaging modality and anatomical location
    And the new record will be inserted into the ServiceRequests collection

  Scenario: Change an existing diagnostic imaging order
    Given the patient has a pending ServiceRequest for "Chest X-ray PA and lateral"
    When I open the ServiceRequest and change it to "CT abdomen and pelvis with contrast" and save
    Then the system shall update the record in the ServiceRequests collection
    And it will be viewable at /service-requests 

  Scenario: Optionally include reason for diagnostic imaging order
    Given I am creating a new ServiceRequest for "MRI lumbar spine"
    Then the system may include a "reason for order" field
    
  Scenario: Access existing diagnostic imaging 
    Given a patient record is selected
    And I am on /imaging-studies
    And the patient has multiple imaging orders and completed studies (CT abdomen pelvis; MRI lumbar)
    Then the system shall enable access to all ImagingStudies for the selected patient
    And the orders shall show current status
    And I shall be able to access imaging reports and images (DocumentReferences)
    
  Background:
    Given I am authenticated as a rad tech
    
  Scenario: Access workqueue
    Given no patient record is selected
    And I am on /service-requests
    Then the system shall enable access to all ServiceRequests of type "imaging"
    And the orders shall show current status
    And I shall be able to open the ServiceRequest records
    And update their status and other fields
    
  Scenario: Access existing diagnostic imaging 
    Given a patient record is selected
    And I am on /imaging-studies
    And the patient has multiple imaging orders and completed studies (CT abdomen pelvis; MRI lumbar)
    Then the system shall enable access to all ImagingStudies for the selected patient
    And the orders shall show current status
    And I shall be able to access imaging reports and images (DocumentReferences)

  
@ignore
Feature: Scenarios for IMMZ.D5.DT PlanDefinitions
  
  @defaults
  Scenario: Set the date to use for all tests
    Given def applyParams =
    """
    { 
      "resourceType": "Parameters", 
      "parameter": [ 
        {
          "name": "subject", valueString: ""
        },
        { "name": "parameters", "resource": {
          "resourceType": "Parameters",
            "parameter": [
              { "name": "Today", "valueDate": "2025-06-11" }
            ]
          }
        }
      ] 
    }
    """
    And def resultWithoutMedication =
    """
    {
      "resourceType": "CarePlan",
      "contained": [
        {
          "resourceType": "RequestGroup",
          "subject": {
            "reference": "#string"
          }
        },
        {
          "resourceType": "CommunicationRequest",
          "payload": {
            "contentString": "#string"
          }
        }
      ]
    }
    """
    And def resultWithMedication =
    """
    {
      "resourceType": "CarePlan",
      "contained": [
        {
          "resourceType": "RequestGroup",
          "subject": {
            "reference": "#string"
          }
        },
        {
          "resourceType": "CommunicationRequest",
          "payload": {
            "contentString": "#string"
          }
        },
        {
          "resourceType": "MedicationRequest",
          "doNotPerform": true,
          "medicationCodeableConcept": {
            "coding": {
              "code": "#string"
            }
          }
        }
      ]
    }
    """
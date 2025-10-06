@ignore
Feature: Scenarios for IMMZ.D18.S PlanDefinitions
  
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
    And def resultSchedule =
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
    And def resultNoSchedule =
    """
    {
      "resourceType": "CarePlan",
      "contained": [
        {
          "resourceType": "RequestGroup",
          "subject": {
            "reference": "#string"
          }
        }
      ]
    }
    """
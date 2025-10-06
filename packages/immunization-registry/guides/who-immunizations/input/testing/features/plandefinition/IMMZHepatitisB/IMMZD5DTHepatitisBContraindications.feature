
Feature: IMMZ.D5.DT.Hepatitis B contraindications Decision Table IMMZ.D5.DT.Hepatitis B contraindications

  Background: Set the date to use for all tests
    Given call read('../IMMZD5DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE6"


  @patient=HepatitisB62.1
  Scenario: The client has history of severe allergic reactions: Hepatitis B vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB62.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTHepatitisBContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB62.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB62.1'
    And resultWithoutMedication.contained[1].payload.contentString = "Do not vaccinate client with hepatitis B if the client had a history of serious allergic reactions to any of the vaccine components. Allergy to yeast is considered a contraindication to immunization with yeast-produced hepatitis B-containing vaccine."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB62.1-bundle.json" }
  

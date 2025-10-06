
Feature: IMMZ.D2.DT.Hepatitis B.Birth dose Decision Table Birth dose administration

  Background: Set the date to use for all tests
    Given call read('../IMMZD2DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE6"


  @patient=HepatitisB08.2
  Scenario: Hepatitis B birth dose was not administered and Client's age is less than {Member States defined upper limit}: Client is due for hepatitis B monovalent vaccine
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB08.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB08.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB08.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with hepatitis B birth dose, as a monovalent dose. Check for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB08.2-bundle.json" }
  

  @patient=HepatitisB09.2
  Scenario: Hepatitis B birth dose was not administered and Client's age is more than {Member States defined upper limit}: Client should follow delayed-start decision logic
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB09.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB09.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB09.2'
    And resultWithoutMedication.contained[1].payload.contentString = "The client has a delayed start. Please follow the delayed start schedule."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB09.2-bundle.json" }
  

  @patient=HepatitisB10.1
  Scenario: Hepatitis B birth dose was administered: Client is not due for the hepatitis B birth dose
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB10.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB10.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB10.1'
    And resultWithoutMedication.contained[1].payload.contentString = "Hepatitis B birth dose was already administered. Check hepatitis B immunization schedule."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB10.1-bundle.json" }
  

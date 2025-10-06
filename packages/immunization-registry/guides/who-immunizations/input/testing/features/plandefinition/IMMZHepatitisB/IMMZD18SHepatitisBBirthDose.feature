
Feature: IMMZ.D18.S.Hepatitis B.Birth dose schedule Decision Table Birth dose schedule

  Background: Set the date to use for all tests
    Given call read('../IMMZD18S.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"


    And def resultContent = {}
    And resultContent[7] = "All infants should receive a first dose of the hepatitis B-containing vaccine as soon as possible after birth, ideally within 24 hours"


  @patient=HepatitisB08.2
  Scenario: Hepatitis B birth dose was not administered and Client's age is less than {Member States defined upper limit}: Client is due for hepatitis B monovalent vaccine
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB08.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB08.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB08.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[7]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB08.2-bundle.json" }
    

  @patient=HepatitisB09.2
  Scenario: Hepatitis B birth dose was not administered and Client's age is more than {Member States defined upper limit}: Client should follow delayed-start decision logic
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB09.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB09.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB09.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[7]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB09.2-bundle.json" }
    

  @patient=HepatitisB10.1
  Scenario: Hepatitis B birth dose was administered: Client is not due for the hepatitis B birth dose
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB10.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBBirthDose/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB10.1'
    And request applyParams
    When method post
    Then status 200
    And resultNoSchedule.contained[0].subject.reference = 'Patient/HepatitisB10.1'
    
    And match response contains deep resultNoSchedule
    And match response.contained == '#[1]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB10.1-bundle.json" }
    

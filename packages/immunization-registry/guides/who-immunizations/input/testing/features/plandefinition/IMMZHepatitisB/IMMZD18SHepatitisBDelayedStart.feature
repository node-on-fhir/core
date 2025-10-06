
Feature: IMMZ.D18.S.Hepatitis B.Delayed start schedule Decision Table 3-dose schedule (no birth dose + 3 doses), delayed start

  Background: Set the date to use for all tests
    Given call read('../IMMZD18S.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"


    And def resultContent = {}
    And resultContent[49] = "If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose."

    And resultContent[50] = "If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose."

    And resultContent[51] = "If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose."


  @patient=HepatitisB50.2
  Scenario: No hepatitis B doses were administered and Client's age is more than {Member States defined lower limit}: Client is due for hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB50.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB50.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB50.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[49]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB50.2-bundle.json" }
    

  @patient=HepatitisB51.2
  Scenario: One hepatitis B dose was administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB51.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB51.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB51.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[50]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB51.2-bundle.json" }
    

  @patient=HepatitisB52.2
  Scenario: One hepatitis B dose was administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB52.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB52.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB52.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[50]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB52.2-bundle.json" }
    

  @patient=HepatitisB53.2
  Scenario: Two hepatitis B doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB53.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB53.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB53.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[51]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB53.2-bundle.json" }
    

  @patient=HepatitisB54.3
  Scenario: Two hepatitis B doses were administered, The latest hepatitis B dose was administered more than 4 weeks ago, and The first hepatitis B dose was administered less than 6 months ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB54.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB54.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB54.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[51]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB54.3-bundle.json" }
    

  @patient=HepatitisB55.3
  Scenario: Two hepatitis B doses were administered, The latest hepatitis B dose was administered more than 4 weeks ago, and The first hepatitis B dose was administered more than 6 months ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB55.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB55.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB55.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[51]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB55.3-bundle.json" }
    

  @patient=HepatitisB56.1
  Scenario: Three hepatitis B doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB56.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB56.1'
    And request applyParams
    When method post
    Then status 200
    And resultNoSchedule.contained[0].subject.reference = 'Patient/HepatitisB56.1'
    
    And match response contains deep resultNoSchedule
    And match response.contained == '#[1]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB56.1-bundle.json" }
    

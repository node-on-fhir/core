
Feature: IMMZ.D18.S.Hepatitis B.4-dose schedule Decision Table 4-dose schedule (birth dose + 3 primary series doses), on-time start

  Background: Set the date to use for all tests
    Given call read('../IMMZD18S.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"


    And def resultContent = {}
    And resultContent[35] = "The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks."

    And resultContent[36] = "The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks."

    And resultContent[37] = "The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks."


  @patient=HepatitisB36.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is less than {Member States defined lower limit}: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB36.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB36.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB36.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[35]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB36.2-bundle.json" }
    

  @patient=HepatitisB37.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is more than or equal to {Member States defined lower limit}: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB37.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB37.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB37.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[35]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB37.2-bundle.json" }
    

  @patient=HepatitisB38.2
  Scenario: One hepatitis B primary series doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB38.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB38.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB38.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[36]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB38.2-bundle.json" }
    

  @patient=HepatitisB39.2
  Scenario: One hepatitis B primary series doses were administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB39.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB39.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB39.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[36]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB39.2-bundle.json" }
    

  @patient=HepatitisB40.2
  Scenario: Two hepatitis B primary series doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB40.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB40.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB40.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[37]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB40.2-bundle.json" }
    

  @patient=HepatitisB41.2
  Scenario: Two hepatitis B primary series doses were administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB41.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB41.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB41.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[37]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB41.2-bundle.json" }
    

  @patient=HepatitisB42.1
  Scenario: Three hepatitis B primary series doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB42.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB42.1'
    And request applyParams
    When method post
    Then status 200
    And resultNoSchedule.contained[0].subject.reference = 'Patient/HepatitisB42.1'
    
    And match response contains deep resultNoSchedule
    And match response.contained == '#[1]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB42.1-bundle.json" }
    

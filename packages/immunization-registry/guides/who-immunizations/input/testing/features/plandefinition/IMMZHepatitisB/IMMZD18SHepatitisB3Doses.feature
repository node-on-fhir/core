
Feature: IMMZ.D18.S.Hepatitis B.3-dose schedule Decision Table 3-dose schedule (birth dose + 2 primary series doses), on-time start

  Background: Set the date to use for all tests
    Given call read('../IMMZD18S.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"


    And def resultContent = {}
    And resultContent[18] = "The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.\nThe interval between doses should be at least 4 weeks."

    And resultContent[19] = "The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.\nThe interval between doses should be at least 4 weeks."

    And resultContent[20] = "A birth dose of hepatitis B-containing vaccine can be given to low-birth-weight (< 2000 g) and premature infants. For these infants, the birth dose should not count as part of the primary 3-dose series; the 3 doses of the standard primary series should be given according to the national vaccination schedule."


  @patient=HepatitisB19.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is less than {Member States defined lower limit}: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB19.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB19.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB19.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[18]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB19.2-bundle.json" }
    

  @patient=HepatitisB20.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is more than or equal to {Member States defined lower limit}: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB20.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB20.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB20.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[18]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB20.2-bundle.json" }
    

  @patient=HepatitisB21.2
  Scenario: One hepatitis B primary series dose was administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB21.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB21.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB21.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[19]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB21.2-bundle.json" }
    

  @patient=HepatitisB22.2
  Scenario: One hepatitis B primary series dose was administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB22.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB22.2'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB22.2'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[19]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB22.2-bundle.json" }
    

  @patient=HepatitisB23.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was over 2000 g, and Client was not a premature infant at birth: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB23.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB23.3'
    And request applyParams
    When method post
    Then status 200
    And resultNoSchedule.contained[0].subject.reference = 'Patient/HepatitisB23.3'
    
    And match response contains deep resultNoSchedule
    And match response.contained == '#[1]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB23.3-bundle.json" }
    

  @patient=HepatitisB24.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was below 2000 g, and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB24.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB24.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB24.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[20]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB24.3-bundle.json" }
    

  @patient=HepatitisB25.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was below 2000 g, and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB25.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB25.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB25.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[20]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB25.3-bundle.json" }
    

  @patient=HepatitisB26.3
  Scenario: Two hepatitis B primary series doses were administered, Client was a premature infant at birth, and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB26.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB26.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB26.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[20]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB26.3-bundle.json" }
    

  @patient=HepatitisB27.3
  Scenario: Two hepatitis B primary series doses were administered, Client was a premature infant at birth, and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB27.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB27.3'
    And request applyParams
    When method post
    Then status 200
    And resultSchedule.contained[0].subject.reference = 'Patient/HepatitisB27.3'
    And resultSchedule.contained[1].payload.contentString.startsWith(resultContent[20]) 
    And match response contains deep resultSchedule
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB27.3-bundle.json" }
    

  @patient=HepatitisB28.1
  Scenario: Three hepatitis B primary series doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB28.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD18SHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB28.1'
    And request applyParams
    When method post
    Then status 200
    And resultNoSchedule.contained[0].subject.reference = 'Patient/HepatitisB28.1'
    
    And match response contains deep resultNoSchedule
    And match response.contained == '#[1]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB28.1-bundle.json" }
    


Feature: IMMZ.D2.DT.Hepatitis B.3 doses Decision Table 3-dose schedule (birth dose + 2 primary series doses), on-time start

  Background: Set the date to use for all tests
    Given call read('../IMMZD2DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE6"


  @patient=HepatitisB19.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is less than {Member States defined lower limit}: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB19.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB19.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB19.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first hepatitis B dose as client's age is not within appropriate age range. \nCheck for any other vaccines due and inform the caregiver of when to come back for the first dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB19.2-bundle.json" }
  

  @patient=HepatitisB20.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is more than or equal to {Member States defined lower limit}: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB20.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB20.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB20.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first hepatitis B dose as client's age is within appropriate age range. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB20.2-bundle.json" }
  

  @patient=HepatitisB21.2
  Scenario: One hepatitis B primary series dose was administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB21.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB21.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB21.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. \nCheck for any other vaccines due and inform the caregiver of when to come back for the third dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB21.2-bundle.json" }
  

  @patient=HepatitisB22.2
  Scenario: One hepatitis B primary series dose was administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB22.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB22.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB22.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB22.2-bundle.json" }
  

  @patient=HepatitisB23.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was over 2000 g, and Client was not a premature infant at birth: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB23.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB23.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB23.3'
    And resultWithoutMedication.contained[1].payload.contentString = "Hepatitis B immunization schedule is complete for client whose weight at birth was over 2000 g and who was not premature infant. Two hepatitis B primary series doses were administered."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB23.3-bundle.json" }
  

  @patient=HepatitisB24.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was below 2000 g, and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB24.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB24.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB24.3'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine was administered less than 4 weeks ago. \nCheck for any other vaccines due, and inform the caregiver of when to come back for the third dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB24.3-bundle.json" }
  

  @patient=HepatitisB25.3
  Scenario: Two hepatitis B primary series doses were administered, Client's weight at birth was below 2000 g, and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB25.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB25.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB25.3'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B-containing vaccine administered more than 4 weeks ago. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB25.3-bundle.json" }
  

  @patient=HepatitisB26.3
  Scenario: Two hepatitis B primary series doses were administered, Client was a premature infant at birth, and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB26.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB26.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB26.3'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered less than 4 weeks ago. \nCheck for any other vaccines due and inform the caregiver of when to come back for the next dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB26.3-bundle.json" }
  

  @patient=HepatitisB27.3
  Scenario: Two hepatitis B primary series doses were administered, Client was a premature infant at birth, and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB27.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB27.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB27.3'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with third hepatitis B dose as the client was a low-birth-weight infant and the latest hepatitis B dose was administered more than 4 weeks ago. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB27.3-bundle.json" }
  

  @patient=HepatitisB28.1
  Scenario: Three hepatitis B primary series doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB28.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB3Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB28.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB28.1'
    And resultWithoutMedication.contained[1].payload.contentString = "The hepatitis B immunization schedule is complete for client whose weight at birth was below 2000 g and who was a premature infant. Four hepatitis B primary series doses were administered. \nCheck for any other vaccines due."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB28.1-bundle.json" }
  

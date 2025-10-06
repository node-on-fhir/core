
Feature: IMMZ.D2.DT.Hepatitis B.4 doses Decision Table 4-dose schedule (birth dose + 3 primary series doses), on-time start

  Background: Set the date to use for all tests
    Given call read('../IMMZD2DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE6"


  @patient=HepatitisB36.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is less than {Member States defined lower limit}: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB36.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB36.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB36.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first hepatitis B dose as client's age is not within appropriate age range.\nCheck for any other vaccines due and inform the caregiver of when to come back for the first dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB36.2-bundle.json" }
  

  @patient=HepatitisB37.2
  Scenario: No hepatitis B primary series doses were administered and Client's age is more than or equal to {Member States defined lower limit}: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB37.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB37.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB37.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first hepatitis B dose as client's age is within appropriate age range.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB37.2-bundle.json" }
  

  @patient=HepatitisB38.2
  Scenario: One hepatitis B primary series doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB38.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB38.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB38.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago.\nCheck for any other vaccines due and inform the caregiver of when to come back for the second dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB38.2-bundle.json" }
  

  @patient=HepatitisB39.2
  Scenario: One hepatitis B primary series doses were administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB39.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB39.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB39.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered more than 4 weeks ago.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB39.2-bundle.json" }
  

  @patient=HepatitisB40.2
  Scenario: Two hepatitis B primary series doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB40.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB40.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB40.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered less than 4 weeks ago.\nCheck for any other vaccines due, and inform the caregiver of when to come back for the third dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB40.2-bundle.json" }
  

  @patient=HepatitisB41.2
  Scenario: Two hepatitis B primary series doses were administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB41.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB41.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB41.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with third hepatitis B dose as the latest Hepatitis B dose was administered more than 4 weeks ago.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB41.2-bundle.json" }
  

  @patient=HepatitisB42.1
  Scenario: Three hepatitis B primary series doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB42.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisB4Doses/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB42.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB42.1'
    And resultWithoutMedication.contained[1].payload.contentString = "The hepatitis B immunization schedule is complete. Three hepatitis B primary series doses were administered.\nCheck for any other vaccines due."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB42.1-bundle.json" }
  

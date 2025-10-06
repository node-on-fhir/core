
Feature: IMMZ.D2.DT.Hepatitis B.Delayed start Decision Table 3-dose schedule (no birth dose + 3 doses), delayed start

  Background: Set the date to use for all tests
    Given call read('../IMMZD2DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE6"


  @patient=HepatitisB50.2
  Scenario: No hepatitis B doses were administered and Client's age is more than {Member States defined lower limit}: Client is due for hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB50.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB50.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB50.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first hepatitis B dose as hepatitis B birth dose was not administered. The first hepatitis B dose should be administered as soon as possible. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB50.2-bundle.json" }
  

  @patient=HepatitisB51.2
  Scenario: One hepatitis B dose was administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB51.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB51.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB51.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. \nCheck for any other vaccines due, and inform the caregiver of when to come back for the next dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB51.2-bundle.json" }
  

  @patient=HepatitisB52.2
  Scenario: One hepatitis B dose was administered and The latest hepatitis B dose was administered more than 4 weeks ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB52.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB52.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB52.2'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB52.2-bundle.json" }
  

  @patient=HepatitisB53.2
  Scenario: Two hepatitis B doses were administered and The latest hepatitis B dose was administered less than 4 weeks ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB53.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB53.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB53.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with second hepatitis B dose as the latest hepatitis B dose was administered less than 4 weeks ago. Two hepatitis B doses have been administered to the client. \nCheck for any other vaccines due, and inform the caregiver of when to come back for the next dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB53.2-bundle.json" }
  

  @patient=HepatitisB54.3
  Scenario: Two hepatitis B doses were administered, The latest hepatitis B dose was administered more than 4 weeks ago, and The first hepatitis B dose was administered less than 6 months ago: Client is not due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB54.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB54.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB54.3'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with third hepatitis B dose as the first hepatitis B dose was administered less than 6 months ago. \nCheck for any other vaccines due, and inform the caregiver of when to come back for the next dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB54.3-bundle.json" }
  

  @patient=HepatitisB55.3
  Scenario: Two hepatitis B doses were administered, The latest hepatitis B dose was administered more than 4 weeks ago, and The first hepatitis B dose was administered more than 6 months ago: Client is due for a hepatitis B vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB55.3-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB55.3'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/HepatitisB55.3'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with third hepatitis B dose as the first hepatitis B dose was administered more than 6 months ago and the latest hepatitis B dose was administered more than 4 weeks ago. \nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB55.3-bundle.json" }
  

  @patient=HepatitisB56.1
  Scenario: Three hepatitis B doses were administered: Hepatitis B immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-HepatitisB56.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTHepatitisBDelayedStart/$apply'
    And applyParams.parameter[0].valueString = 'Patient/HepatitisB56.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/HepatitisB56.1'
    And resultWithoutMedication.contained[1].payload.contentString = "Hepatitis B immunization schedule is complete. Three hepatitis B primary series doses were administered. \nCheck for any other vaccines due."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-HepatitisB56.1-bundle.json" }
  

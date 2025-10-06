
Feature: IMMZ.D2.DT.BCG Decision Table IMMZ.D2.DT.BCG

  Background: Set the date to use for all tests
    Given call read('../IMMZD2DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE1"


  @patient=BCG07.4
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is negative or unknown, and No live vaccine was administered: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG07.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG07.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG07.4'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client is within age range, HIV status is not positive and no live vaccine was administered.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG07.4-bundle.json" }
  

  @patient=BCG08.4
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is negative or unknown, and Live vaccine was administered in the last four weeks: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG08.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG08.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG08.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG08.4-bundle.json" }
  

  @patient=BCG09.6
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, and No live vaccine was administered: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG09.6-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG09.6'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG09.6'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client is immunologically stable and no live vaccine was administered.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG09.6-bundle.json" }
  

  @patient=BCG10.6
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, and Live vaccine was administered in the last four weeks: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG10.6-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG10.6'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG10.6'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG10.6-bundle.json" }
  

  @patient=BCG11.5
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, and Client is not immunologically stable: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG11.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG11.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG11.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not immunologically stable.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG11.5-bundle.json" }
  

  @patient=BCG12.4
  Scenario: No BCG primary series dose was administered, Client's age is less than or equal to 28 days, Client's HIV status is positive, and Client is currently not receiving antiretroviral therapy: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG12.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG12.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG12.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as ART has not been started.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG12.4-bundle.json" }
  

  @patient=BCG13.5
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is negative or unknown, Client's TB infection test result is negative, and No live vaccine was administered in the last four weeks: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG13.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG13.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG13.5'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client's TB test result is negative and no live vaccine was administered in the past 4 weeks.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG13.5-bundle.json" }
  

  @patient=BCG14.5
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is negative or unknown, Client's TB infection test result is negative, and Live vaccine was administered in the last four weeks: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG14.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG14.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG14.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.\nCheck for any vaccines due and inform the caregiver of when to come back for the first dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG14.5-bundle.json" }
  

  @patient=BCG15.4
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is negative or unknown, and Client's TB infection test result is unknown (test not done or no result yet): Clinical judgement is required. Create clinical note.
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG15.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG15.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG15.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Recommend the client to perform TB infection testing.\nRe-evaluate client once the test result is available."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG15.4-bundle.json" }
  

  @patient=BCG16.4
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is negative or unknown, and Client's TB infection test result is positive: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG16.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG16.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG16.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client's TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out)."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG16.4-bundle.json" }
  

  @patient=BCG17.5
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, and Client is not immunologically stable: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG17.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG17.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG17.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not immunologically stable.\nCheck for any vaccines due, and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG17.5-bundle.json" }
  

  @patient=BCG18.5
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, and Client is not clinically well: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG18.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG18.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG18.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not clinically well.\nCheck for any vaccines due, and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG18.5-bundle.json" }
  

  @patient=BCG19.7
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, No live vaccine was administered in the last four weeks, and Client is clinically well: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG19.7-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG19.7'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG19.7'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the last 4 weeks.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG19.7-bundle.json" }
  

  @patient=BCG20.7
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, Live vaccine was administered in the last four weeks, and Client is clinically well: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG20.7-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG20.7'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG20.7'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG20.7-bundle.json" }
  

  @patient=BCG21.4
  Scenario: No BCG primary series dose was administered, Client's age is between 28 days and 5 years, Client's HIV status is positive, and Client is currently not receiving antiretroviral therapy: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG21.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG21.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG21.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not currently receiving ART.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG21.4-bundle.json" }
  

  @patient=BCG22.5
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is negative or unknown, Client's TB infection test result is negative, and No live vaccine was administered in the last four weeks: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG22.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG22.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG22.5'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client's TB test result is negative and no live vaccine was administered in the past 4 weeks.\nCheck for contraindications."
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG22.5-bundle.json" }
  

  @patient=BCG23.5
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is negative or unknown, Client's TB infection test result is negative, and Live vaccine was administered in the last four weeks: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG23.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG23.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG23.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the last 4 weeks.\nCheck for any vaccines due, and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG23.5-bundle.json" }
  

  @patient=BCG24.4
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is negative or unknown, and Client's TB infection test result is unknown (test not done or no result yet): Clinical judgement is required. Create clinical note.
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG24.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG24.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG24.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Recommend the client to perform TB infection testing.\nRe-evaluate client once the test result is available."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG24.4-bundle.json" }
  

  @patient=BCG25.4
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is negative or unknown, and Client's TB infection test result is positive: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG25.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG25.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG25.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client's TB infection test result is positive. Consider evaluating for TB disease or for TB preventive treatment (TPT) eligibility (once TB disease is ruled out)."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG25.4-bundle.json" }
  

  @patient=BCG26.5
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, and Client is not immunologically stable: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG26.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG26.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG26.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not immnologically stable.\nCheck for any vaccines due, and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG26.5-bundle.json" }
  

  @patient=BCG27.5
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, and Client is not clinically well: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG27.5-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG27.5'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG27.5'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not clinically well.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG27.5-bundle.json" }
  

  @patient=BCG28.7
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, No live vaccine was administered in the last four weeks, and Client is clinically well: Client is due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG28.7-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG28.7'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG28.7'
    And resultWithMedication.contained[1].payload.contentString = "Should vaccinate client with first BCG dose as no BCG dose was administered, client is receiving ART, clinically well and immunologically stable. No live vaccine was administered in the past 4 weeks.\nCheck for contraindications"
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG28.7-bundle.json" }
  

  @patient=BCG29.7
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is positive, Client is currently receiving antiretroviral therapy, Client is immunologically stable, Live vaccine was administered in the last four weeks, and Client is clinically well: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG29.7-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG29.7'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG29.7'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as live vaccine was administered in the past 4 weeks.\nCheck for any vaccines due, and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG29.7-bundle.json" }
  

  @patient=BCG30.4
  Scenario: No BCG primary series dose was administered, Client's age is more than 5 years, Client's HIV status is positive, and Client is currently not receiving antiretroviral therapy: Client is not due for BCG vaccination
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG30.4-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG30.4'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG30.4'
    And resultWithoutMedication.contained[1].payload.contentString = "Should not vaccinate client with first BCG dose as client is not currently receiving ART.\nCheck for any vaccines due and inform the caregiver of when to come back for the first BCG dose."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG30.4-bundle.json" }
  

  @patient=BCG31.1
  Scenario: One BCG primary series dose was administered: BCG immunization schedule is complete
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG31.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD2DTBCG/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG31.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG31.1'
    And resultWithoutMedication.contained[1].payload.contentString = "BCG immunization schedule is complete. One BCG primary series dose was administered.\nCheck for any vaccines due."
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG31.1-bundle.json" }
  


Feature: IMMZ.D5.DT.BCG contraindications Decision Table IMMZ.D5.DT.BCG contraindications

  Background: Set the date to use for all tests
    Given call read('../IMMZD5DT.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "2025-10-01"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = "DE1"


  @patient=BCG37.1
  Scenario: The client is pregnant: Bacille Calmette–Guérin (BCG) vaccination is contraindicated
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG37.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTBCGContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG37.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG37.1'
    And resultWithMedication.contained[1].payload.contentString = "Do not vaccinate client with BCG as BCG vaccination is not recommended during pregnancy"
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG37.1-bundle.json" }
  

  @patient=BCG38.1
  Scenario: The client has history of severe allergic reactions: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG38.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTBCGContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG38.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG38.1'
    And resultWithoutMedication.contained[1].payload.contentString = "Do not vaccinate client with BCG if the client had previous allergic reaction to any component of the vaccine"
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG38.1-bundle.json" }
  

  @patient=BCG39.1
  Scenario: The client has immunodeficiency syndromes: BCG vaccination is contraindicated
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG39.1-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTBCGContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG39.1'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG39.1'
    And resultWithMedication.contained[1].payload.contentString = "Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients with immunodeficiency syndromes"
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG39.1-bundle.json" }
  

  @patient=BCG40.2
  Scenario: The client is exposed to immunosuppressive treatment and Client's age is less than 1 year: BCG vaccination is contraindicated
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG40.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTBCGContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG40.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/BCG40.2'
    And resultWithMedication.contained[1].payload.contentString = "Do not vaccinate client with BCG as BCG vaccination is contraindicated for clients undergoing immunosuppressive treatment"
    And match response contains deep resultWithMedication
    And match response.contained == '#[3]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG40.2-bundle.json" }
  

  @patient=BCG41.2
  Scenario: The client is exposed to immunosuppressive treatment and Client's age is more than or equal to 1 year: BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-BCG41.2-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZD5DTBCGContraindications/$apply'
    And applyParams.parameter[0].valueString = 'Patient/BCG41.2'
    And request applyParams
    When method post
    Then status 200
    And resultWithoutMedication.contained[0].subject.reference = 'Patient/BCG41.2'
    And resultWithoutMedication.contained[1].payload.contentString = "Do not vaccinate client with BCG if client is exposed to or receives immunosuppressive treatment"
    And match response contains deep resultWithoutMedication
    And match response.contained == '#[2]'

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-BCG41.2-bundle.json" }
  

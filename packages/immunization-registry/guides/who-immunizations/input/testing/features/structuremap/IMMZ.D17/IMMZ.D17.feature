Feature: IMMZ.D17 StructureMap


  Scenario Outline: Load supporting resources <path>
    * def databundle = read('<file>')
    Given url matchboxBase
    And path '<path>'
    And request databundle
    When method put
    Then status 200

  Examples:
    | file   | path   |
    | StructureDefinition-IMMZD17.json | StructureDefinition/IMMZD17 |
    | ConceptMap-IMMZ.D.ConceptMap.json | ConceptMap/IMMZ.D.ConceptMap |

  Scenario Outline: Load StructureMap <map>
    * def mapHelpers = read('../../../../maps/<map>.fml')
    Given url matchboxBase
    And path 'StructureMap/<map>'
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'text/fhir-mapping'
    And request mapHelpers
    When method put
    Then status 200
    And match response.resourceType == 'StructureMap'

  Examples:
    | map |
    | IMMZ.Helpers |
    | IMMZ.D17.QRToLM |
    | IMMZ.D17.LMToBundle | 
    | IMMZ.D17.QRToBundle |

  Scenario: Test the transform for the D17 questionnaire to the Logical Model
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D17.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D17.QRToLM' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'IMMZD17'
    And match response.patient.reference == 'Patient/IMMZ.C.Patient.2'
    And match response.reactionManifestation.code == 'DE103'
    And match response.typeOfReaction.code == 'DE109'
    And match response.reactionOutcome.code == 'DE120'

  Scenario: Test the transform for the D17 questionnaire to a Bundle
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D17.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D17.QRToBundle' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'Bundle'
    And match response.type == 'transaction'
    And match response.entry[0].resource.resourceType == 'AdverseEvent'
    And match response.entry[0].resource.subject.reference == 'Patient/IMMZ.C.Patient.2'
    And match response.entry[0].resource.event.code == 'DE103'
    And match response.entry[0].resource.seriousness.code == 'DE109'
    And match response.entry[0].resource.outcome.code == 'ongoing'



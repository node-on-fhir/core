Feature: IMMZ.D5 StructureMap


  Scenario Outline: Load supporting resources <path>
    * def databundle = read('<file>')
    Given url matchboxBase
    And path '<path>'
    And request databundle
    When method put
    Then status 200

  Examples:
    | file   | path   |
    | StructureDefinition-IMMZD5.json | StructureDefinition/IMMZD5 |
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
    | IMMZ.D5.QRToLM |
    | IMMZ.D5.LMToBundle | 
    | IMMZ.D5.QRToBundle |

  Scenario: Test the transform for the D5 questionnaire to the Logical Model
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D5.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D5.QRToLM' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'IMMZD5'
    And match response.patient.reference == 'Patient/IMMZ.C.Patient.2'
    And match response.potentialContraindications[0].code == 'DE162'
    And match response.potentialContraindications[1].code == 'DE167'

  Scenario: Test the transform for the D5 questionnaire to a Bundle
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D5.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D5.QRToBundle' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'Bundle'
    And match response.type == 'transaction'
    And match response.entry[0].resource.resourceType == 'Observation'
    And match response.entry[0].resource.code.code == 'DE161'
    And match response.entry[0].resource.valueCoding.code == 'DE162'
    And match response.entry[1].resource.resourceType == 'Observation'
    And match response.entry[1].resource.code.code == 'DE161'
    And match response.entry[1].resource.valueCoding.code == 'DE167'


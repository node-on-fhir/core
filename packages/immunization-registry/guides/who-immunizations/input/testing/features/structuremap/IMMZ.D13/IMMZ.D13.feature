Feature: IMMZ.D13 StructureMap


  Scenario Outline: Load supporting resources <path>
    * def databundle = read('<file>')
    Given url matchboxBase
    And path '<path>'
    And request databundle
    When method put
    Then status 200

  Examples:
    | file   | path   |
    | StructureDefinition-IMMZD13.json | StructureDefinition/IMMZD13 |
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
    | IMMZ.D13.QRToLM |
    | IMMZ.D13.LMToBundle | 
    | IMMZ.D13.QRToBundle |

  Scenario Outline: Test the transform for the D13 questionnaire to the Logical Model for <qr>
    * def qr = read('<qr>')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D13.QRToLM' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'IMMZD13'
    And match response.patient.reference == 'Patient/IMMZ.C.Patient.1'
    And match response.vaccineType[0].code == '<vaccineCode>'
    And match response.doseNumber == <doseNumber>
    And match response.diseaseTargeted[0].code == '<diseaseTargeted>'
    And match response.immunizationEventStatus.code == '<eventStatus>'
    
  Examples:
    | qr | vaccineCode | doseNumber | diseaseTargeted | eventStatus |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.BCG.json | DE1 | 1 | DE139 | DE2 |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.json | DE9 | 1 | DE129 | DE2 |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.2.json | DE9 | 1 | DE129 | DE4 |

  Scenario Outline: Test the transform for the D13 questionnaire to a Bundle for <qr>
    * def qr = read('<qr>')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D13.QRToBundle' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'Bundle'
    And match response.type == 'transaction'
    And match response.entry[0].resource.resourceType == 'Immunization'
    And match response.entry[0].resource.vaccineCode.code == '<vaccineCode>'
    And match response.entry[0].resource.protocolApplied[0].doseNumberInteger == <doseNumber>
    And match response.entry[0].resource.protocolApplied[0].targetDisease[0].code == '<diseaseTargeted>'
    And match response.entry[0].resource.status == '<eventStatus>'


  Examples:
    | qr | vaccineCode | doseNumber | diseaseTargeted | eventStatus |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.BCG.json | DE1 | 1 | DE139 | completed |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.json | DE9 | 1 | DE129 | completed |
    | QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.2.json | DE9 | 1 | DE129 | not-done |
Feature: IMMZ.C4 StructureMap


  Scenario Outline: Load supporting resources <path>
    * def databundle = read('<file>')
    Given url matchboxBase
    And path '<path>'
    And request databundle
    When method put
    Then status 200

  Examples:
    | file   | path   |
    | StructureDefinition-IMMZC4.json | StructureDefinition/IMMZC4 |
    | ConceptMap-IMMZ.C.ConceptMap.json | ConceptMap/IMMZ.C.ConceptMap |

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
    | IMMZ.C4.QRToLM |
    | IMMZ.C4.LMToPatient | 
    | IMMZ.C4.QRToPatient |

  Scenario: Test the transform for the C4 questionnaire to the Logical Model
    * def qr = read('QuestionnaireResponse-Example.IMMZ.C.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.C4.QRToLM' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'IMMZC4'
    And match response.uniqueIdentifier == '12345-ZA'
    And match response.name == "Thabo Mbulelo Mbeki"
    And match response.firstName == "Thabo Mbulelo"
    And match response.familyName == "Mbeki"
    And match response.sex == "DE6"
    And match response.dateOfBirth == "2020-06-18"
    And match response.age == "4 years"
    And match response.contactPhoneNumber == "+27 21 465 8000"
    And match response.address == "123 Main Street, Cape Town, Western Cape, 8001, ZA"

  Scenario: Test the transform for the C4 questionnaire to the Patient Bundle
    * def qr = read('QuestionnaireResponse-Example.IMMZ.C.QuestionnaireResponse.1.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.C4.QRToPatient' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'Bundle'
    And match response.type == 'transaction'
    And match response.entry[0].resource.resourceType == 'Patient'
    And match response.entry[0].resource.id == '#uuid'
    And match response.entry[0].resource.gender == 'male'
    And match response.entry[0].resource.birthDate == '2020-06-18'
    And match response.entry[0].request.method == 'PUT'

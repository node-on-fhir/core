Feature: IMMZ.D1 StructureMap


  Scenario Outline: Load supporting resources <path>
    * def databundle = read('<file>')
    Given url matchboxBase
    And path '<path>'
    And request databundle
    When method put
    Then status 200

  Examples:
    | file   | path   |
    | StructureDefinition-IMMZD1.json | StructureDefinition/IMMZD1 |
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
    | IMMZ.D1.QRToLM |
    | IMMZ.D1.LMToBundle | 
    | IMMZ.D1.QRToBundle |

  Scenario Outline: Test the transform for the D1 questionnaire to the Logical Model for <qr>
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.<qr>.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D1.QRToLM' }
    And header Accept = 'application/fhir+json;fhirVersion=4.0'
    And header Content-Type = 'application/fhir+json;fhirVersion=4.0'
    And request qr
    When method post
    Then status 200
    And match response.resourceType == 'IMMZD1'
    And match response.patient.reference == 'Patient/IMMZ.C.Patient.1'
    And match response.vaccineType[0].code == '<vaccineCode>'
    And match response.doseNumber == <doseNumber>
    And match response.contactDate == '<contactDate>'
    
  Examples:
    | qr | vaccineCode | doseNumber | contactDate |
    | BCG | DE1 | 1 | 2020-07-01 |
    | Cholera | DE2 | 1 | 2021-07-01 |
    | COVID | DE26 | 1 | 2021-10-18 |
    | Dengue | DE25 | 1 | 2024-08-05 |
    | Diphtheria | DE3 | 1 | 2020-08-05 |
    | DTP| DE24 | 1 | 2020-08-05 |
    | Flu| DE18 | 1 | 2020-12-18 |
    | HepA | DE5 | 1 | 2021-07-01 |
    | HepB | DE6 | 1 | 2021-06-25 |
    | Hib | DE4 | 1 | 2020-08-05 |
    | HPV | DE7 | 1 | 2024-08-05 |
    | JE | DE8 | 1 | 2020-12-18 |
    | Malaria | DE27 | 1 | 2020-11-18 |
    | Measles | DE9 | 1 | 2021-04-01 |
    | Meningococcal | DE10 | 1 | 2021-04-01 |
    | Mumps | DE11 | 1 | 2021-06-18 |
    | Pertussis | DE12 | 1 | 2020-08-05 |
    | Pneumococcal | DE13 | 1 | 2020-08-05 |
    | Polio | DE14 | 1 | 2020-06-18 |
    | Rabies | DE15 | 1 | 2020-12-18 |
    | Rotavirus | DE16 | 1 | 2020-08-05 |
    | Rubella | DE17 | 1 | 2021-04-01 |
    | TBE | DE20 | 1 | 2021-06-18 |
    | Tetanus | DE19 | 1 | 2021-04-01 |
    | Typhoid | DE21 | 1 | 2021-04-01 |
    | Varicella | DE22 | 1 | 2021-06-18 |
    | YellowFever | DE23 | 1 | 2021-04-05 |

  Scenario Outline: Test the transform for the D1 questionnaire to a Bundle for <qr>
    * def qr = read('QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.<qr>.json')
    Given url matchboxBase
    And path 'StructureMap/$transform'
    And params { source: 'http://smart.who.int/immunizations/StructureMap/IMMZ.D1.QRToBundle' }
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
    And match response.entry[?(@.resource.code.code=='DE201')].resource.valueDateTime == ['<contactDate>']

  Examples:
    | qr | vaccineCode | doseNumber | contactDate |
    | BCG | DE1 | 1 | 2020-07-01 |
    | Cholera | DE2 | 1 | 2021-07-01 |
    | COVID | DE26 | 1 | 2021-10-18 |
    | Dengue | DE25 | 1 | 2024-08-05 |
    | Diphtheria | DE3 | 1 | 2020-08-05 |
    | DTP| DE24 | 1 | 2020-08-05 |
    | Flu| DE18 | 1 | 2020-12-18 |
    | HepA | DE5 | 1 | 2021-07-01 |
    | HepB | DE6 | 1 | 2021-06-25 |
    | Hib | DE4 | 1 | 2020-08-05 |
    | HPV | DE7 | 1 | 2024-08-05 |
    | JE | DE8 | 1 | 2020-12-18 |
    | Malaria | DE27 | 1 | 2020-11-18 |
    | Measles | DE9 | 1 | 2021-04-01 |
    | Meningococcal | DE10 | 1 | 2021-04-01 |
    | Mumps | DE11 | 1 | 2021-06-18 |
    | Pertussis | DE12 | 1 | 2020-08-05 |
    | Pneumococcal | DE13 | 1 | 2020-08-05 |
    | Polio | DE14 | 1 | 2020-06-18 |
    | Rabies | DE15 | 1 | 2020-12-18 |
    | Rotavirus | DE16 | 1 | 2020-08-05 |
    | Rubella | DE17 | 1 | 2021-04-01 |
    | TBE | DE20 | 1 | 2021-06-18 |
    | Tetanus | DE19 | 1 | 2021-04-01 |
    | Typhoid | DE21 | 1 | 2021-04-01 |
    | Varicella | DE22 | 1 | 2021-06-18 |
    | YellowFever | DE23 | 1 | 2021-04-05 |

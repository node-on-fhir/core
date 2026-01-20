Profile:      IMMZImmunization
Parent:       Immunization
Id:           IMMZ.Immunization
Title:        "SMART Guidelines Immunizations Immunization"
Description:  "Immunization Profile for the Immunizations SMART Guidelines.  From IMMZ.D Administer Vaccine"

* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareablestructuredefinition"
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishablestructuredefinition"
* ^version = "0.2.0"
* ^experimental = false
* ^publisher = "WHO"
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/cqf-knowledgeCapability"
* ^extension[=].valueCode = #shareable
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm"
* ^extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionPolicy"
* ^extension[=].valueCodeableConcept = http://terminology.hl7.org/CodeSystem/artifact-version-policy-codes#metadata
* ^date = "2025-01-16"

* statusReason from IMMZ.D.DE5 (required)
* vaccineCode from IMMZ.Z.VS (required)
* occurrence[x] only dateTime

* protocolApplied ^slicing.discriminator[+].type = #exists
* protocolApplied ^slicing.discriminator[=].path = "series"
* protocolApplied ^slicing.discriminator[+].type = #exists
* protocolApplied ^slicing.discriminator[=].path = "doseNumber"
* protocolApplied ^slicing.rules = #open
* protocolApplied contains immzProtocol 1..*

* protocolApplied[immzProtocol]
  * series 1..1
  * doseNumber[x] 1..1
  * doseNumber[x] only string
  * extension contains IMMZDueDateOfNextDose named dueDateOfNextDose 0..1

* extension contains IMMZTypeOfDose named typeOfPolio 0..1
    and IMMZTypeOfDose named typeOfJe 0..1
    and IMMZTypeOfDose named typeOfTbe 0..1
    and IMMZTypeOfDose named typeOfTyphoid 0..1
    and IMMZTypeOfDose named typeOfCholera 0..1
    and IMMZTypeOfDose named typeOfMeningococcal 0..1
    and IMMZTypeOfDose named typeOfHepatitisA 0..1
    and IMMZTypeOfDose named typeOfHepatitisB 0..1
    and IMMZVaccineBrand named vaccineBrand 1..1
    and IMMZLiveVaccine named liveVaccine 0..1
    and IMMZMarketAuthorization named marketAuthorizationHolder 1..1

* extension[typeOfPolio].value[x] from IMMZ.D.DE212 (required)
* extension[typeOfJe].value[x] from IMMZ.D.DE216 (required)
* extension[typeOfTbe].value[x] from IMMZ.D.DE220 (required)
* extension[typeOfTyphoid].value[x] from IMMZ.D.DE225 (required)
* extension[typeOfCholera].value[x] from IMMZ.D.DE229 (required)
* extension[typeOfMeningococcal].value[x] from IMMZ.D.DE229 (required)
* extension[typeOfHepatitisA].value[x] from IMMZ.D.DE237 (required)
* extension[typeOfHepatitisB].value[x] from IMMZ.D.DE254 (required)

* location
  * extension contains IMMZCountryOfVaccination named countryOfVaccination 1..1
      and IMMZAdministrativeArea named administrativeArea 0..1
Instance: IMMZD2DTCR
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-communicationactivity|2.0.0
Title: "IMMZ.D2.DT.CR"
Description: "Provide immunization communication"
Usage: #definition

* extension[+]
  * url = "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-knowledgeCapability"
  * valueCode = #computable
* version = "0.1.0"
* name = "IMMZD2DTCommunicationRequest"
* status = #draft
* experimental = false
* date = 2023-12-03
* publisher = "World Health Organization (WHO)"
* contact[+]
  * telecom[+]
    * system = #url
    * value = "https://who.int"
* kind = #CommunicationRequest
* intent = #proposal
* doNotPerform = false

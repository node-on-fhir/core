
Instance: IMMZD18SPolioBirth
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Polio.Birth dose schedule"
Description: """
IMMZ.D18.S.Polio.Birth dose schedule
Birth dose schedule (in countries that are poliomyelitis (polio)-endemic countries or countries at high risk for importation and subsequent spread of polio that follow the combined bivalent oral polio vaccine [bOPV]–inactivated polio vaccine [IPV] schedule)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SPolioBirth, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[bOPV birth dose (a zero dose)]], [["""
Provision of bOPV birth dose (a zero dose)
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: bOPV birth dose (a zero dose) should be provided within the first week of life and if the client is in a polio-endemic country or a country at high risk for importation and subsequent spread of polio
"""]], [[bOPV birth dose (a zero dose)]], [[bOPV birth dose (a zero dose) Create]])

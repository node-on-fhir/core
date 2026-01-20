
Instance: IMMZD18SYellowfever
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Yellow fever schedule"
Description: """
IMMZ.D18.S.Yellow fever schedule
IMMZ.D18.S.Yellow fever schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SYellowfever, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Yellow fever dose 1]], [["""
Provision of yellow fever dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The client is due for yellow fever dose 1 if the client's age is at least 9 months and living in a yellow fever endemic area.
"""]], [[Yellow fever dose 1]], [[Yellow fever dose 1 Create]])

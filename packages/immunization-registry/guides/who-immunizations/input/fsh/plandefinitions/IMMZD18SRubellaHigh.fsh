
Instance: IMMZD18SRubellaHigh
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Rubella.High incidence schedule"
Description: """
IMMZ.D18.S.Rubella.High incidence schedule
Schedule for countries with high incidence and mortality from rubella
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SRubellaHigh, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Rubella dose 1]], [["""
Provision of the rubella dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Rubella dose 1 should be provided if the client's age is at least 9 months
"""]], [[Rubella dose 1]], [[Rubella dose 1 Create]])

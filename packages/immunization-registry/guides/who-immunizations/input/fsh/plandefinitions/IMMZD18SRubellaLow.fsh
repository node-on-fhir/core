
Instance: IMMZD18SRubellaLow
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Rubella.Low incidence schedule"
Description: """
IMMZ.D18.S.Rubella.Low incidence schedule
Schedule for countries with low incidence of rubella		 							
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SRubellaLow, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Rubella dose 1]], [["""
Provision of the rubella dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Rubella dose 1 should be provided if the client's age is at least 12 months
"""]], [[Rubella dose 1]], [[Rubella dose 1 Create]])

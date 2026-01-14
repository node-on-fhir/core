
Instance: IMMZD18STyphoidTCV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Typhoid.TCV schedule"
Description: """
IMMZ.D18.S.Typhoid.TCV schedule
Typhoid conjugate vaccine (TCV), 1 dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STyphoidTCV, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[TCV dose 1]], [["""
Provision of the TCV dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: TCV dose 1 should be provided if the client's age is over 6 months, and the region recommends typhoid vaccination.
"""]], [[TCV dose 1]], [[TCV dose 1 Create]])

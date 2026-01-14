
Instance: IMMZD18STyphoidVIPS
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Typhoid.ViPS schedule"
Description: """
IMMZ.D18.S.Typhoid.ViPS schedule
Unconjugated Vi polysaccharide (ViPS), 1 dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STyphoidVIPS, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Typhoid dose 1]], [["""
Provision of the typhoid ViPS dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Typhoid dose 1 should be provided if the client's age is over 2 years, and the region recommends typhoid vaccination.
"""]], [[Typhoid dose 1]], [[Typhoid dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Typhoid booster dose(s)]], [["""
Provision of the typhoid ViPS booster dose
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines")
Create condition: Revaccination is recommended every 3 years for ViPS.
"""]], [[Typhoid booster dose(s)]], [[Typhoid booster dose(s) Create]])

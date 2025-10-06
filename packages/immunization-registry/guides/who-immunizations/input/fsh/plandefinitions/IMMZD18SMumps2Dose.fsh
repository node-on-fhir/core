
Instance: IMMZD18SMumps2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Mumps schedule"
Description: """
IMMZ.D18.S.Mumps schedule
2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMumps2Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Mumps dose 1]], [["""
Provision of the mumps dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The first dose of the mumps-containing vaccine (monovalent or MMR [measles, mumps and rubella]) should be given at 12–18 months of age.
"""]], [[Mumps dose 1]], [[Mumps dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Mumps dose 2]], [["""
Provision of the mumps dose 2
Trigger event: First mumps dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Mumps-containing vaccines")
Create condition: The age of administration of the second dose may range from the second year of life to age at school entry (about 6 years of age). The minimum interval between the first and the second doses is 1 month.
"""]], [[Mumps dose 2]], [[Mumps dose 2 Create]])


Instance: IMMZD18SMeaslesLowTx
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Measles.Low transmission schedule"
Description: """
IMMZ.D18.S.Measles.Low transmission schedule
Schedule for countries with low levels of measles transmission (countries that provide first dose of measles-containing vaccine (MCV) at 12 months and second dose of MCV at 15 months)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeaslesLowTx, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[MCV dose 1 (MCV1)]], [["""
Provision of MCV1 from the primary series
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The client is due for MCV1 if the client is at least 12 months
"""]], [[MCV dose 1 (MCV1)]], [[MCV dose 1 (MCV1) Create]])

* insert PlanDefCommunicationRequestAction([[MCV2]], [["""
Provision of MCV2 from the primary series
Trigger event: MCV1 was administered
Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date of birth"
Create condition: The client is due for MCV2 if the client is at least 15 months.
"""]], [[MCV2]], [[MCV2 Create]])


Instance: IMMZD18SMeaslesOngoingTx
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Measles.Ongoing transmission schedule"
Description: """
IMMZ.D18.S.Measles.Ongoing transmission schedule
Countries with ongoing transmission in which the risk of measles mortality remains high (countries that provide first dose of measles-containing vaccine (MCV) at 9 months and second dose of MCV at 15 months)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeaslesOngoingTx, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[MCV dose 1 (MCV1)]], [["""
Provision of MCV1 from the primary series
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: The client is due for MCV1 if the client is at least 9 months of age.
"""]], [[MCV dose 1 (MCV1)]], [[MCV dose 1 (MCV1) Create]])

* insert PlanDefCommunicationRequestAction([[MCV2]], [["""
Provision of the MCV2 from the primary series
Trigger event: MCV1 was administered
Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date of birth"
Create condition: The client is due for MCV2 if the client is at least 15 months of age.
"""]], [[MCV2]], [[MCV2 Create]])

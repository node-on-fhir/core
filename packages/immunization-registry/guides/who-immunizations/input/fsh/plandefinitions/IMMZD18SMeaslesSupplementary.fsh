
Instance: IMMZD18SMeaslesSupplementary
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Measles.Supplementary dose schedule"
Description: """
IMMZ.D18.S.Measles.Supplementary dose schedule
Measles supplementary dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeaslesSupplementary, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Measles-containing vaccine (MCV) supplementary dose]], [["""
Provision of a MCV supplementary dose
Trigger event: Routine measles immunization schedule is complete
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Measles-containing vaccines") AND Member States defined logic for supplementary dose applied
Trigger date: "Date when the primary vaccination series was  completed"
Create condition: Child is due for a MCV supplementary dose if child is HIV-positive, on antiretroviral therapy (ART) and immune reconstitution has been achieved.
"""]], [[Measles-containing vaccine (MCV) supplementary dose]], [[Measles-containing vaccine (MCV) supplementary dose Create]])

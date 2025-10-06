
Instance: IMMZD18SVaricella2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Varicella.2-dose schedule"
Description: """
IMMZ.D18.S.Varicella.2-dose schedule
2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SVaricella2Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Varicella dose 1]], [["""
Provision of the varicella dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.
"""]], [[Varicella dose 1]], [[Varicella dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Varicella dose 2]], [["""
Provision of the varicella dose 2
Trigger event: First varicella dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary series") =1
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Varicella-containing vaccines")
Create condition: The minimum interval between doses should be as recommended by the manufacturer, ranging from 4 weeks to 3 months.
"""]], [[Varicella dose 2]], [[Varicella dose 2 Create]])

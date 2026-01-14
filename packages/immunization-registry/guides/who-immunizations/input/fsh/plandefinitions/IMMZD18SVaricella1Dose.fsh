
Instance: IMMZD18SVaricella1Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Varicella.1-dose schedule"
Description: """
IMMZ.D18.S.Varicella.1-dose schedule
1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SVaricella1Dose, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Varicella dose 1]], [["""
Provision of the varicella dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.
"""]], [[Varicella dose 1]], [[Varicella dose 1 Create]])

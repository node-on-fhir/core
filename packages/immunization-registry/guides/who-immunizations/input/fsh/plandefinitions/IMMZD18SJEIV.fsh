
Instance: IMMZD18SJEIV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule"
Description: """
IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule
Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SJEIV, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Japanese encephalitis (JE) dose 1]], [["""
Provision of the JE dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: JE dose 1 should be provided if the client's age is 6 months or older and the country is administering the Inactivated Vero cell-derived antigen.
"""]], [[Japanese encephalitis (JE) dose 1]], [[Japanese encephalitis (JE) dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[JE dose 2]], [["""
Provision of the JE dose 2
Trigger event: One JE primary series dose was administered
Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: "Date and time of vaccination" where "Vaccine type" = "JE vaccines"
Create condition: JE inactivated Vero cell-derived vaccine dose 2 should be provided if dose 1 was administered at least 4 weeks ago.
"""]], [[JE dose 2]], [[JE dose 2 Create]])

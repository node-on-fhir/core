Instance: IMMZD18SHepatitisBDelayedStart
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis B.Delayed start schedule"
Description: """
IMMZ.D18.S.Hepatitis B.Delayed start schedule
3-dose schedule (no birth dose + 3 doses), delayed start
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisBDelayedStart, 0.1.0 )


* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 1]], [["""
Provision of hepatitis B dose 1
Trigger event: Child's birth
Trigger pseudo: 
Trigger date: "Date of birth"
Create condition: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
"""]], [[Hepatitis B dose 1]], [[Hepatitis B dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 2]], [["""
Provision of hepatitis B dose 2
Trigger event: First hepatitis B dose was administered
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
Create condition: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
"""]], [[Hepatitis B dose 2]], [[Hepatitis B dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 3]], [["""
Provision of hepatitis B dose 3
Trigger event: Second hepatitis B dose was administered
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2
Trigger date: "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Dose number" = 1)
Create condition: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
"""]], [[Hepatitis B dose 3]], [[Hepatitis B dose 3 Create]])

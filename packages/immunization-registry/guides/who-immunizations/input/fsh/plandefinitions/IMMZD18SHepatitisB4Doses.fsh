Instance: IMMZD18SHepatitisB4Doses
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis B.4-dose schedule"
Description: """
IMMZ.D18.S.Hepatitis B.4-dose schedule
4-dose schedule (birth dose + 3 primary series doses), on-time start
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisB4Doses, 0.1.0 )


* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 1]], [["""
Provision of hepatitis B dose 1
Trigger event: Child's birth
Trigger pseudo: 
Trigger date: "Date of birth"
Create condition: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
"""]], [[Hepatitis B dose 1]], [[Hepatitis B dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 2]], [["""
Provision of hepatitis B dose 2
Trigger event: First hepatitis B dose from the primary series was administered
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
Create condition: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
"""]], [[Hepatitis B dose 2]], [[Hepatitis B dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 3]], [["""
Provision of hepatitis B dose 3
Trigger event: Second hepatitis B dose from the primary series was administered
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
Create condition: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
"""]], [[Hepatitis B dose 3]], [[Hepatitis B dose 3 Create]])

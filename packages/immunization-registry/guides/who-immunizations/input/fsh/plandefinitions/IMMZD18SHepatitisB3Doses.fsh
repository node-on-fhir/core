Instance: IMMZD18SHepatitisB3Doses
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis B.3-dose schedule"
Description: """
IMMZ.D18.S.Hepatitis B.3-dose schedule
3-dose schedule (birth dose + 2 primary series doses), on-time start
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisB3Doses, 0.1.0 )


* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 1]], [["""
Provision of hepatitis B dose 1
Trigger event: Child's birth
Trigger pseudo: 
Trigger date: "Date of birth"
Create condition: The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.
"""]], [[Hepatitis B dose 1]], [[Hepatitis B dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 2]], [["""
Provision of hepatitis B dose 2
Trigger event: First hepatitis B dose from the primary series was administered
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
Create condition: The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.
"""]], [[Hepatitis B dose 2]], [[Hepatitis B dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Hepatitis B dose 3]], [["""
Provision of hepatitis B dose 3 for low-birth-weight and premature infants
Trigger event: Second hepatitis B dose from the primary series was administered. Client's weight at birth was less than 2000 g or client was a premature infant
Trigger pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2 and ("Birth weight in grams" < 2000) or ("Preterm birth" = TRUE)
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
Create condition: A birth dose of hepatitis B-containing vaccine can be given to low-birth-weight (< 2000 g) and premature infants. For these infants, the birth dose should not count as part of the primary 3-dose series; the 3 doses of the standard primary series should be given according to the national vaccination schedule.
"""]], [[Hepatitis B dose 3]], [[Hepatitis B dose 3 Create]])

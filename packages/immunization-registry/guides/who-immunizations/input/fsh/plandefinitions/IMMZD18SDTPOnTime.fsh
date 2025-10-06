
Instance: IMMZD18SDTPOnTime
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.DTP.On-time start schedule"
Description: """
IMMZ.D18.S.DTP.On-time start schedule
Diphtheria–tetanus–pertussis (DTP) vaccination schedule, on-time start (at ≤ 12 months of age)
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SDTPOnTime, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[DTP dose 1]], [["""
Provision of DTP dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: DTP dose 1 should be provided if the client is older than 6 weeks of age.
"""]], [[DTP dose 1]], [[DTP dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[DTP dose 2]], [["""
Provision of DTP dose 2
Trigger event: First DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
Create condition: DTP dose 2 should be provided if the client was given the previous DTP dose more than 4 weeks ago.
"""]], [[DTP dose 2]], [[DTP dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[DTP dose 3]], [["""
Provision of DTP dose 3
Trigger event: Second DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series" ) = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
Create condition: DTP dose 3 should be provided if the client received the previous dose more than 4 weeks ago.
"""]], [[DTP dose 3]], [[DTP dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 1]], [["""
Provision of tetanus and diphtheria booster dose 1
Trigger event: The primary DTP series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
Create condition: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 1]], [[Tetanus and diphtheria-containing vaccine booster dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 2]], [["""
Provision of tetanus and diphtheria booster dose 2
Trigger event: First tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
Create condition: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 2]], [[Tetanus and diphtheria-containing vaccine booster dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 3]], [["""
Provision of tetanus and diphtheria booster dose 3
Trigger event: Second tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
Create condition: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 3]], [[Tetanus and diphtheria-containing vaccine booster dose 3 Create]])

* insert PlanDefCommunicationRequestAction([[Pertussis-containing vaccine booster dose]], [["""
Provision of the pertussis-containing vaccine booster dose
Trigger event: The primary DTP series has been completed and client's age is between 1 and 6 years
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND 1 year ≤  Today's date − "Date of birth" ≤  6 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
Create condition: A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥6 months after last primary dose).
"""]], [[Pertussis-containing vaccine booster dose]], [[Pertussis-containing vaccine booster dose Create]])

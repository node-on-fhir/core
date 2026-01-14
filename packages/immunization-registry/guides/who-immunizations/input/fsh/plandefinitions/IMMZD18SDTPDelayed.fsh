
Instance: IMMZD18SDTPDelayed
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.DTP.Delayed or interrupted schedule"
Description: """
IMMZ.D18.S.DTP.Delayed or interrupted schedule
Diphtheria–tetanus–pertussis (DTP) vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SDTPDelayed, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[DTP dose 1 (delayed start)]], [["""
Provision of DTP dose 1 with a delayed start
Trigger event: No DTP doses were administered and client's age is more than 1 year 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines") = 0 AND Today's date − "Date of birth" > 1 year
Trigger date: Date of birth
Create condition: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
"""]], [[DTP dose 1 (delayed start)]], [[DTP dose 1 (delayed start) Create]])

* insert PlanDefCommunicationRequestAction([[DTP dose 2 (delayed start)]], [["""
Provision of DTP dose 2 with a delayed start
Trigger event: First DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
Create condition: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
"""]], [[DTP dose 2 (delayed start)]], [[DTP dose 2 (delayed start) Create]])

* insert PlanDefCommunicationRequestAction([[DTP dose 3 (delayed start)]], [["""
Provision of DTP dose 3 with a delayed start
Trigger event: Second DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 2
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
Create condition: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
"""]], [[DTP dose 3 (delayed start)]], [[DTP dose 3 (delayed start) Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)]], [["""
Provision of tetanus and diphtheria booster dose 1
Trigger event: The primary DTP series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
Create condition: Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)]], [[Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Create]])

* insert PlanDefCommunicationRequestAction([[Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)]], [["""
Provision of tetanus and diphtheria booster dose 2
Trigger event: First tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
Create condition: Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.
"""]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)]], [[Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Create]])

* insert PlanDefCommunicationRequestAction([[Pertussis-containing vaccine booster dose 1 (delayed start)]], [["""
Provision of the pertussis-containing booster dose 1
Trigger event: The primary DTP series has been completed and client's age is between 1 year and 6 years
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND 1 year ≤  Today's date − "Date of birth" ≤  6 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
Create condition: A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥ 6 months after last primary dose).
"""]], [[Pertussis-containing vaccine booster dose 1 (delayed start)]], [[Pertussis-containing vaccine booster dose 1 (delayed start) Create]])


Instance: IMMZD18SCholeraWC
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Cholera.WC vaccines schedule"
Description: """
IMMZ.D18.S.Cholera.WC vaccines schedule
Whole-cell (WC) vaccines (Shanchol, Euvchol and mORCVAX), 2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SCholeraWC, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Cholera dose 1]], [["""
Provision of the cholera dose 1
Trigger event: Child's birth and no cholera doses have been administered
Child's birth AND Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 0
Trigger date: "Date of birth"
OR
Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC vaccines, revaccination is recommended after 3 years.
"""]], [[Cholera dose 1]], [[Cholera dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Cholera dose 2]], [["""
Provision of the cholera dose 2
Trigger event: First cholera dose administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines"and "Type of dose" = "Primary series") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
"""]], [[Cholera dose 2]], [[Cholera dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Cholera booster dose 1]], [["""
Provision of the cholera booster dose 1
Trigger event: Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 3 years
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: For WC vaccines, revaccination is recommended after 3 years.
"""]], [[Cholera booster dose 1]], [[Cholera booster dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Cholera booster dose 2]], [["""
Provision of the cholera booster dose 1
Trigger event: First cholera booster dose administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines"and "Type of dose" = "Booster dose") = 1
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: For WC vaccines, revaccination is recommended after 3 years.
"""]], [[Cholera booster dose 2]], [[Cholera booster dose 2 Create]])

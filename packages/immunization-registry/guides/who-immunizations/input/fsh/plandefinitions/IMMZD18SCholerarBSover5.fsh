
Instance: IMMZD18SCholerarBSover5
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule"
Description: """
IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule
Whole cell-recombinant B subunit (WC-rBS) vaccine (Dukoral), 2-dose schedule for clients aged ≥ 6 years
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SCholerarBSover5, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Cholera dose 1]], [["""
Provision of the cholera dose 1
Trigger event: Child's birth 
Count of vaccines administered (where "Vaccine type" = "Cholera vaccines") = 0 AND (Today's date − "Date of birth" ≥ 6 years)
OR Primary series interrupted for 6 or more weeks
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = FALSE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 6 weeks AND (Today's date − "Date of birth" ≥ 6 years)
OR more than 6 months have passed since completion of primary vaccination series
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") > 2 years AND (Today's date − "Date of birth" ≥ 6 years)
Trigger date: "Date of birth"
OR
Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: For WC-rBS vaccine (Dukoral), 2 doses should be given to children aged ≥ 6 years and adults, with an interval of 1–6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

Revaccination for those aged ≥ 6 years: If more than 2 years have passed since completion of primary vaccination series, the primary series of 2 doses should be repeated.
"""]], [[Cholera dose 1]], [[Cholera dose 1 Create]])

* insert PlanDefCommunicationRequestAction([[Cholera dose 2]], [["""
Provision of the cholera dose 2
Trigger event: First cholera dose was administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 1 AND (Today's date − "Date of birth" ≥ 6 years)
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: For WC-rBS vaccine (Dukoral)  2 doses should be given to children aged ≥6 years and adults, with an interval of 1-6 weeks between doses.
"""]], [[Cholera dose 2]], [[Cholera dose 2 Create]])

* insert PlanDefCommunicationRequestAction([[Cholera booster dose]], [["""
Provision of the cholera booster dose
Trigger event: Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ 2 years ± Member States defined interval AND (Today's date − "Date of birth" ≥ 6 years)
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
Create condition: For WC-rBS vaccine, for those aged ≥ 6 years of age, if less than 2 years have passed since completion of primary vaccination series, 1 dose for revaccination.
"""]], [[Cholera booster dose]], [[Cholera booster dose Create]])

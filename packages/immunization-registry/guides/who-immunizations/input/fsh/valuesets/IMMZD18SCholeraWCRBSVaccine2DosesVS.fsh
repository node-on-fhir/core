ValueSet: IMMZD18SCholeraWCRBSVaccine2DosesVS
Title: "IMMZD18SCholeraWCRBSVaccine2Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SCholeraWCRBSVaccine2Doses for IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule.
Business rule: Determine if the client is due for a cholera vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Whole cell-recombinant B subunit (WC-rBS) vaccine (Dukoral), 2-dose schedule for clients aged ≥ 6 years
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-761"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose was administered-68"]], [[First cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose was administered-115"]], [[First cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second cholera dose was administered-68"]], [[Second cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago-284"]], [[Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Booster dose was administered approximately less than 2 years ago-175"]], [[Booster dose was administered approximately less than 2 years ago]] )
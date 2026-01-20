ValueSet: IMMZD18SCholeraWCRBSVaccine3DosesVS
Title: "IMMZD18SCholeraWCRBSVaccine3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SCholeraWCRBSVaccine3Doses for IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule.
Business rule: Determine if the client is due for a cholera vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Whole cell-recombinant B subunit (WC-rBS) vaccine (Dukoral), 3-dose schedule for clients aged 2–5 years
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-792"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose was administered-68"]], [[First cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First cholera dose was administered-125"]], [[First cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second cholera dose was administered-68"]], [[Second cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second cholera dose was administered-125"]], [[Second cholera dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three doses from primary series were administered. The primary series has been completed-93"]], [[Three doses from primary series were administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series for cholera has been completed and latest cholera dose was administered approximately less than 6 months ago-295"]], [[Primary series for cholera has been completed and latest cholera dose was administered approximately less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Booster dose was administered approximately less than 6 months ago-176"]], [[Booster dose was administered approximately less than 6 months ago]] )
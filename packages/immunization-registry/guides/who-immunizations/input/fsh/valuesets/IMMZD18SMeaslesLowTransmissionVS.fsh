ValueSet: IMMZD18SMeaslesLowTransmissionVS
Title: "IMMZD18SMeaslesLowTransmission ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeaslesLowTransmission for IMMZ.D18.S.Measles.Low transmission schedule.
Business rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Schedule for countries with low levels of measles transmission (countries that provide first dose of measles-containing vaccine (MCV) at 12 months and second dose of MCV at 15 months)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV1 was administered-127"]], [[MCV1 was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV2 was administered. The primary series has been completed-104"]], [[MCV2 was administered. The primary series has been completed]] )
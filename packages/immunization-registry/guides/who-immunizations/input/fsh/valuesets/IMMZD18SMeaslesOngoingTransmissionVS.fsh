ValueSet: IMMZD18SMeaslesOngoingTransmissionVS
Title: "IMMZD18SMeaslesOngoingTransmission ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeaslesOngoingTransmission for IMMZ.D18.S.Measles.Ongoing transmission schedule.
Business rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Countries with ongoing transmission in which the risk of measles mortality remains high (countries that provide first dose of measles-containing vaccine (MCV) at 9 months and second dose of MCV at 15 months)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV1 was administered-127"]], [[MCV1 was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV2 was administered. The primary series has been completed.-104"]], [[MCV2 was administered. The primary series has been completed.]] )
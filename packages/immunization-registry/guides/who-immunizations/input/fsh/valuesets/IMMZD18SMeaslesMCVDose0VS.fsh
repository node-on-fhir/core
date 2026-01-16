ValueSet: IMMZD18SMeaslesMCVDose0VS
Title: "IMMZD18SMeaslesMCVDose0 ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeaslesMCVDose0 for IMMZ.D18.S.Measles.MCV dose 0 schedule.
Business rule: Determine if the client is due for a measles vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Measles-containing vaccine dose 0 (MCV0) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV0 was administered-119"]], [[MCV0 was administered]] )
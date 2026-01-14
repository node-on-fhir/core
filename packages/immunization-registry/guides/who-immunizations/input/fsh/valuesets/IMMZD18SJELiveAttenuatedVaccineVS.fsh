ValueSet: IMMZD18SJELiveAttenuatedVaccineVS
Title: "IMMZD18SJELiveAttenuatedVaccine ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SJELiveAttenuatedVaccine for IMMZ.D18.S.JE.Live attenuated vaccination schedule.
Business rule: Determine if the client is due for a Japanese encephalitis (JE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live attenuated vaccination schedule (1-dose scheme)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One JE dose from primary series was administered. The primary series has been completed-88"]], [[One JE dose from primary series was administered. The primary series has been completed]] )
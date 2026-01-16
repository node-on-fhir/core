ValueSet: IMMZD18SRubellaHighIncidenceVS
Title: "IMMZD18SRubellaHighIncidence ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SRubellaHighIncidence for IMMZ.D18.S.Rubella.High incidence schedule.
Business rule: Determine if the client is due for a rubella vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Schedule for countries with high incidence and mortality from rubella
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One rubella dose from the primary series was administered. The primary series has been completed-104"]], [[One rubella dose from the primary series was administered. The primary series has been completed]] )
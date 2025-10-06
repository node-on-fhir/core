ValueSet: IMMZD18SPolioBirthDoseVS
Title: "IMMZD18SPolioBirthDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPolioBirthDose for IMMZ.D18.S.Polio.Birth dose schedule.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Birth dose schedule (in countries that are poliomyelitis (polio)-endemic countries or countries at high risk for importation and subsequent spread of polio that follow the combined bivalent oral polio vaccine [bOPV]–inactivated polio vaccine [IPV] schedule)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Polio birth dose (a zero dose) was administered-146"]], [[Polio birth dose (a zero dose) was administered]] )
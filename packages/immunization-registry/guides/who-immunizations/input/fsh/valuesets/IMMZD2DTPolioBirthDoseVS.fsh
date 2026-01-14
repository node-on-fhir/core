ValueSet: IMMZD2DTPolioBirthDoseVS
Title: "IMMZD2DTPolioBirthDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTPolioBirthDose for IMMZ.D2.DT.Polio.Birth dose.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Birth dose administration as part of "bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (in countries that are poliomyelitis (polio)-endemic countries or at high risk of importation and subsequent spread of polio that follow the combined bOPV–IPV schedule)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"bOPV birth dose (a zero dose) was not administered-146"]], [[bOPV birth dose (a zero dose) was not administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 1 week-39"]], [[Client's age is less than 1 week]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for the bOPV birth dose-87"]], [[Client is due for the bOPV birth dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 1 week-39"]], [[Client's age is more than or equal to 1 week]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for the bOPV birth dose-48"]], [[Client is not due for the bOPV birth dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"bOPV birth dose (a zero dose) was administered-146"]], [[bOPV birth dose (a zero dose) was administered]] )
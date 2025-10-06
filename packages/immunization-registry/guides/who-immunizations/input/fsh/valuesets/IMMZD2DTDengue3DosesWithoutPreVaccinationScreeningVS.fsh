ValueSet: IMMZD2DTDengue3DosesWithoutPreVaccinationScreeningVS
Title: "IMMZD2DTDengue3DosesWithoutPreVaccinationScreening ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTDengue3DosesWithoutPreVaccinationScreening for IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening.
Business rule: Determine if the client is due for a dengue vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 9 years-40"]], [[Client's age is less than 9 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for dengue vaccination-48"]], [[Client is not due for dengue vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 45 years-41"]], [[Client's age is more than 45 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No dengue primary series doses were administered-115"]], [[No dengue primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 9 years and 45 years-51"]], [[Client's age is between 9 years and 45 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for dengue vaccination-44"]], [[Client is due for dengue vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One dengue primary series dose was administered-115"]], [[One dengue primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest dengue dose was administered less than 6 months ago-106"]], [[The latest dengue dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest dengue dose was administered more than 6 months ago-106"]], [[The latest dengue dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two dengue primary series doses were administered-115"]], [[Two dengue primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three dengue primary series doses were administered-115"]], [[Three dengue primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Dengue immunization schedule is complete-143"]], [[Dengue immunization schedule is complete]] )
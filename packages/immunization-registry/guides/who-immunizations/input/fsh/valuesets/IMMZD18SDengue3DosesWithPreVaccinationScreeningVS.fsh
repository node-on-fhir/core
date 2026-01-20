ValueSet: IMMZD18SDengue3DosesWithPreVaccinationScreeningVS
Title: "IMMZD18SDengue3DosesWithPreVaccinationScreening ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SDengue3DosesWithPreVaccinationScreening for IMMZ.D18.S.Dengue schedule.
Business rule: Determine if the client is due for a dengue vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: CYD-TDV (Dengvaxia), 3-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No dengue doses from primary series were administered-115"]], [[No dengue doses from primary series were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First dengue dose from the primary series was administered-115"]], [[First dengue dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second dengue dose from the primary series was administered-115"]], [[Second dengue dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third dengue dose from the primary series was administered. The primary series has been completed-93"]], [[Third dengue dose from the primary series was administered. The primary series has been completed]] )
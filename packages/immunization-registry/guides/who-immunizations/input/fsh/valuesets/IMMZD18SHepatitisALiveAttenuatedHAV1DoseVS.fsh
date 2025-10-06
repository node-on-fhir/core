ValueSet: IMMZD18SHepatitisALiveAttenuatedHAV1DoseVS
Title: "IMMZD18SHepatitisALiveAttenuatedHAV1Dose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SHepatitisALiveAttenuatedHAV1Dose for IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule.
Business rule: Determine if the client is due for a hepatitis A vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Live attenuated hepatitis A virus (HAV), 1 dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First hepatitis A dose from the primary series was administered. The primary series has been completed-108"]], [[First hepatitis A dose from the primary series was administered. The primary series has been completed]] )
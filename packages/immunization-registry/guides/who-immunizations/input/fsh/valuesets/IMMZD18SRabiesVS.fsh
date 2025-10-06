ValueSet: IMMZD18SRabiesVS
Title: "IMMZD18SRabies ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SRabies for IMMZ.D18.S.Rabies schedule.
Business rule: Determine if the client is due for a rabies vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Rabies schedule (2-dose scheme)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"To be determined by Member States-0"]], [[To be determined by Member States]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First rabies dose from the primary series was administered-115"]], [[First rabies dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second rabies dose from the primary series was administered. The primary series has been completed-92"]], [[Second rabies dose from the primary series was administered. The primary series has been completed]] )
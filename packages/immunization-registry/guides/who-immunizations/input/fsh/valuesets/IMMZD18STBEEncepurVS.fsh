ValueSet: IMMZD18STBEEncepurVS
Title: "IMMZD18STBEEncepur ValueSet for Decision Table"
Description: """
ValueSet IMMZD18STBEEncepur for IMMZ.D18.S.TBE.Encepur schedule.
Business rule: Determine if the client is due for a tick-borne encephalitis (TBE) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Encepur, 3-dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First TBE dose from the primary series was administered-112"]], [[First TBE dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second TBE dose from the primary series was administered-112"]], [[Second TBE dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third TBE dose from the primary series was administered. The primary series has been completed-89"]], [[Third TBE dose from the primary series was administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The primary series has been completed-89"]], [[The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"TBE booster dose was administered-110"]], [[TBE booster dose was administered]] )
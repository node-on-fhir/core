ValueSet: IMMZD18SPolioIPVOnlyVS
Title: "IMMZD18SPolioIPVOnly ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPolioIPVOnly for IMMZ.D18.S.Polio.IPV-only schedule.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Inactivated polio vaccine (IPV)-only schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First IPV dose from the primary series was administered-92"]], [[First IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second IPV dose from the primary series was administered-92"]], [[Second IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third IPV dose from the primary series was administered. The primary series has been completed-107"]], [[Third IPV dose from the primary series was administered. The primary series has been completed]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started-235"]], [[Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Booster IPV dose was administered. Polio immunization schedule has been completed-112"]], [[Booster IPV dose was administered. Polio immunization schedule has been completed]] )
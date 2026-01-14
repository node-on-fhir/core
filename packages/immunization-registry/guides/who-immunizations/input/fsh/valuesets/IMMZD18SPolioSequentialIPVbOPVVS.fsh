ValueSet: IMMZD18SPolioSequentialIPVbOPVVS
Title: "IMMZD18SPolioSequentialIPVbOPV ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPolioSequentialIPVbOPV for IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Sequential bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First IPV dose from the primary series was administered-76"]], [[First IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second IPV dose from the primary series was administered-76"]], [[Second IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First bOPV dose from the primary series was administered-77"]], [[First bOPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second bOPV dose from the primary series was administered. The primary series has been completed-107"]], [[Second bOPV dose from the primary series was administered. The primary series has been completed]] )
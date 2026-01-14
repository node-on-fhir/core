ValueSet: IMMZD18SPolioBOPVPlusIPVVS
Title: "IMMZD18SPolioBOPVPlusIPV ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SPolioBOPVPlusIPV for IMMZ.D18.S.Polio.bOPV plus IPV schedule.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV) schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Child's birth-0"]], [[Child's birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First bOPV dose from the primary series was administered-115"]], [[First bOPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"First IPV dose from the primary series was administered-76"]], [[First IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second bOPV dose from the primary series was administered-115"]], [[Second bOPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Second IPV dose from the primary series was administered-76"]], [[Second IPV dose from the primary series was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Third bOPV dose from the primary series was administered. The primary series has been completed-107"]], [[Third bOPV dose from the primary series was administered. The primary series has been completed]] )
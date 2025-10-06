ValueSet: IMMZ.D.DE156
Title: "IMMZ.D.DE156 ValueSet for Immunization recommendation status"
Description: "ValueSet for Immunization recommendation status for IMMZ.D.DE156"

* ^status = #active
* ^name = "IMMZ_D_DE156"
* ^expansion.timestamp = 2025-06-25T16:39:07.092Z

* insert AddWithExpandCanonical( IMMZ.D, #DE157, Not due )
* insert AddWithExpandCanonical( IMMZ.D, #DE158, Due )
* insert AddWithExpandCanonical( IMMZ.D, #DE189, Complete )
* insert AddWithExpandCanonical( IMMZ.D, #DE159, Contraindicated )
* insert AddWithExpandCanonical( IMMZ.D, #DE160, Further evaluation needed )
